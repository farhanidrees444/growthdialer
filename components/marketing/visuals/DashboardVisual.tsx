import { C, MarkerArrow, Pill, T, VisualDefs } from './parts';

const ID = 'dashboard';

const STATS = [
  { label: 'CALLS TODAY', value: '128' },
  { label: 'CONNECT RATE', value: '31%' },
  { label: 'TALK TIME', value: '3h 12m' },
  { label: 'MEETINGS', value: '6' },
];

const LOG = [
  { name: 'A. Rivera', disp: 'Interested', tone: C.greenDeep, bg: '#e8faf0' },
  { name: 'J. Chen', disp: 'Callback', tone: '#b45309', bg: '#fef3e2' },
  { name: 'S. Patel', disp: 'Voicemail', tone: C.inkSoft, bg: '#efeaf6' },
];

const BARS = [38, 62, 48, 74, 58, 88, 70];

/**
 * Stylized command-center dashboard — illustrated preview.
 * Stat cards, weekly connects chart, and a call-log with disposition chips.
 */
export function DashboardVisual({ badges = true }: { badges?: boolean }) {
  return (
    <svg
      viewBox="0 0 720 540"
      role="img"
      aria-label="Illustrated preview of the GrowthDialer dashboard: call stats, connects chart, and call log"
      className="h-auto w-full"
    >
      <title>GrowthDialer dashboard — illustrated preview</title>
      <VisualDefs id={ID} />

      <rect width={720} height={540} rx={24} fill={C.stage} />
      <rect width={720} height={540} rx={24} fill={`url(#${ID}-dots)`} />

      {badges && <Pill x={468} y={34} label="AI BRIEF READY" dot={C.violet} />}

      {/* canvas */}
      <g filter={`url(#${ID}-shadow)`}>
        <rect x={36} y={58} width={648} height={424} rx={18} fill={C.cream} />
      </g>

      {/* header */}
      <T x={62} y={94} size={12} mono fill={C.inkSoft} letterSpacing={1.8}>COMMAND CENTER</T>
      <rect x={560} y={72} width={58} height={28} rx={14} fill={C.violet} />
      <T x={589} y={91} size={11} mono anchor="middle" fill="#fff">TODAY</T>
      <rect x={624} y={72} width={58} height={28} rx={14} fill="none" stroke="#cfc6e4" strokeWidth={1.5} />
      <T x={653} y={91} size={11} mono anchor="middle" fill={C.inkSoft}>TEAM</T>

      {/* stat cards */}
      {STATS.map((s, i) => {
        const x = 60 + i * 158;
        return (
          <g key={s.label} filter={`url(#${ID}-lift)`}>
            <rect x={x} y={114} width={146} height={92} rx={12} fill="#fff" stroke="#e7e2f2" strokeWidth={1.5} />
            <T x={x + 16} y={140} size={9} mono fill={C.inkSoft} letterSpacing={0.8}>{s.label}</T>
            <T x={x + 16} y={176} size={27} weight={750}>{s.value}</T>
            <circle cx={x + 128} cy={132} r={5} fill={i % 2 ? C.teal : C.violet} opacity={0.85} />
          </g>
        );
      })}

      {/* connects chart */}
      <g filter={`url(#${ID}-lift)`}>
        <rect x={60} y={222} width={352} height={236} rx={14} fill="#fff" stroke="#e7e2f2" strokeWidth={1.5} />
      </g>
      <T x={84} y={252} size={10.5} mono fill={C.inkSoft} letterSpacing={1.6}>CONNECTS · LAST 7 DAYS</T>
      {BARS.map((v, i) => (
        <rect
          key={i}
          x={92 + i * 44}
          y={420 - v * 1.7}
          width={28}
          height={v * 1.7}
          rx={6}
          fill={`url(#${ID}-tealbar)`}
          opacity={i === 5 ? 1 : 0.55 + (i % 3) * 0.12}
        />
      ))}
      <line x1={84} y1={420} x2={388} y2={420} stroke="#e7e2f2" strokeWidth={1.5} />

      {/* call log */}
      <g filter={`url(#${ID}-lift)`}>
        <rect x={428} y={222} width={232} height={236} rx={14} fill="#fff" stroke="#e7e2f2" strokeWidth={1.5} />
      </g>
      <T x={452} y={252} size={10.5} mono fill={C.inkSoft} letterSpacing={1.6}>CALL LOG</T>
      {LOG.map((row, i) => {
        const y = 272 + i * 58;
        const chipW = row.disp.length * 6.1 + 22;
        return (
          <g key={row.name}>
            <circle cx={464} cy={y + 8} r={13} fill={i === 0 ? C.violet : i === 1 ? C.teal : '#8b7bb0'} opacity={0.9} />
            <T x={488} y={y + 6} size={13.5}>{row.name}</T>
            <T x={488} y={y + 24} size={11} fill={C.inkSoft} weight={500} mono>0{i + 3}:4{i}</T>
            <rect x={650 - chipW} y={y - 4} width={chipW} height={24} rx={12} fill={row.bg} />
            <T x={650 - chipW / 2} y={y + 12} size={9.5} anchor="middle" fill={row.tone} weight={700} mono letterSpacing={0.6}>
              {row.disp.toUpperCase()}
            </T>
          </g>
        );
      })}

      {/* marker arrow: pill → stat cards (short hop between toggle and cards, never crosses) */}
      {badges && (
        <g>
          <MarkerArrow d="M 500 60 C 512 80, 518 96, 520 108" color={C.mint} />
          <polygon points="520,108 512,98 528,98" fill={C.mint} opacity={0.9} />
        </g>
      )}
    </svg>
  );
}
