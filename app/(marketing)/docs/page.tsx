import Link from "next/link";

export const metadata = {
  title: "Documentation",
};

export default function DocsPage() {
  return (
    <div className="pt-28 pb-20 px-4 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-2">Documentation</h1>
      <p className="text-muted-foreground mb-10">
        Quick reference for this demo. Replace with your real docs in production.
      </p>

      <section id="about" className="mb-12 scroll-mt-28">
        <h2 className="font-display text-xl font-semibold mb-3">About GrowthDialer</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          GrowthDialer is a sales engagement demo: parallel dialing UI, AI coaching placeholders, and CRM
          integration toggles. Wire your telephony provider and database to go live.
        </p>
      </section>

      <section id="api" className="mb-12 scroll-mt-28">
        <h2 className="font-display text-xl font-semibold mb-3">API</h2>
        <p className="text-muted-foreground text-sm mb-4">
          REST endpoints will live under <code className="text-brand">/api/v1</code>. For now, this app
          exposes Next.js routes for auth, Stripe checkout, and contact sales.
        </p>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
          <li>
            <code>POST /api/auth/register</code> — demo signup
          </li>
          <li>
            <code>POST /api/stripe/checkout</code> — subscription checkout
          </li>
          <li>
            <code>POST /api/contact</code> — sales lead form
          </li>
        </ul>
      </section>

      <section id="changelog" className="mb-12 scroll-mt-28">
        <h2 className="font-display text-xl font-semibold mb-3">Changelog</h2>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>
            <span className="text-foreground font-medium">2026-04-08</span> — Auth, Stripe fallback, and
            dashboard navigation shipped for Vercel deploy.
          </li>
        </ul>
      </section>

      <section id="roadmap" className="scroll-mt-28">
        <h2 className="font-display text-xl font-semibold mb-3">Roadmap</h2>
        <p className="text-muted-foreground text-sm">
          Real PSTN dialing, CRM OAuth, and team roles are on the roadmap.{" "}
          <Link href="/contact-sales" className="text-brand hover:underline">
            Contact sales
          </Link>{" "}
          for early access.
        </p>
      </section>
    </div>
  );
}
