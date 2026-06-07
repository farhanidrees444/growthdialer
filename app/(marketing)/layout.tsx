"use client";

/**
 * Marketing routes use native scroll for maximum speed (no Lenis smoothing).
 * Live Floor chrome (Nav, footer) is composed per page.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="marketing-site">{children}</div>;
}
