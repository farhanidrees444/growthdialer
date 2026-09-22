import { Bars, C, DottedLine, MarkerArrow, Pill, RoundBtn, T, VisualDefs, Waveform } from './parts';

const ID = 'dialer-console';

const CHIPS_ROW_1 = ['Interested', 'Meeting Booked', 'Callback', 'Voicemail'];
const CHIPS_ROW_2 = ['Gatekeeper', 'Not Interested', 'Wrong Number', 'Do Not Call'];

/**
 * Stylized AI dialer console — the hero product visual.
 * Mode tabs, lead card, live call timer + waveform, call controls,
 * and the 8 one-click disposition chips. Illustrated, not a screenshot.
 */
export function DialerConsoleVisual({ badges = true }: { badges?: boolean }) {
  return (
    <svg
      viewBox="0 0 720 520"
      role="img"
      aria-label="Illustrated preview of the GrowthDialer AI dialer: dialing modes, lead card, live call controls, and disposition chips"
      className="h-auto w-full"
    >
      <title>GrowthDialer AI dialer — illustrated preview</title>
      <VisualDefs id={ID} />

      {/* stage */}
      <rect width={720} height={520} rx={24} fill={C.stage} />
      <rect width={720} height={520} rx={24} fill={`url(#${ID}-dots)`} />

      {badges && <Pill x={492} y={36} label="AUTO-DIALING" />}

      {/* product canvas */}
      <g filter={`url(#${ID}-shadow)`}>
        <rect x={36} y={52} width={648} height={404} rx={18} fill={C.cream} />
      </g>

      {/* top bar: mode tabs */}
      <rect x={36} y={52} width={648} height={58} rx={18} fill={C.cream} />
      <rect x={36} y={92} width={648} height={18} fill={C.cream} />
      <line x1={36} y1={110} x2={684} y2={110} stroke="#e7e2f2" strokeWidth={1.5} />
      <g>
        <T x={62} y={86} size={12} mono fill={C.inkSoft} letterSpacing={1.5}>MANUAL</T>
        <rect x={150} y={64} width={104} height={34} rx={17} fill={C.violet} />
        <T x={202} y={86} size={12} mono fill="#fff" anchor="middle" letterSpacing={1.5}>POWER</T>
        <T x={292} y={86} size={12} mono fill={C.inkSoft} letterSpacing={1.5}>PARALLEL</T>
      </g>
      {/* AI scoring toggle */}
      <T x={548} y={86} size={11} mono fill={C.inkSoft} letterSpacing={1.2}>AI SCORING</T>
      <rect x={628} y={72} width={40} height={22} rx={11} fill={C.teal} />
      <circle cx={656} cy={83} r={8} fill="#fff" />

      {/* lead card */}
      <g filter={`url(#${ID}-lift)`}>
        <rect x={60} y={132} width={268} height={176} rx={14} fill="#fff" stroke="#e7e2f2" strokeWidth={1.5} />
      </g>
      <circle cx={102} cy={174} r={24} fill={C.violet} />
      <T x={102} y={181} size={14} fill="#fff" anchor="middle">SK</T>
      <T x={138} y={170} size={16}>Sarah Kim</T>
      <T x={138} y={190} size={12} fill={C.inkSoft} weight={500}>VP Sales · Acme Logistics</T>
      <T x={138} y={212} size={12.5} mono fill={C.ink}>+1 (415) 555-0132</T>
      <rect x={138} y={226} width={92} height={24} rx={12} fill="#fef3e2" />
      <T x={184} y={242} size={11} anchor="middle" fill="#b45309" mono>ATTEMPT 3</T>
      <Bars x={84} y={262} widths={[180, 150]} gap={9} />

      {/* live call console */}
      <g filter={`url(#${ID}-lift)`}>
        <rect x={352} y={132} width={296} height={176} rx={14} fill="#fff" stroke="#e7e2f2" strokeWidth={1.5} />
      </g>
      <circle cx={376} cy={168} r={6} fill={C.green} className="mx-svg-pulse" />
      <T x={390} y={173} size={11} mono fill={C.greenDeep} letterSpacing={1.5}>LIVE</T>
      <T x={624} y={182} size={30} mono anchor="end" weight={700}>02:47</T>
      <Waveform id={ID} x={376} y={196} w={248} h={40} bars={30} />
      {/* controls */}
      <circle cx={408} cy={278} r={20} fill={C.creamDim} />
      <T x={408} y={284} size={11} anchor="middle" fill={C.inkSoft} mono>MUTE</T>
      <circle cx={460} cy={278} r={20} fill={C.creamDim} />
      <T x={460} y={284} size={11} anchor="middle" fill={C.inkSoft} mono>KEYS</T>
      <RoundBtn cx={528} cy={278} r={23} tone="call" />
      <RoundBtn cx={588} cy={278} r={23} tone="end" />

      {/* dispositions */}
      <T x={60} y={344} size={10.5} mono fill={C.inkSoft} letterSpacing={1.6}>WRAP UP · ONE CLICK</T>
      {CHIPS_ROW_1.map((label, i) => {
        const x = 60 + i * 118;
        const active = i === 0;
        return (
          <g key={label}>
            <rect
              x={x}
              y={356}
              width={110}
              height={32}
              rx={16}
              fill={active ? '#e8faf0' : '#fff'}
              stroke={active ? C.green : '#e7e2f2'}
              strokeWidth={active ? 2 : 1.5}
            />
            <T x={x + 55} y={377} size={11.5} anchor="middle" fill={active ? C.greenDeep : C.ink} weight={active ? 700 : 600}>
              {label}
            </T>
          </g>
        );
      })}
      {CHIPS_ROW_2.map((label, i) => {
        const x = 60 + i * 118;
        const dnc = i === 3;
        return (
          <g key={label}>
            <rect
              x={x}
              y={396}
              width={110}
              height={32}
              rx={16}
              fill="#fff"
              stroke={dnc ? C.red : '#e7e2f2'}
              strokeWidth={dnc ? 2 : 1.5}
            />
            <T x={x + 55} y={417} size={11.5} anchor="middle" fill={dnc ? C.red : C.ink}>
              {label}
            </T>
          </g>
        );
      })}

      {/* hand-drawn marker arrow: dispositions → console */}
      <MarkerArrow d="M 300 446 C 380 430, 440 380, 500 316" />
      <polygon points="500,316 486,312 494,302" fill={C.teal} opacity={0.9} />

      {badges && (
        <g>
          <Pill x={48} y={440} label="CALL CONNECTED" />
          <DottedLine x1={640} y1={440} x2={640} y2={470} />
        </g>
      )}
    </svg>
  );
}
