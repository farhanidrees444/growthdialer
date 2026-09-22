import { C, Pill, T, VisualDefs } from './parts';

const ID = 'dispositions';

const CHIPS = [
  'Interested',
  'Meeting Booked',
  'Callback',
  'Voicemail',
  'Gatekeeper',
  'Not Interested',
  'Wrong Number',
  'Do Not Call',
];

/**
 * The 8 one-click dispositions — illustrated chip panel with hotkeys.
 */
export function DispositionsVisual({ badges = true }: { badges?: boolean }) {
  return (
    <svg
      viewBox="0 0 640 400"
      role="img"
      aria-label="Illustrated preview of the eight one-click call dispositions with keyboard hotkeys"
      className="h-auto w-full"
    >
      <title>Eight one-click dispositions — illustrated preview</title>
      <VisualDefs id={ID} />

      <rect width={640} height={400} rx={24} fill={C.stage} />
      <rect width={640} height={400} rx={24} fill={`url(#${ID}-dots)`} />

      {badges && <Pill x={418} y={32} label="8 DISPOSITIONS" dot={C.violet} />}

      <g filter={`url(#${ID}-shadow)`}>
        <rect x={48} y={66} width={544} height={238} rx={18} fill={C.cream} />
      </g>
      <T x={76} y={104} size={12} mono fill={C.inkSoft} letterSpacing={1.8}>WRAP THE CALL IN ONE CLICK</T>
      <T x={564} y={104} size={11} mono anchor="end" fill={C.inkSoft}>HOTKEYS 1–8</T>

      {CHIPS.map((label, i) => {
        const x = 76 + (i % 4) * 130;
        const y = 122 + Math.floor(i / 4) * 62;
        const selected = i === 0;
        const dnc = i === 7;
        return (
          <g key={label}>
            <rect
              x={x}
              y={y}
              width={118}
              height={44}
              rx={22}
              fill={selected ? '#e8faf0' : '#fff'}
              stroke={selected ? C.green : dnc ? C.red : '#e7e2f2'}
              strokeWidth={selected || dnc ? 2.5 : 1.5}
            />
            <T
              x={x + 59}
              y={y + 27}
              size={12}
              anchor="middle"
              fill={selected ? C.greenDeep : dnc ? C.red : C.ink}
              weight={selected ? 700 : 600}
            >
              {label}
            </T>
            <circle cx={x + 106} cy={y + 12} r={10} fill={C.stage} />
            <T x={x + 106} y={y + 16} size={10} mono anchor="middle" fill="#fff">{i + 1}</T>
          </g>
        );
      })}

      <T x={320} y={344} size={12} mono anchor="middle" fill="#b9a9d4" letterSpacing={0.8}>
        DO NOT CALL REMOVES THE LEAD FROM EVERY QUEUE — INSTANTLY
      </T>
    </svg>
  );
}
