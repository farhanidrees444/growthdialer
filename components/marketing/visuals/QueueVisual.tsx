import { C, MarkerArrow, Pill, T, VisualDefs } from './parts';

const ID = 'queue';

const ROWS = [
  { name: 'Sarah Kim', co: 'VP Sales', status: 'NEXT UP', tone: C.greenDeep, bg: '#e8faf0' },
  { name: 'David Osei', co: 'Sales Manager', status: 'QUEUED', tone: C.inkSoft, bg: '#efeaf6' },
  { name: 'Maria Lopez', co: 'Operations Lead', status: 'CALLBACK 2:30P', tone: '#b45309', bg: '#fef3e2' },
  { name: 'Tom Becker', co: 'Founder', status: 'QUEUED', tone: C.inkSoft, bg: '#efeaf6' },
];

/**
 * Lead queue — illustrated preview of Queue / Hot / Callbacks tabs,
 * the claim-caller-ID prompt, and CSV import.
 */
export function QueueVisual({ badges = true }: { badges?: boolean }) {
  return (
    <svg
      viewBox="0 0 720 460"
      role="img"
      aria-label="Illustrated preview of the lead queue with Queue, Hot and Callbacks tabs"
      className="h-auto w-full"
    >
      <title>Lead queue — illustrated preview</title>
      <VisualDefs id={ID} />

      <rect width={720} height={460} rx={24} fill={C.stage} />
      <rect width={720} height={460} rx={24} fill={`url(#${ID}-dots)`} />

      {badges && <Pill x={52} y={34} label="QUEUE" dot={C.teal} />}

      <g filter={`url(#${ID}-shadow)`}>
        <rect x={36} y={58} width={648} height={344} rx={18} fill={C.cream} />
      </g>

      {/* tabs */}
      <g>
        <rect x={60} y={78} width={104} height={34} rx={17} fill={C.violet} />
        <T x={112} y={100} size={11.5} mono anchor="middle" fill="#fff" letterSpacing={1.2}>QUEUE</T>
        <T x={206} y={100} size={11.5} mono anchor="middle" fill={C.inkSoft} letterSpacing={1.2}>HOT</T>
        <T x={306} y={100} size={11.5} mono anchor="middle" fill={C.inkSoft} letterSpacing={1.2}>CALLBACKS</T>
      </g>
      <line x1={60} y1={124} x2={660} y2={124} stroke="#e7e2f2" strokeWidth={1.5} />

      {/* lead rows */}
      {ROWS.map((r, i) => {
        const y = 140 + i * 52;
        const chipW = r.status.length * 6.4 + 24;
        return (
          <g key={r.name} opacity={i === 0 ? 1 : 0.92}>
            <circle cx={82} cy={y + 8} r={14} fill={[C.violet, C.teal, '#8b7bb0', C.violetDeep][i]} opacity={0.9} />
            <T x={106} y={y + 6} size={14}>{r.name}</T>
            <T x={106} y={y + 24} size={11.5} fill={C.inkSoft} weight={500}>{r.co}</T>
            <rect x={648 - chipW} y={y - 4} width={chipW} height={26} rx={13} fill={r.bg} />
            <T x={648 - chipW / 2} y={y + 13} size={10} mono anchor="middle" fill={r.tone} weight={700} letterSpacing={0.8}>
              {r.status}
            </T>
          </g>
        );
      })}

      {/* claim caller ID banner */}
      <rect x={60} y={340} width={300} height={44} rx={12} fill="#fef3e2" stroke="#f5c97b" strokeWidth={1.5} />
      <circle cx={84} cy={362} r={9} fill={C.amber} />
      <T x={84} y={366} size={11} anchor="middle" fill="#fff" weight={800}>!</T>
      <T x={102} y={367} size={12.5} fill="#92400e" weight={600}>Claim a caller ID to start dialing</T>

      {/* import CSV */}
      <rect x={380} y={340} width={280} height={44} rx={12} fill={C.violet} />
      <T x={520} y={367} size={13} anchor="middle" fill="#fff" weight={700}>Import CSV</T>

      {badges && (
        <g>
          <MarkerArrow d="M 200 420 C 260 428, 330 428, 400 420" color={C.mint} />
          <polygon points="400,420 388,414 390,428" fill={C.mint} opacity={0.9} />
        </g>
      )}
    </svg>
  );
}
