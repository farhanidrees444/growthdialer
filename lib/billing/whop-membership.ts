import { z } from "zod";
export const membershipSchema = z.object({
  id: z.string().startsWith("mem_"),
  account: z.object({ id: z.string() }),
  plan_id: z.string(),
  product_id: z.string(),
  metadata: z.record(z.string(), z.unknown()),
  status: z.string(),
  updated_at: z.iso.datetime({ offset: true }),
  current_period_start: z.string().nullable(),
  current_period_end: z.string().nullable(),
  cancel_at_period_end: z.boolean(),
  manage_url: z.string().nullable(),
});
export function membershipState(status: string) {
  switch (status) {
    case "active":
    case "trialing":
    case "past_due":
      return status;
    case "canceling":
      return "active";
    case "canceled":
    case "expired":
      return "canceled";
    default:
      return "incomplete";
  }
}
