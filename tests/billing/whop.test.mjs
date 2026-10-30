import { isGrandfatheredBillingAccess } from "../../lib/billing/access-rollout.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHmac } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { unwrapWebhook } from "@whop/sdk/helpers";
import {
  parsePurchase,
  purchaseTotal,
  hasSubscriptionAccess,
} from "../../lib/billing/catalog.ts";
import { safeReturnPath } from "../../lib/auth/return-path.ts";
import { membershipState } from "../../lib/billing/whop-membership.ts";

test("server pricing rejects tampering and uses annual invoice totals", () => {
  assert.equal(purchaseTotal("growth", "annual", 3), 2268);
  assert.deepEqual(
    parsePurchase({ plan: "starter", cycle: "monthly", seats: 2, amount: 1 }),
    { plan: "starter", cycle: "monthly", seats: 2 },
  );
  for (const bad of [
    { plan: ["starter"], cycle: "monthly", seats: 1 },
    { plan: "starter", cycle: ["monthly"], seats: 1 },
    { plan: "__proto__", cycle: "monthly", seats: 1 },
    { plan: "pro", cycle: "weekly", seats: 1 },
    { plan: "pro", cycle: "annual", seats: 0 },
    { plan: "pro", cycle: "annual", seats: 501 },
    { plan: "pro", cycle: "annual", seats: 1.5 },
  ])
    assert.throws(() => parsePurchase(bad));
});
test("only confirmed, unexpired subscriptions grant access", () => {
  const future = new Date(Date.now() + 60000).toISOString();
  assert.equal(hasSubscriptionAccess("active", future), true);
  assert.equal(hasSubscriptionAccess("trialing", future), true);
  for (const status of ["past_due", "canceled", "incomplete"])
    assert.equal(hasSubscriptionAccess(status, future), false);
  assert.equal(hasSubscriptionAccess("active", null), false);
  assert.equal(hasSubscriptionAccess("active", "2020-01-01"), false);
  assert.equal(membershipState("unexpected"), "incomplete");
});
test("raw webhook verification rejects forgery, altered bodies and old timestamps", () => {
  const key = "ws_test_secret";
  const body = JSON.stringify({ id: "msg_test" });
  function headers(ts) {
    return {
      "webhook-id": "msg_test",
      "webhook-timestamp": String(ts),
      "webhook-signature": `v1,${createHmac("sha256", key).update(`msg_test.${ts}.${body}`).digest("base64")}`,
    };
  }
  const now = Math.floor(Date.now() / 1000);
  assert.deepEqual(unwrapWebhook(body, { headers: headers(now), key }), {
    id: "msg_test",
  });
  assert.throws(() =>
    unwrapWebhook(body + " ", { headers: headers(now), key }),
  );
  assert.throws(() =>
    unwrapWebhook(body, { headers: headers(now - 1000), key }),
  );
  assert.throws(() =>
    unwrapWebhook(body, { headers: headers(now), key: "ws_wrong" }),
  );
});
test("transactional subscription lifecycle, retry, dedup, ownership and ordering", async () => {
  const db = new PGlite();
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role; CREATE SCHEMA auth;
 CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql AS 'SELECT NULL::uuid';
 CREATE TABLE auth.users(id uuid PRIMARY KEY);
 CREATE TABLE subscriptions(user_id uuid PRIMARY KEY REFERENCES auth.users(id), plan text, billing_cycle text, seats int, status text, current_period_start timestamptz, current_period_end timestamptz);
 INSERT INTO auth.users VALUES('11111111-1111-4111-8111-111111111111');`);
  // Use the same timestamp order as deployment, rather than hand-ordering SQL.
  const migrations = (await readdir(new URL("../../supabase/migrations/", import.meta.url)))
    .filter(name => /whop.*\.sql$/.test(name)).sort();
  assert.equal(migrations.length, 4);
  for (const name of migrations) {
    await db.exec(await readFile(new URL(`../../supabase/migrations/${name}`, import.meta.url), "utf8"));
  }
  const user = "11111111-1111-4111-8111-111111111111",
    intent = "22222222-2222-4222-8222-222222222222";
  await db.query(
    `INSERT INTO billing_checkout_intents(id,user_id,plan,cycle,seats,amount,product_id,sandbox,checkout_id,provider_plan_id) VALUES($1,$2,'growth','monthly',2,158,'prod_growth',true,'ch_test','plan_growth')`,
    [intent, user],
  );
  await assert.rejects(db.query(
    `INSERT INTO billing_checkout_intents(id,user_id,plan,cycle,seats,amount,product_id,sandbox) VALUES('44444444-4444-4444-8444-444444444444',$1,'pro','monthly',1,119,'prod_growth',true)`, [user]
  ), /billing_one_pending_checkout/);
  const reserve = (id, plan = "growth") => db.query("SELECT reserve_whop_checkout($1,$2,$3,'monthly',2,158,'prod_growth',true) AS intent", [id,user,plan]);
  const reserved = await reserve("44444444-4444-4444-8444-444444444444");
  assert.equal(reserved.rows[0].intent.id, intent);
  assert.equal(reserved.rows[0].intent.checkout_id, "ch_test");
  await assert.rejects(reserve("44444444-4444-4444-8444-444444444444", "pro"), /Pending checkout selection differs/);
  const apply = (
    id,
    status,
    updated = "2026-10-30T00:00:00Z",
    plan = "plan_growth",
    mid = "mem_test",
    iid = intent,
  ) =>
    db.query(
      "SELECT apply_whop_membership($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
      [
        id,
        iid,
        mid,
        plan,
        "prod_growth",
        status,
        updated,
        "2026-10-30T00:00:00Z",
        "2026-11-30T00:00:00Z",
        false,
        true,
      ],
    );
  const state = async () =>
    (await db.query("SELECT * FROM subscriptions")).rows[0];
  await assert.rejects(
    apply("msg_retry", "active", undefined, "plan_tampered"),
  );
  assert.equal(
    (await db.query("SELECT * FROM whop_processed_events")).rows.length,
    0,
  );
  await apply("msg_retry", "active");
  assert.equal((await state()).seats, 2);
  await assert.rejects(reserve("44444444-4444-4444-8444-444444444444"), /Existing subscription requires reconciliation/);
  await apply("msg_retry", "canceled", "2026-10-31T00:00:00Z");
  assert.equal((await state()).status, "active");
  await apply("msg_failed", "past_due", "2026-10-31T00:00:00Z");
  assert.equal((await state()).status, "past_due");
  await apply("msg_stale", "active");
  assert.equal((await state()).status, "past_due");
  await apply("msg_renewed", "active", "2026-11-01T00:00:00Z");
  assert.equal((await state()).status, "active");
  await assert.rejects(
    apply(
      "msg_reuse",
      "active",
      "2026-11-02T00:00:00Z",
      "plan_growth",
      "mem_other",
    ),
  );
  await apply("msg_cancel", "canceled", "2026-11-03T00:00:00Z");
  assert.equal((await state()).status, "canceled");
  // A fresh purchase can replace a canceled subscription; old events cannot replace it.
  const newer = "33333333-3333-4333-8333-333333333333";
  await db.query(
    `INSERT INTO billing_checkout_intents(id,user_id,plan,cycle,seats,amount,product_id,sandbox,checkout_id,provider_plan_id,created_at) VALUES($1,$2,'pro','monthly',1,119,'prod_growth',true,'ch_new','plan_growth',now()+interval '1 second')`,
    [newer, user],
  );
  await apply(
    "msg_new",
    "active",
    "2026-11-04T00:00:00Z",
    "plan_growth",
    "mem_new",
    newer,
  );
  await apply("msg_old_cancel", "canceled", "2026-11-05T00:00:00Z");
  assert.equal((await state()).whop_membership_id, "mem_new");
  await db.exec("SET ROLE authenticated");
  await assert.rejects(apply("msg_unauthorized", "active"), /permission denied for function apply_whop_membership/);
  await assert.rejects(reserve("44444444-4444-4444-8444-444444444444"), /permission denied for function reserve_whop_checkout/);
  await db.exec("RESET ROLE");
  await db.close();
});

test("auth continuation preserves owned receipt paths and rejects external destinations", () => {
  assert.equal(safeReturnPath("/billing/receipt/pay_test?print=1"), "/billing/receipt/pay_test?print=1");
  assert.equal(safeReturnPath("/checkout?plan=growth"), "/checkout?plan=growth");
  for (const value of ["//evil.example", "https://evil.example", "/billing-evil", "/billing/receipt/pay_test/../../login", "/billing\\evil"]) assert.equal(safeReturnPath(value), "/dashboard");
});

test("billing rollout preserves existing access but never bypasses a provider subscription", () => {
  const cutoff = "2026-10-31T00:00:00Z";
  assert.equal(isGrandfatheredBillingAccess("2026-10-01T00:00:00Z", false, cutoff), true);
  assert.equal(isGrandfatheredBillingAccess("2026-10-31T00:00:00Z", false, cutoff), false);
  assert.equal(isGrandfatheredBillingAccess("2026-11-01T00:00:00Z", false, cutoff), false);
  assert.equal(isGrandfatheredBillingAccess("2026-10-01T00:00:00Z", true, cutoff), false);
  assert.equal(isGrandfatheredBillingAccess("bad", false, cutoff), false);
  assert.equal(isGrandfatheredBillingAccess("2026-10-01T00:00:00Z", false, "bad"), false);
});
