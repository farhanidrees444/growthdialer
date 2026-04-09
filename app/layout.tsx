import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import CookieConsent from "@/components/CookieConsent";
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
    default: "GrowthDialer — AI Sales Dialer | Autonomous B2B Outreach Platform",
    template: "%s | GrowthDialer",
  },
  description:
    "GrowthDialer's AI agent autonomously finds leads, calls them in human voice, handles objections and books qualified meetings 24/7. Start free trial.",
  keywords: [
    "AI sales dialer",
    "autonomous sales agent",
    "B2B dialer software",
    "parallel dialing",
    "AI cold calling",
    "sales automation platform",
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
    title: "GrowthDialer — AI Sales Dialer | Autonomous B2B Outreach Platform",
    description: "GrowthDialer's AI agent autonomously finds leads, calls them in human voice, handles objections and books qualified meetings 24/7. Start free trial.",
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
    title: "GrowthDialer — AI Sales Dialer | Autonomous B2B Outreach Platform",
    description: "GrowthDialer's AI agent autonomously finds leads, calls them in human voice, handles objections and books qualified meetings 24/7. Start free trial.",
    images: ["https://growthdialer.com/og-image.png"],
  },
  other: {
    "application/ld+json": JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "GrowthDialer",
      "description": "AI Sales Dialer | Autonomous B2B Outreach Platform",
      "url": "https://growthdialer.com",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web",
      "offers": {
        "@type": "Offer",
        "price": "29",
        "priceCurrency": "USD",
        "priceValidUntil": "2026-12-31",
        "availability": "https://schema.org/InStock",
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "500",
        "bestRating": "5",
        "worstRating": "1",
      },
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
  "description": "AI-powered autonomous B2B sales dialer that helps sales teams book more qualified meetings through intelligent parallel dialing and AI voice calling.",
  "foundingDate": "2024",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-555-123-4567",
    "contactType": "customer service",
    "availableLanguage": ["English"],
  },
  "sameAs": [
    "https://twitter.com/growthdialer",
    "https://linkedin.com/company/growthdialer",
    "https://facebook.com/growthdialer",
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does parallel dialing work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "GrowthDialer dials up to 10 lines simultaneously. When any prospect answers, your rep is immediately connected — no hold music, no delays. Unanswered lines are automatically hung up or routed to AI voicemail drop.",
      },
    },
    {
      "@type": "Question",
      "name": "Will my numbers get flagged as spam?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "We continuously monitor carrier health for all numbers in your pool and rotate them before they hit spam thresholds. Our Spam Protection feature keeps your numbers clean and your connect rates high.",
      },
    },
    {
      "@type": "Question",
      "name": "Does GrowthDialer integrate with my CRM?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes — we have native integrations with Salesforce, HubSpot, Pipedrive, Outreach, Salesloft, and Apollo.io. Every call is automatically logged with disposition, duration, and AI-generated notes.",
      },
    },
    {
      "@type": "Question",
      "name": "Is there a free trial?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "All plans include a 14-day free trial with no credit card required. You get access to all features on the Growth plan so you can see exactly what GrowthDialer can do for your team.",
      },
    },
    {
      "@type": "Question",
      "name": "How long does it take to get set up?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most teams are live within 2 hours. Our onboarding team handles CRM integration, number provisioning, and initial lead import. You can be making calls the same day you sign up.",
      },
    },
    {
      "@type": "Question",
      "name": "Can I import my existing leads?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes — you can import leads via CSV, sync directly from your CRM, or connect via our API. Our AI will automatically score and prioritize your entire list on import.",
      },
    },
    {
      "@type": "Question",
      "name": "What compliance features do you have?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "GrowthDialer includes built-in DNC list scrubbing, TCPA-compliant consent management, call recording disclosure prompts, and audit logs. We're SOC 2 Type II certified.",
      },
    },
  ],
};

const reviewSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "GrowthDialer",
  "description": "AI-powered autonomous B2B sales dialer",
  "brand": {
    "@type": "Brand",
    "name": "GrowthDialer",
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "500",
    "bestRating": "5",
    "worstRating": "1",
  },
  "review": [
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Ryan Mitchell",
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5",
      },
      "reviewBody": "We switched from another dialer and within 30 days our SDR team was booking 40% more meetings. The parallel dialing is a game-changer — our reps spend zero time waiting.",
    },
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Lena Kowalski",
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5",
      },
      "reviewBody": "The AI coaching feature caught objections I didn't even notice myself. It surfaced the right battlecard at exactly the right moment. Closed a $120K deal because of it.",
    },
    {
      "@type": "Review",
      "author": {
        "@type": "Person",
        "name": "Carlos Torres",
      },
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": "5",
        "bestRating": "5",
      },
      "reviewBody": "GrowthDialer replaced our dialer, our sequencer, and our call recording tool. One platform, less complexity, and our reps actually enjoy using it.",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(reviewSchema),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SessionProvider>
          <TooltipProvider delay={200}>{children}</TooltipProvider>
          <CookieConsent />
        </SessionProvider>
      </body>
    </html>
  );
}
