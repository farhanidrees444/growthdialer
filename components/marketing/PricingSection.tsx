"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Zap, Shield, Lock, FileCheck, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PlanKey } from "@/lib/stripe";

const plans: Array<{
  name: string;
  planKey: PlanKey;
  monthly: number | null;
  annual: number | null;
  description: string;
  badge: string | null;
  cta: string;
  featured: boolean;
  features: string[];
}> = [
  {
    name: "Starter",
    planKey: "starter",
    monthly: 49,
    annual: 39,
    description: "For solo reps and small teams just getting started.",
    badge: null,
    cta: "Start free trial",
    featured: false,
    features: [
      "3 parallel lines",
      "2,000 dials / month",
      "Local presence (50 area codes)",
      "CRM sync (HubSpot, Salesforce)",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    name: "Growth",
    planKey: "growth",
    monthly: 99,
    annual: 79,
    description: "For growing teams that need to scale outreach fast.",
    badge: "Most Popular",
    cta: "Start free trial",
    featured: true,
    features: [
      "10 parallel lines",
      "Unlimited dials",
      "Local presence (300+ area codes)",
      "All CRM integrations",
      "AI call coaching",
      "AI voicemail drop",
      "Spam number protection",
      "Advanced analytics",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    planKey: "enterprise",
    monthly: null,
    annual: null,
    description: "For large teams that need custom limits and white-glove service.",
    badge: null,
    cta: "Contact sales",
    featured: false,
    features: [
      "Unlimited parallel lines",
      "Unlimited dials",
      "Custom area codes & CNAM",
      "SSO & advanced security",
      "Dedicated success manager",
      "Custom integrations",
      "SLA guarantee",
      "Custom contracts",
    ],
  },
];

export default function PricingSection() {
  const router = useRouter();
  const [annual, setAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);

  async function handlePlanCta(planKey: PlanKey) {
    if (planKey === "enterprise") {
      router.push("/contact-sales");
      return;
    }
    setLoadingPlan(planKey);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey, annual }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      router.push(`/signup?plan=${planKey}`);
    } finally {
      setLoadingPlan(null);
    }
  }

  return (
    <section id="pricing" className="py-24 lg:py-32 border-t border-white/8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <p className="text-brand text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="font-display text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            No per-minute charges, no hidden fees. Start free, upgrade when you're ready.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
                !annual ? "bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-2",
                annual ? "bg-brand/20 text-brand" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Annual
              <Badge className="bg-brand/20 text-brand text-[10px] border-0 px-1.5">Save 20%</Badge>
            </button>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.45 }}
              className={cn(
                "relative rounded-2xl border p-7 flex flex-col",
                plan.featured
                  ? "border-brand/50 bg-gradient-to-b from-brand/8 to-[oklch(0.086_0.024_282)] shadow-2xl shadow-brand/10 glow-brand"
                  : "border-white/10 bg-[oklch(0.086_0.024_282)]"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-brand text-[oklch(0.08_0.04_153)] font-semibold text-xs px-3 py-1 flex items-center gap-1.5">
                    <Zap className="w-3 h-3" fill="currentColor" />
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display font-bold text-lg mb-1">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-7">
                {plan.monthly !== null ? (
                  <>
                    <span className="font-display text-5xl font-bold">
                      ${annual ? plan.annual : plan.monthly}
                    </span>
                    <span className="text-muted-foreground text-sm ml-1">/seat/mo</span>
                    {annual && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Billed annually — ${(annual ? plan.annual! : plan.monthly!) * 12}/year
                      </div>
                    )}
                  </>
                ) : (
                  <span className="font-display text-4xl font-bold">Custom</span>
                )}
              </div>

              <Button
                type="button"
                disabled={loadingPlan !== null}
                onClick={() => handlePlanCta(plan.planKey)}
                className={cn(
                  "w-full mb-7 font-semibold",
                  plan.featured
                    ? "bg-brand text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)]"
                    : "border-white/15 bg-white/6 hover:bg-white/12"
                )}
                variant={plan.featured ? "default" : "outline"}
              >
                {loadingPlan === plan.planKey ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  plan.cta
                )}
              </Button>

              <ul className="space-y-3 mt-auto">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5 text-sm">
                    <Check className="w-4 h-4 text-brand shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{feat}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="text-center text-sm text-muted-foreground mt-10"
        >
          All plans include a 14-day free trial. No credit card required.
        </motion.p>

        {/* Compliance trust strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-10 rounded-2xl border border-white/8 bg-[oklch(0.068_0.020_284)] px-6 py-5"
        >
          <p className="text-center text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-5">
            Built for compliant outreach
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
            {[
              { icon: Shield, label: "SOC 2 Type II", sub: "Certified" },
              { icon: FileCheck, label: "TCPA Compliant", sub: "DNC scrubbing built-in" },
              { icon: Lock, label: "GDPR Ready", sub: "EU data controls" },
              { icon: Shield, label: "Carrier Approved", sub: "No spam flags" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-medium leading-none">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Pricing FAQ */}
        <PricingFAQ />
      </div>
    </section>
  );
}

const pricingFaqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Cancel directly from your dashboard with one click — no calls, no forms. If you cancel mid-cycle, you keep access through the end of the billing period.",
  },
  {
    q: "What happens after the 14-day trial?",
    a: "You're automatically moved to the free tier (read-only) unless you add a card and upgrade. We'll send you a reminder 3 days before the trial ends — no surprise charges.",
  },
  {
    q: "Do you charge per minute or per call?",
    a: "No. Every plan includes unlimited call duration with no per-minute fees. Your dial allowance covers the number of outbound dials, not the minutes spent talking.",
  },
  {
    q: "Is there a free tier?",
    a: "We offer a 14-day full-featured trial. After that, you can book a demo to discuss a permanent free seat for evaluation — email us at hello@growthdialer.com.",
  },
  {
    q: "How does TCPA compliance work?",
    a: "GrowthDialer scrubs every dial against the national DNC registry, supports consent-based lead filtering, and logs call timestamps with disposition for audit purposes. All at no extra charge.",
  },
  {
    q: "Can I talk to a human before buying?",
    a: (
      <span>
        Absolutely.{" "}
        <Link href="/contact-sales" className="text-brand hover:underline">
          Book a 20-minute demo
        </Link>{" "}
        and we'll walk you through the platform live, answer questions, and set up a custom trial for your team.
      </span>
    ),
  },
];

function PricingFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.2, duration: 0.45 }}
      className="mt-14"
    >
      <h3 className="font-display text-2xl font-bold text-center mb-8">
        Still have questions?
      </h3>
      <div className="space-y-2 max-w-2xl mx-auto">
        {pricingFaqs.map((faq, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/8 bg-[oklch(0.086_0.024_282)] overflow-hidden"
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex items-center justify-between w-full px-5 py-4 text-left gap-4 hover:bg-white/3 transition-colors"
            >
              <span className="text-sm font-medium">{faq.q}</span>
              <div className="shrink-0 w-6 h-6 rounded-full bg-white/6 flex items-center justify-center">
                {open === i ? (
                  <Minus className="w-3.5 h-3.5 text-brand" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                )}
              </div>
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-white/6 pt-3">
                    {faq.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-muted-foreground mt-8">
        Need something custom?{" "}
        <Link href="/contact-sales" className="text-brand hover:underline">
          Talk to sales
        </Link>{" "}
        or email{" "}
        <a href="mailto:hello@growthdialer.com" className="text-brand hover:underline">
          hello@growthdialer.com
        </a>
      </p>
    </motion.div>
  );
}
