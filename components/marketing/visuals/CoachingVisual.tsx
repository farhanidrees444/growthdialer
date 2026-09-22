import { C, MarkerArrow, Pill, T, VisualDefs, Waveform } from './parts';

const ID = 'coaching';

const REPS = [
  { name: 'Jordan', detail: 'on call · 04:12', live: true, action: 'LISTEN', actionTone: C.violet },
  { name: 'Sam', detail: 'on call · 01:37', live: true, action: 'TAKE OVER', actionTone: C.teal },
  { name: 'Alex', detail: 'ready · queue loaded', live: false, action: null, actionTone: '' },
];

/**
 * Salesfloor coaching — illustrated preview.
 * Live rep rows with listen / take-over actions and a waveform,
 * plus honest mode labels (listen + takeover live).
 */
export function CoachingVisual({ badges = true }: { badges?: boolean }) {
  return (
    <svg
      viewBox="0 0 720 460"
      role="img"
      aria-label="Illustrated preview of the salesfloor: live rep rows with listen and take-over coaching actions"
      className="h-auto w-full"
    >
      <title>Salesfloor live coaching — illustrated preview</title>
      <VisualDefs id={ID} />

      <rect width={720} height={460} rx={24} fill={C.stage} />
      <rect width={720} height={460} rx={24} fill={`url(#${ID}-dots)`} />

      {badges && <Pill x={486} y={32} label="LIVE COACHING" dot={C.green} />}

      <g filter={`url(#${ID}-shadow)`}>
        <rect x={36} y={58} width={648} height={344} rx={18} fill={C.cream} />
      </g>
      <T x={62} y={94} size={12} mono fill={C.inkSoft} letterSpacing={1.8}>SALESFLOOR</T>
      <circle cx={630} cy={88} r={6} fill={C.green} className="mx-svg-pulse" />
      <T x={616} y={93} size={11} mono anchor="end" fill={C.greenDeep} letterSpacing={1.2}>2 LIVE</T>

      {REPS.map((r, i) => {
        const y = [112, 228, 296][i];
        const h = i === 0 ? 104 : 56;
        return (
          <g key={r.name}>
            <rect
              x={60}
              y={y}
              width={600}
              height={h}
              rx={14}
              fill="#fff"
              stroke={i === 0 ? C.violet : '#e7e2f2'}
              strokeWidth={i === 0 ? 2 : 1.5}
            />
            <circle cx={88} cy={y + 28} r={13} fill={[C.violet, C.teal, '#8b7bb0'][i]} opacity={0.9} />
            {r.live && <circle cx={106} cy={y + 18} r={5} fill={C.green} className="mx-svg-pulse" />}
            <T x={112} y={y + 26} size={14}>{r.name}</T>
            <T x={112} y={y + 44} size={11.5} fill={C.inkSoft} weight={500} mono>{r.detail.toUpperCase()}</T>
            {r.action && (
              <g>
                <rect x={540} y={y + 12} width={104} height={32} rx={16} fill={r.actionTone} />
                <T x={592} y={y + 33} size={10.5} mono anchor="middle" fill="#fff" weight={700} letterSpacing={0.8}>
                  {r.action}
                </T>
              </g>
            )}
            {i === 0 && <Waveform id={ID} x={300} y={y + 58} w={330} h={30} bars={36} />}
          </g>
        );
      })}

      {/* bottom strip */}
      <T x={62} y={440} size={11} mono fill="#b9a9d4" letterSpacing={1.2}>WHISPER + BARGE · ON THE ROADMAP</T>

      {badges && (
        <g>
          <MarkerArrow d="M 690 200 C 700 240, 696 280, 684 316" color={C.mint} />
          <polygon points="684,316 676,304 692,306" fill={C.mint} opacity={0.9} />
        </g>
      )}
    </svg>
  );
}
