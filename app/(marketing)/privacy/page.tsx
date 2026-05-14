export const metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="pt-28 pb-20 px-4 max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm leading-relaxed">
        GrowthDialer respects your privacy. This demo deployment outlines how we would handle data in a
        production environment: call recordings, CRM sync, and analytics are processed only according to
        your workspace settings and applicable law.
      </p>
      <h2 className="font-display text-xl font-semibold mt-8 mb-2">Data we process</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Account details you provide at signup, usage metrics to improve the product, and call metadata
        required to deliver dialing, coaching, and reporting features.
      </p>
      <h2 className="font-display text-xl font-semibold mt-8 mb-2">Contact</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        Questions: <a href="mailto:privacy@growthdialer.com">privacy@growthdialer.com</a>
      </p>
    </div>
  );
}
