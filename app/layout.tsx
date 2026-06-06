import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import CookieConsent from "@/components/CookieConsent";
import { Toaster } from "sonner";
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

const SITE_URL = "https://growthdialer.com";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#08080A",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GrowthDialer — AI Sales Dialer & Conversation Intelligence",
    template: "%s | GrowthDialer",
  },
  description:
    "GrowthDialer is the AI sales dialer that records, transcribes and analyzes every call — turning conversations into summaries, sentiment and next steps automatically. Start free.",
  keywords: [
    "AI sales dialer",
    "AI call summaries",
    "call recording software",
    "B2B dialer software",
    "conversation intelligence",
    "sales calling platform",
  ],
  authors: [{ name: "GrowthDialer" }],
  alternates: {
    canonical: "https://growthdialer.com",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "GrowthDialer — AI Sales Dialer",
    description: "Record, transcribe and analyze every call. GrowthDialer turns conversations into AI summaries, sentiment and next steps — automatically.",
    type: "website",
    url: "https://growthdialer.com",
    images: [
      {
        url: "https://growthdialer.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "GrowthDialer — AI Sales Dialer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GrowthDialer — AI Sales Dialer",
    description: "Record, transcribe and analyze every call. GrowthDialer turns conversations into AI summaries, sentiment and next steps — automatically.",
    images: ["https://growthdialer.com/og-image.png"],
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "GrowthDialer",
      "description": "AI Sales Dialer that records, transcribes and analyzes every call.",
      "url": "https://growthdialer.com",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": [
        {
          "@type": "Offer",
          "name": "Starter",
          "price": "0",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          "name": "Pro",
          "price": "49",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          "name": "Team",
          "price": "99",
          "priceCurrency": "USD",
          "availability": "https://schema.org/InStock",
        },
      ],
      "publisher": {
        "@type": "Organization",
        "name": "GrowthDialer",
        "url": "https://growthdialer.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://growthdialer.com/logo.png",
        },
        "sameAs": [
          "https://twitter.com/growthdialer",
          "https://linkedin.com/company/growthdialer",
        ],
      },
    }),
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "GrowthDialer",
  "url": "https://growthdialer.com",
  "logo": "https://growthdialer.com/logo.png",
  "description": "AI sales dialer that records, transcribes and analyzes every call, turning conversations into summaries, sentiment and next steps.",
  "foundingDate": "2024",
  "sameAs": [
    "https://twitter.com/growthdialer",
    "https://linkedin.com/company/growthdialer",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What does GrowthDialer do?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "GrowthDialer is an AI sales dialer. You make outbound calls from the AI Dialer or Power Dialer, every call is recorded, then automatically transcribed and analyzed into a summary, sentiment and next steps.",
      },
    },
    {
      "@type": "Question",
      "name": "How does the AI analysis work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "After a recorded call, GrowthDialer transcribes the audio with Whisper and analyzes it with Gemini to produce a bullet summary, sentiment (positive, neutral or negative) and detected intent — no manual note-taking required.",
      },
    },
    {
      "@type": "Question",
      "name": "Does it keep my numbers healthy?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "GrowthDialer monitors number health and spam risk so you can see the carrier reputation of each of your numbers and keep your calls landing.",
      },
    },
    {
      "@type": "Question",
      "name": "Can I import my existing leads?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes — import leads via CSV or add them manually, then work your pipeline directly inside GrowthDialer. Every call links back to the lead with full history.",
      },
    },
    {
      "@type": "Question",
      "name": "Is there a free plan?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "You can start free with no credit card required and make your first AI-analyzed call in minutes.",
      },
    },
  ],
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
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqSchema),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <TooltipProvider delay={200}>{children}</TooltipProvider>
        <CookieConsent />
        <Toaster theme="dark" position="bottom-right" richColors closeButton />
      </body>
    </html>
  );
}
