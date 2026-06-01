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

  // The homepage ("/") is the cinematic "Live Floor" experience — it brings
  // its own nav + footer, plus Lenis smooth scrolling scoped to this route
  // only (app routes are a separate layout tree and stay untouched).
  if (pathname === "/") {
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
