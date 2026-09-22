import { Bars, C, MarkerArrow, Pill, T, VisualDefs } from './parts';

const ID = 'ai-summary';

/**
 * AI call summary card — illustrated preview.
 * Bullet summary, sentiment, buying signals, suggested disposition,
 * and the per-lead memory card. No invented performance claims.
 */
export function AiSummaryVisual({ badges = true }: { badges?: boolean }) {
  return (
    <svg
      viewBox="0 0 680 440"
      role="img"
      aria-label="Illustrated preview of the AI call summary: bullet notes, sentiment, buying signals, and suggested disposition"
      className="h-auto w-full"
    >
      <title>AI call summary — illustrated preview</title>
      <VisualDefs id={ID} />

      <rect width={680} height={440} rx={24} fill={C.stage} />
      <rect width={680} height={440} rx={24} fill={`url(#${ID}-dots)`} />

      {badges && <Pill x={400} y={32} label="NOTES WRITTEN" dot={C.green} />}

      {/* summary card */}
      <g filter={`url(#${ID}-shadow)`}>
        <rect x={48} y={58} width={400} height={324} rx={18} fill={C.cream} />
      </g>
      {/* sparkle */}
      <path
        d="M88 96 l3.2 7.8 7.8 3.2 -7.8 3.2 -3.2 7.8 -3.2 -7.8 -7.8 -3.2 7.8 -3.2 Z"
        fill={C.violet}
      />
      <T x={108} y={112} size={12} mono fill={C.inkSoft} letterSpacing={1.6}>AI SUMMARY · 0:42 CALL</T>

      <Bars x={76} y={132} widths={[300, 268, 288, 240]} gap={12} />

      <T x={76} y={216} size={10.5} mono fill={C.inkSoft} letterSpacing={1.6}>SENTIMENT</T>
      <rect x={76} y={228} width={104} height={28} rx={14} fill="#e8faf0" />
      <T x={128} y={247} size={11.5} anchor="middle" fill={C.greenDeep} weight={700}>Positive</T>

      <T x={76} y={280} size={10.5} mono fill={C.inkSoft} letterSpacing={1.6}>BUYING SIGNALS</T>
      <rect x={76} y={292} width={76} height={28} rx={14} fill="#efeaf6" />
      <T x={114} y={311} size={11.5} anchor="middle" fill={C.violetDeep} weight={600}>pricing</T>
      <rect x={160} y={292} width={76} height={28} rx={14} fill="#efeaf6" />
      <T x={198} y={311} size={11.5} anchor="middle" fill={C.violetDeep} weight={600}>12 seats</T>

      <T x={76} y={344} size={10.5} mono fill={C.inkSoft} letterSpacing={1.6}>SUGGESTED</T>
      <rect x={200} y={326} width={150} height={32} rx={16} fill={C.violet} />
      <T x={275} y={347} size={12.5} anchor="middle" fill="#fff" weight={700}>→ Interested</T>

      {/* per-lead memory card */}
      <g filter={`url(#${ID}-lift)`}>
        <rect x={472} y={150} width={160} height={150} rx={16} fill={C.teal} />
      </g>
      <circle cx={500} cy={184} r={14} fill="#0e3f3a" opacity={0.35} />
      <path d="M493 184 l5 5 9 -10" stroke="#fff" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <T x={552} y={180} size={12.5} fill="#0c2f2b" weight={800}>MEMORY</T>
      <T x={552} y={198} size={12.5} fill="#0c2f2b" weight={800}>SAVED</T>
      <T x={496} y={232} size={11.5} fill="#0c2f2b" weight={500}>next call starts</T>
      <T x={496} y={250} size={11.5} fill="#0c2f2b" weight={500}>smarter</T>

      {badges && (
        <g>
          <MarkerArrow d="M 470 120 C 440 100, 400 90, 360 88" color={C.mint} />
          <polygon points="360,88 372,82 372,96" fill={C.mint} opacity={0.9} />
        </g>
      )}
    </svg>
  );
}
