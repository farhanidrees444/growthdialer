// Idempotent sandbox catalog setup. Credentials are read from environment only.
import { WhopClient } from "@whop/sdk";
import { BILLING_CATALOG } from "../lib/billing/catalog.ts";
if (process.env.WHOP_SANDBOX !== "true")
  throw new Error("This script only supports the sandbox");
if (!process.env.WHOP_COMPANY_API_KEY || !process.env.WHOP_COMPANY_ID)
  throw new Error("Sandbox credentials required");
const account_id = process.env.WHOP_COMPANY_ID;
const api = new WhopClient({
  token: process.env.WHOP_COMPANY_API_KEY,
  baseUrl: "https://sandbox-api.whop.com/api/v1",
  apiVersionDate: "2026-09-25",
});
for (const [key, plan] of Object.entries(BILLING_CATALOG)) {
  const products = await api.products.list({ account_id });
  let product;
  for await (const p of products) {
    if (p.title === `GrowthDialer ${plan.name}`) {
      product = p;
      break;
    }
  }
  product ??= await api.products.create({
    account_id,
    title: `GrowthDialer ${plan.name}`,
    headline: plan.description,
    description: `${plan.description} Calling, messaging and phone-number usage may cost extra. Manage subscriptions from your billing settings.`,
    visibility: "hidden",
    global_affiliate_percentage: 0,
    member_affiliate_percentage: 0,
  });
  console.log(`WHOP_PRODUCT_${key.toUpperCase()}=${product.id}`);
  // Checkout creates seat-priced, hidden variants using this same catalog.
}
