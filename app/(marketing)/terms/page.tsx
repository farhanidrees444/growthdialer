export const metadata = {
  title: "Terms of Service",
};

export default function TermsPage() {
  return (
    <div className="pt-28 pb-20 px-4 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        By using this demo application you agree not to misuse the service, to comply with TCPA and local
        telemarketing rules when placing real calls, and to accept that features may change before general
        availability.
      </p>
      <h2 className="font-display text-xl font-semibold mt-8 mb-2">Subscriptions</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Paid plans are billed through Stripe. You may cancel before renewal according to the billing portal.
      </p>
      <h2 className="font-display text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Legal: <a href="mailto:legal@growthdialer.com">legal@growthdialer.com</a>
      </p>
    </div>
  );
}
