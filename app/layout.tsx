import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "GrowthDialer — AI-Powered B2B Sales Dialer",
    template: "%s | GrowthDialer",
  },
  description:
    "Close more deals with AI-powered parallel dialing, real-time call coaching, and smart lead prioritization. The #1 sales dialer for high-growth B2B teams.",
  keywords: [
    "sales dialer",
    "power dialer",
    "B2B sales",
    "parallel dialing",
    "sales engagement",
    "AI sales coaching",
    "cold calling",
    "SDR tools",
  ],
  authors: [{ name: "GrowthDialer" }],
  openGraph: {
    title: "GrowthDialer — AI-Powered B2B Sales Dialer",
    description: "Close more deals with AI-powered parallel dialing and real-time coaching.",
    type: "website",
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "GrowthDialer — AI-Powered B2B Sales Dialer",
    description: "Close more deals with AI-powered parallel dialing.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${bricolage.variable} ${dmSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <TooltipProvider delay={200}>{children}</TooltipProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
