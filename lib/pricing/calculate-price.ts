/**
 * Retail pricing: add $3 flat markup OR 100% markup, whichever is higher.
 * Cap at 3x wholesale. NEVER show wholesale/Telnyx price in UI.
 *
 * Examples:
 *   $1.00 wholesale → max($4, $2) = $4 → min($4, $3) = $3.00 ✗
 *   Actually: max(1+3, 1*2) = max(4,2) = $4 → min($4, $3) = $3.00
 *   $2.00 → max($5, $4) = $5 → min($5, $6) = $5.00
 *   $5.00 → max($8, $10) = $10 → min($10, $15) = $10.00
 *   $10.00 → max($13, $20) = $20 → min($20, $30) = $20.00
 */
export function calculateRetailPrice(wholesale: number): number {
  if (!wholesale || wholesale <= 0) return 3.00;
  const withMinMarkup = wholesale + 3;
  const withPercentMarkup = wholesale * 2;
  const retail = Math.max(withMinMarkup, withPercentMarkup);
  const capped = Math.min(retail, wholesale * 3);
  return Math.round(capped * 100) / 100;
}
