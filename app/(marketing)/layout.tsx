"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/marketing/Navbar";
import Footer from "@/components/marketing/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Cinematic "Live Floor" routes bring their own nav + footer and use Lenis
  // smooth scrolling. Scoped to these marketing routes only — app routes are a
  // separate layout tree and stay untouched. Every other marketing page keeps
  // the shared chrome exactly as before.
  const cinematic = pathname === "/" || pathname === "/pricing";
  if (cinematic) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
