import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "GrowthDialer vs DandyDialer — Better AI Dialer at Lower Price (2026)",
  description: "Compare GrowthDialer vs DandyDialer. Discover why B2B sales teams switch to GrowthDialer's autonomous AI dialer for superior features, competitive pricing, and 24/7 human-like calling.",
  keywords: "dandydialer alternative, growthdialer vs dandydialer, ai dialer comparison, b2b sales dialer, autonomous calling",
  openGraph: {
    title: "GrowthDialer vs DandyDialer — Better AI Dialer at Lower Price (2026)",
    description: "Why teams switch from DandyDialer to GrowthDialer. Feature comparison, pricing analysis, and real user testimonials.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GrowthDialer vs DandyDialer — Better AI Dialer at Lower Price (2026)",
    description: "Compare GrowthDialer vs DandyDialer and see why it's the superior choice for B2B sales teams.",
  },
};

const features = [
  { feature: "AI Voice Calling", growthdialer: true, dandydialer: true },
  { feature: "Parallel Dialing", growthdialer: true, dandydialer: true },
  { feature: "Autonomous Agent", growthdialer: true, dandydialer: false },
  { feature: "16 Languages Support", growthdialer: true, dandydialer: false },
  { feature: "Omnichannel Outreach", growthdialer: true, dandydialer: false },
  { feature: "Real-time Call Coaching", growthdialer: true, dandydialer: true },
  { feature: "CRM Integration", growthdialer: true, dandydialer: true },
  { feature: "Voicemail Drop", growthdialer: true, dandydialer: true },
  { feature: "Spam Protection", growthdialer: true, dandydialer: false },
  { feature: "24/7 Operation", growthdialer: true, dandydialer: false },
];

const testimonials = [
  {
    name: "Jessica Martinez",
    role: "Sales Manager at TechStart",
    content: "DandyDialer was decent, but GrowthDialer's autonomous agent handles complex sales conversations that DandyDialer can't touch. Our conversion rates doubled.",
    rating: 5,
  },
  {
    name: "David Kim",
    role: "VP of Sales at InnovateCorp",
    content: "The 16 language support in GrowthDialer opened international markets for us. DandyDialer is limited to English only. Worth every penny of the upgrade.",
    rating: 5,
  },
  {
    name: "Lisa Wong",
    role: "Revenue Operations at ScaleUp",
    content: "GrowthDialer's AI sounds more human than DandyDialer. Prospects engage longer and our qualified meeting rates increased by 60%.",
    rating: 5,
  },
];

const faqs = [
  {
    question: "How does GrowthDialer compare to DandyDialer in terms of features?",
    answer: "GrowthDialer offers all the features of DandyDialer plus autonomous AI agents, 16 language support, omnichannel outreach, and 24/7 operation capabilities.",
  },
  {
    question: "Is GrowthDialer more expensive than DandyDialer?",
    answer: "GrowthDialer offers better value with more advanced features at competitive pricing. The autonomous agent alone justifies the investment.",
  },
  {
    question: "Can I migrate my data from DandyDialer to GrowthDialer?",
    answer: "Absolutely. Our team provides free migration assistance to help you transfer contacts, call logs, and settings seamlessly.",
  },
  {
    question: "Does GrowthDialer support the same CRM integrations as DandyDialer?",
    answer: "Yes, GrowthDialer supports all major CRMs including Salesforce, HubSpot, Pipedrive, and more - the same integrations DandyDialer offers.",
  },
];

export default function VsDandyDialerPage() {
  return (
    <div className="pt-24 pb-16">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            DandyDialer Alternative
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            GrowthDialer vs DandyDialer
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Better AI dialer with autonomous agents. See why B2B sales teams are switching from DandyDialer to GrowthDialer's advanced platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-9 px-2.5 py-1.5 text-sm font-medium transition-all"
            >
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg border border-border bg-background hover:bg-muted hover:text-foreground h-9 px-2.5 py-1.5 text-sm font-medium transition-all"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-border">
            <thead>
              <tr className="bg-muted/50">
                <th className="border border-border p-4 text-left">Feature</th>
                <th className="border border-border p-4 text-center">GrowthDialer</th>
                <th className="border border-border p-4 text-center">DandyDialer</th>
              </tr>
            </thead>
            <tbody>
              {features.map((item, index) => (
                <tr key={index} className="hover:bg-muted/25">
                  <td className="border border-border p-4 font-medium">{item.feature}</td>
                  <td className="border border-border p-4 text-center">
                    {item.growthdialer ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </td>
                  <td className="border border-border p-4 text-center">
                    {item.dandydialer ? (
                      <Check className="h-5 w-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="h-5 w-5 text-red-500 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pricing Comparison */}
      <section className="container mx-auto px-4 py-16 bg-muted/25">
        <h2 className="text-3xl font-bold text-center mb-12">Pricing Comparison</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">GrowthDialer</CardTitle>
              <div className="text-3xl font-bold text-green-500">$29/month</div>
              <p className="text-muted-foreground">per user, billed annually</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Unlimited AI calls
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  Autonomous agent
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  16 languages
                </li>
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  24/7 operation
                </li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">DandyDialer</CardTitle>
              <div className="text-3xl font-bold text-red-500">$39/month</div>
              <p className="text-muted-foreground">per user, billed annually</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  AI voice calling
                </li>
                <li className="flex items-center">
                  <X className="h-4 w-4 text-red-500 mr-2" />
                  No autonomous agent
                </li>
                <li className="flex items-center">
                  <X className="h-4 w-4 text-red-500 mr-2" />
                  Limited languages
                </li>
                <li className="flex items-center">
                  <X className="h-4 w-4 text-red-500 mr-2" />
                  Limited hours
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        <div className="text-center mt-8">
          <p className="text-lg text-muted-foreground mb-4">
            Save <span className="font-bold text-green-500">$120/year</span> by switching to GrowthDialer
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">What Teams Say About Switching from DandyDialer</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 py-16 bg-muted/25">
        <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="text-lg">{faq.question}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Switch from DandyDialer?</h2>
        <p className="text-xl text-muted-foreground mb-8">
          Join thousands of sales teams who've upgraded to GrowthDialer's superior AI dialer.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/80 h-9 px-2.5 py-1.5 text-sm font-medium transition-all"
        >
          Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}