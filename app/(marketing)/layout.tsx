"use client";

import './marketing-motion.css';
import { ScrollProgress } from '@/components/marketing/v2/motion';

/**
 * Marketing routes use native scroll for maximum speed (no Lenis smoothing).
 * Premium v2 chrome (Navbar, Footer) is composed per page.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing-site theme-marketing">
      <ScrollProgress />
      {children}
    </div>
  );
}
