import { EDITORIAL_DISCLAIMER } from '@/lib/marketing/honest-copy';

/** Visible on long-form blog posts — sets trust before any comparison tables. */
export function BlogHonestyBanner() {
  return (
    <div className="mb-10 rounded-xl border border-[#7C3AED]/20 bg-[#7C3AED]/[0.06] px-5 py-4 text-[14px] leading-relaxed text-zinc-300">
      <p className="font-medium text-[#A78BFA]">Honest editorial standard</p>
      <p className="mt-1.5">{EDITORIAL_DISCLAIMER}</p>
    </div>
  );
}
