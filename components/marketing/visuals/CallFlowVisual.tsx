import { C, DottedLine, MarkerArrow, Pill, T, VisualDefs } from './parts';

const ID = 'call-flow';

const PHONE =
  'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z';

function Node({
  x,
  title,
  sub,
  accent,
  children,
}: {
  x: number;
  title: string;
  sub: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <g filter={`url(#${ID}-lift)`}>
      <rect x={x} y={128} width={184} height={132} rx={16} fill={C.cream} />
      <rect x={x} y={128} width={184} height={10} rx={5} fill={accent} />
      <circle cx={x + 34} cy={172} r={18} fill={accent} opacity={0.16} />
      <g transform={`translate(${x + 22} ${160}) scale(1)`} fill={accent}>
        {children}
      </g>
      <T x={x + 20} y={212} size={15}>{title}</T>
      <T x={x + 20} y={234} size={11.5} fill={C.inkSoft} weight={500}>{sub}</T>
    </g>
  );
}

/**
 * Post-call automation workflow — illustrated node flow.
 * Call connects → rep dispositions → SMS follow-up, with condition
 * pills and a timeline. No invented metrics.
 */
export function CallFlowVisual({ badges = true }: { badges?: boolean }) {
  return (
    <svg
      viewBox="0 0 720 400"
      role="img"
      aria-label="Illustrated workflow: call connects, rep dispositions, SMS follow-up sends automatically"
      className="h-auto w-full"
    >
      <title>Call → disposition → SMS workflow — illustrated preview</title>
      <VisualDefs id={ID} />

      <rect width={720} height={400} rx={24} fill={C.stage} />
      <rect width={720} height={400} rx={24} fill={`url(#${ID}-dots)`} />

      {badges && <Pill x={48} y={36} label="WORKFLOW" dot={C.teal} />}

      <Node x={36} title="Call connects" sub="rep answers live" accent={C.teal}>
        <path d={PHONE} transform="scale(1)" />
      </Node>
      <Node x={268} title="Rep dispositions" sub="one click · hotkeys" accent={C.violet}>
        <path d="M20.6 13.4 11 3.8A2 2 0 0 0 9.6 3.2H4a1 1 0 0 0-1 1v5.6c0 .5.2 1 .6 1.4l9.6 9.6a2 2 0 0 0 2.8 0l4.6-4.6a2 2 0 0 0 0-2.8Z" />
        <circle cx={7.5} cy={7.5} r={1.6} fill={C.cream} />
      </Node>
      <Node x={500} title="SMS follow-up" sub="auto-sent after call" accent={C.green}>
        <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1L3 20l1.1-4.3A8.5 8.5 0 1 1 21 11.5Z" />
      </Node>

      {/* connectors with condition pills */}
      <DottedLine x1={224} y1={194} x2={264} y2={194} />
      <DottedLine x1={456} y1={194} x2={496} y2={194} />
      <g>
        <rect x={196} y={152} width={118} height={24} rx={12} fill="#12081f" stroke="rgba(255,255,255,0.14)" />
        <T x={255} y={168} size={10} mono anchor="middle" fill="#fff" letterSpacing={1}>IF ANSWERED</T>
      </g>
      <g>
        <rect x={424} y={152} width={128} height={24} rx={12} fill="#12081f" stroke="rgba(255,255,255,0.14)" />
        <T x={488} y={168} size={10} mono anchor="middle" fill="#fff" letterSpacing={1}>ON DISPOSITION</T>
      </g>

      {/* timeline */}
      <line x1={80} y1={322} x2={640} y2={322} stroke={C.stageLine} strokeWidth={2} />
      {[
        { x: 128, label: '0:00', sub: 'call starts' },
        { x: 360, label: '0:45', sub: 'dispositioned' },
        { x: 592, label: '+5 MIN', sub: 'SMS sent' },
      ].map((t, i) => (
        <g key={t.label}>
          <circle cx={t.x} cy={322} r={i === 2 ? 8 : 6} fill={i === 2 ? C.green : i === 1 ? C.violet : C.teal} />
          <T x={t.x} y={352} size={12} mono anchor="middle" fill="#fff">{t.label}</T>
          <T x={t.x} y={370} size={11} anchor="middle" fill="#9c8bb8" weight={500}>{t.sub}</T>
        </g>
      ))}

      <MarkerArrow d="M 620 260 C 640 280, 636 296, 622 308" color={C.mint} />
    </svg>
  );
}
