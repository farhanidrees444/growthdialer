import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const competitors = [
  {
    name: "Orum",
    differentiator: "Superior AI voice technology with 40% higher conversion rates",
    href: "/compare/vs-orum",
  },
  {
    name: "Nooks",
    differentiator: "Advanced parallel dialing with intelligent lead scoring",
    href: "/compare/vs-nooks",
  },
  {
    name: "KrispCall",
    differentiator: "Crystal-clear voice quality with noise cancellation",
    href: "/compare/vs-krispcall",
  },
  {
    name: "PhoneBurner",
    differentiator: "Enterprise-grade reliability with 99.9% uptime",
    href: "/compare/vs-phoneburner",
  },
];

export default function CompareSection() {
  return (
    <section className="py-24 bg-[oklch(0.056_0.018_286)] border-t border-white/8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
            See How We Compare
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover why leading B2B sales teams choose GrowthDialer over the competition
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {competitors.map((competitor) => (
            <div
              key={competitor.name}
              className="group relative p-6 rounded-2xl bg-[oklch(0.086_0.024_282)] border border-white/10 hover:border-brand/30 transition-all duration-300 hover:shadow-xl hover:shadow-brand/10"
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  vs {competitor.name}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {competitor.differentiator}
                </p>
              </div>

              <Link href={competitor.href}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-white/20 text-foreground hover:bg-brand hover:text-[oklch(0.08_0.04_153)] hover:border-brand transition-all duration-300 group-hover:shadow-lg group-hover:shadow-brand/20"
                >
                  See comparison
                  <ArrowRight className="w-3.5 h-3.5 ml-2 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-6">
            Ready to see the difference for yourself?
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-brand text-[oklch(0.08_0.04_153)] hover:bg-[oklch(0.76_0.27_153)] font-semibold glow-brand-sm transition-all"
            >
              Start free trial
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}