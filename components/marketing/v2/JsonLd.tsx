type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/** Renders JSON-LD structured data for SEO / LLM crawlers. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
