/** Only product routes needed by purchasing and owned receipts may continue after sign-in. */
export function safeReturnPath(value: string | null): string {
  if (!value) return "/dashboard";
  if (/^\/(?:checkout|checkout\/complete|api\/checkout)\?/.test(value)) return value;
  if (/^\/billing(?:\/receipt\/[A-Za-z0-9_-]+)?(?:\?[^#]*)?$/.test(value)) return value;
  return "/dashboard";
}
