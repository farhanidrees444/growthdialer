"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";
import { SmoothScroll } from "@/components/marketing/live-floor/SmoothScroll";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // On-brand "Live Floor" routes bring their own nav + footer (via the page
  // or MarketingShell) and use Lenis smooth scrolling. Scoped to marketing
  // routes only — app routes are a separate layout tree and stay untouched.
  // Any remaining marketing pages keep the shared chrome exactly as before.
  const CINEMATIC = [
    "/",
    "/pricing",
    "/features",
    "/about",
    "/contact-sales",
    "/customers",
    "/careers",
    "/docs",
    "/changelog",
    "/privacy",
    "/terms",
  ];
  const cinematic = CINEMATIC.includes(pathname);
  if (cinematic) {
    return (
      <>
        <SmoothScroll />
        {children}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
