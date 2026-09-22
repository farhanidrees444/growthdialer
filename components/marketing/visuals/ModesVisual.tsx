import { C, MarkerArrow, Pill, T, VisualDefs, Waveform } from './parts';

const ID = 'modes';

const MODES = [
  {
    title: 'MANUAL',
    big: '1',
    unit: 'line',
    desc: 'Click any number —',
    desc2: 'talking in seconds.',
    accent: C.teal,
  },
  {
    title: 'POWER',
    big: '1',
    unit: 'line · auto',
    desc: 'Back-to-back calls.',
    desc2: 'Next number already ringing.',
    accent: C.violet,
  },
  {
    title: 'PARALLEL',
    big: '5',
    unit: 'lines max',
    desc: 'Five lines at once.',
    desc2: 'You only talk to humans.',
    accent: C.green,
  },
];

/**
 * The three dialing modes — illustrated preview.
 * Manual / Power / Parallel cards with live line indicators,
 * so the homepage "Three ways to call" panel gets its own visual
 * instead of repeating the hero dialer console.
 */
export function ModesVisual({ badges = true }: { badges?: boolean }) {
  return (
    <svg
      viewBox="0 0 720 500"
      role="img"
      aria-label="Illustrated preview of the three dialing modes: manual, power, and parallel up to five lines"
      className="h-auto w-full"
    >
      <title>Dialing modes — illustrated preview</title>
      <VisualDefs id={ID} />

      {/* stage */}
      <rect width={720} height={500} rx={24} fill={C.stage} />
      <rect width={720} height={500} rx={24} fill={`url(#${ID}-dots)`} />

      {badges && <Pill x={486} y={32} label="UP TO 5 LINES" dot={C.teal} />}

      {/* product canvas */}
      <g filter={`url(#${ID}-shadow)`}>
        <rect x={36} y={56} width={648} height={388} rx={18} fill={C.cream} />
      </g>

      {/* header */}
      <T x={62} y={94} size={12} mono fill={C.inkSoft} letterSpacing={1.8}>DIALING MODES</T>
      <T x={62} y={116} size={13} fill={C.inkSoft} weight={500}>Pick the pace. The workflow never changes.</T>

      {/* mode cards */}
      {MODES.map((m, i) => {
        const x = 60 + i * 204;
        return (
          <g key={m.title} filter={`url(#${ID}-lift)`}>
            <rect x={x} y={136} width={188} height={284} rx={14} fill="#fff" stroke="#e7e2f2" strokeWidth={1.5} />
            {/* accent tab */}
            <rect x={x} y={136} width={188} height={6} rx={3} fill={m.accent} opacity={0.9} />
            <T x={x + 20} y={172} size={11.5} mono fill={C.inkSoft} letterSpacing={1.4}>{m.title}</T>
            <T x={x + 20} y={226} size={46} weight={750}>{m.big}</T>
            <T x={x + 20 + (m.big === '1' ? 30 : 36)} y={226} size={12.5} mono fill={C.inkSoft}>{m.unit}</T>

            {/* line indicators */}
            {i === 0 && (
              <g>
                <circle cx={x + 32} cy={262} r={8} fill={C.green} className="mx-svg-pulse" />
                <T x={x + 50} y={267} size={11} mono fill={C.greenDeep} letterSpacing={1}>LIVE</T>
                <Waveform id={ID} x={x + 20} y={284} w={148} h={26} bars={22} />
              </g>
            )}
            {i === 1 && (
              <g>
                <circle cx={x + 32} cy={262} r={8} fill={C.green} className="mx-svg-pulse" />
                <T x={x + 50} y={267} size={11} mono fill={C.greenDeep} letterSpacing={1}>LIVE</T>
                {/* auto-advance: current → next */}
                <path
                  d={`M ${x + 104} 262 C ${x + 128} 252, ${x + 140} 252, ${x + 156} 258`}
                  fill="none"
                  stroke={C.violet}
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={0.85}
                />
                <polygon points={`${x + 156},258 ${x + 146},254 ${x + 148},264`} fill={C.violet} opacity={0.9} />
                <circle cx={x + 164} cy={260} r={6} fill="none" stroke={C.violet} strokeWidth={2.5} opacity={0.7} />
                <T x={x + 20} y={300} size={10.5} mono fill={C.inkSoft} letterSpacing={0.8}>AUTO-ADVANCE ON</T>
              </g>
            )}
            {i === 2 && (
              <g>
                {/* five parallel lines: 1 live, 2 ringing, 2 waiting */}
                <circle cx={x + 30} cy={262} r={8} fill={C.green} className="mx-svg-pulse" />
                <circle cx={x + 62} cy={262} r={8} fill={C.violet} opacity={0.85} />
                <circle cx={x + 94} cy={262} r={8} fill={C.violet} opacity={0.55} />
                <circle cx={x + 126} cy={262} r={8} fill="none" stroke="#cfc6e4" strokeWidth={2.5} />
                <circle cx={x + 158} cy={262} r={8} fill="none" stroke="#cfc6e4" strokeWidth={2.5} />
                <T x={x + 20} y={292} size={10.5} mono fill={C.greenDeep} letterSpacing={0.8}>1 HUMAN</T>
                <T x={x + 20} y={310} size={10.5} mono fill={C.inkSoft} letterSpacing={0.8}>AMD DROPS VOICEMAILS</T>
              </g>
            )}

            <T x={x + 20} y={352} size={12.5} weight={600}>{m.desc}</T>
            <T x={x + 20} y={371} size={12.5} weight={600}>{m.desc2}</T>
          </g>
        );
      })}

      {/* hand-drawn marker arrow: badge → parallel card (stops above the card) */}
      {badges && (
        <g>
          <MarkerArrow d="M 600 60 C 618 80, 624 100, 624 118" />
          <polygon points="624,118 616,108 632,108" fill={C.teal} opacity={0.9} />
        </g>
      )}
    </svg>
  );
}
