import { C, Pill, T, VisualDefs, Waveform } from './parts';

export type SpotKind = 'dialer' | 'parallel' | 'ai' | 'versus';

const ID = 'spot';

function DialerSpot() {
  return (
    <g>
      <rect width={400} height={225} fill="#f4efe4" />
      <rect width={400} height={225} fill={`url(#${ID}-dots-dark)`} />
      {/* radiating arcs */}
      {[54, 78, 102].map((r, i) => (
        <circle key={r} cx={200} cy={118} r={r} fill="none" stroke={C.teal} strokeWidth={3} opacity={0.28 + i * 0.14} />
      ))}
      {/* green call button */}
      <circle cx={200} cy={118} r={44} fill={C.green} filter={`url(#${ID}-lift)`} />
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
        fill="#fff"
        transform="translate(184 102) scale(1.35)"
      />
      <Pill x={24} y={22} label="AI DIALER" dot={C.green} />
      <Waveform id={ID} x={120} y={188} w={160} h={22} bars={26} color={C.violet} />
    </g>
  );
}

function ParallelSpot() {
  const ys = [52, 88, 124, 160, 196];
  return (
    <g>
      <rect width={400} height={225} fill="#160d26" />
      <rect width={400} height={225} fill={`url(#${ID}-dots)`} />
      {/* fan of 5 lines from one rep to five prospects */}
      <circle cx={86} cy={124} r={26} fill={C.violet} />
      <T x={86} y={131} size={13} anchor="middle" fill="#fff" weight={800}>YOU</T>
      {ys.map((y, i) => (
        <g key={y}>
          <line x1={118} y1={124} x2={300} y2={y} stroke={C.teal} strokeWidth={2.5} opacity={0.55 + (i % 2) * 0.25} />
          <circle cx={318} cy={y} r={14} fill={i === 2 ? C.green : '#3b2757'} stroke={i === 2 ? '#fff' : 'none'} strokeWidth={2} />
          {i === 2 && (
            <path d="M312 124 l4.5 4.5 8 -9" stroke="#fff" strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </g>
      ))}
      <Pill x={24} y={22} label="5 LINES" dot={C.teal} />
      <T x={376} y={212} size={10.5} mono anchor="end" fill="#b9a9d4" letterSpacing={1.2}>AMD FILTERS VOICEMAIL</T>
    </g>
  );
}

function AiSpot() {
  return (
    <g>
      <rect width={400} height={225} fill="#fbf8f2" />
      <rect width={400} height={225} fill={`url(#${ID}-dots-dark)`} />
      {/* document */}
      <g filter={`url(#${ID}-lift)`}>
        <rect x={140} y={36} width={120} height={150} rx={10} fill="#fff" stroke="#e7e2f2" strokeWidth={1.5} />
      </g>
      <rect x={158} y={58} width={84} height={9} rx={4.5} fill={C.violet} opacity={0.85} />
      <rect x={158} y={78} width={84} height={7} rx={3.5} fill="#ddd5ec" />
      <rect x={158} y={93} width={66} height={7} rx={3.5} fill="#ddd5ec" />
      <rect x={158} y={108} width={76} height={7} rx={3.5} fill="#ddd5ec" />
      <rect x={158} y={130} width={52} height={20} rx={10} fill="#e8faf0" />
      <T x={184} y={144} size={9.5} anchor="middle" fill={C.greenDeep} weight={700}>Positive</T>
      {/* sparkle */}
      <path d="M292 60 l4.5 11 11 4.5 -11 4.5 -4.5 11 -4.5 -11 -11 -4.5 11 -4.5 Z" fill={C.teal} />
      <path d="M112 140 l3.5 8.5 8.5 3.5 -8.5 3.5 -3.5 8.5 -3.5 -8.5 -8.5 -3.5 8.5 -3.5 Z" fill={C.violet} opacity={0.85} />
      <Pill x={24} y={22} label="AI BRIEF" dot={C.violet} />
    </g>
  );
}

function VersusSpot() {
  return (
    <g>
      <rect width={400} height={225} fill="#f4efe4" />
      {/* GrowthDialer panel */}
      <g filter={`url(#${ID}-lift)`}>
        <rect x={24} y={40} width={160} height={150} rx={14} fill={C.stage} />
      </g>
      <T x={44} y={72} size={12} mono fill="#fff" letterSpacing={1}>GROWTHDIALER</T>
      {[92, 116, 140].map((y) => (
        <g key={y}>
          <circle cx={52} cy={y} r={9} fill={C.green} />
          <path d={`M47 ${y} l3.5 3.5 6 -7`} stroke="#0c2f2b" strokeWidth={2.2} fill="none" strokeLinecap="round" />
          <rect x={68} y={y - 5} width={96} height={10} rx={5} fill="#3b2757" />
        </g>
      ))}
      {/* competitor panel */}
      <g filter={`url(#${ID}-lift)`} opacity={0.75}>
        <rect x={216} y={40} width={160} height={150} rx={14} fill="#fff" stroke="#e7e2f2" strokeWidth={1.5} />
      </g>
      <T x={236} y={72} size={12} mono fill={C.inkSoft} letterSpacing={1}>OTHERS</T>
      {[92, 116, 140].map((y, i) => (
        <g key={y}>
          {i < 2 ? (
            <circle cx={244} cy={y} r={9} fill="none" stroke="#c9c2d8" strokeWidth={2.5} />
          ) : (
            <g>
              <line x1={238} y1={y - 6} x2={250} y2={y + 6} stroke="#c9c2d8" strokeWidth={2.5} strokeLinecap="round" />
              <line x1={250} y1={y - 6} x2={238} y2={y + 6} stroke="#c9c2d8" strokeWidth={2.5} strokeLinecap="round" />
            </g>
          )}
          <rect x={260} y={y - 5} width={96} height={10} rx={5} fill="#e7e2f2" />
        </g>
      ))}
      {/* VS badge */}
      <circle cx={200} cy={115} r={24} fill={C.violet} stroke="#fff" strokeWidth={3} />
      <T x={200} y={121} size={14} anchor="middle" fill="#fff" weight={800} mono>VS</T>
    </g>
  );
}

/**
 * Small 16:9 spot illustrations for blog cards and compare pages.
 * Hand-crafted vector spots — no screenshots, no stock.
 */
export function SpotVisual({ kind, label, className }: { kind: SpotKind; label: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 400 225"
      role="img"
      aria-label={label}
      className={className ?? 'h-auto w-full'}
      preserveAspectRatio="xMidYMid slice"
    >
      <title>{label}</title>
      <VisualDefs id={ID} />
      {kind === 'dialer' && <DialerSpot />}
      {kind === 'parallel' && <ParallelSpot />}
      {kind === 'ai' && <AiSpot />}
      {kind === 'versus' && <VersusSpot />}
    </svg>
  );
}
