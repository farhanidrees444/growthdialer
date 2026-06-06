"use client";

import { SmoothScroll } from "@/components/marketing/live-floor/SmoothScroll";

/**
 * All marketing routes use Live Floor chrome (Nav, Grain, SiteFooter) via
 * MarketingShell or page-level shells. Layout only enables Lenis smooth scroll.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing-site">
      <SmoothScroll />
      {children}
    </div>
  );
}
