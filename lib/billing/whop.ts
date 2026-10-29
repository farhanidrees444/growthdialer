import { WhopClient } from "@whop/sdk";
import { isBillingEnabled } from "./billing-flag";

export const WHOP_API_VERSION = "2026-09-25";
export function isWhopSelected() {
  return process.env.BILLING_PROVIDER === "whop";
}
export function whopSandbox() {
  return process.env.WHOP_SANDBOX !== "false";
}
export function whopReady() {
  return (
    isBillingEnabled() &&
    isWhopSelected() &&
    !!process.env.WHOP_COMPANY_API_KEY?.trim() &&
    !!process.env.WHOP_COMPANY_ID?.trim() &&
    !!process.env.WHOP_WEBHOOK_SECRET?.trim() &&
    ["STARTER", "GROWTH", "PRO"].every((plan) =>
      process.env[`WHOP_PRODUCT_${plan}`]?.startsWith("prod_"),
    ) &&
    (whopSandbox() || process.env.WHOP_LIVE_PAYMENTS_APPROVED === "true")
  );
}
export function getWhop() {
  const token = process.env.WHOP_COMPANY_API_KEY?.trim();
  if (!token || !process.env.WHOP_COMPANY_ID)
    throw new Error("Billing configuration missing");
  return new WhopClient({
    token,
    apiVersionDate: WHOP_API_VERSION,
    baseUrl: whopSandbox()
      ? "https://sandbox-api.whop.com/api/v1"
      : "https://api.whop.com/api/v1",
    timeoutInSeconds: 20,
    maxRetries: 1,
  });
}
export function billingAppUrl() {
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const url = new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  );
  if (!whopSandbox() && url.protocol !== "https:")
    throw new Error("HTTPS required");
  return url.origin;
}
