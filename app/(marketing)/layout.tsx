"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/marketing/live-floor/Nav";
import { SiteFooter } from "@/components/marketing/live-floor/SiteFooter";
import { Grain } from "@/components/marketing/live-floor/Grain";
import { SmoothScroll } from "@/components/marketing/live-floor/SmoothScroll";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Homepage and pricing bring their own full wrapper (MotionShell + Nav + Footer)
  const selfContained = pathname === "/" || pathname === "/pricing";
  if (selfContained) {
    return (
      <>
        <SmoothScroll />
        {children}
      </>
    );
  }

  // All other marketing pages use consistent dark theme with live-floor Nav + Footer
  return (
    <>
      <SmoothScroll />
      <div className="relative min-h-screen overflow-x-hidden bg-[#08080A] text-[#F5F5F7] antialiased">
        <Grain />
        <Nav />
        <main className="relative z-[2] pt-20">{children}</main>
        <SiteFooter />
      </div>
    </>
  );
}
