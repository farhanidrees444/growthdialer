import { createClient } from "@/lib/supabase/server";
import { whopSandbox } from "./whop";

/** User identity always comes from the authenticated session. */
export async function ownedSubscription() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return null;
  const { data, error } = await db
    .from("subscriptions")
    .select("whop_membership_id,whop_sandbox")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !data?.whop_membership_id || data.whop_sandbox !== whopSandbox())
    return null;
  return { db, user, membershipId: data.whop_membership_id as string };
}
