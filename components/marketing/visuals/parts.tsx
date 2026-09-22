/**
 * Shared building blocks for the hand-crafted inline-SVG product visuals.
 *
 * Design language (lagrowthmachine register, GrowthDialer brand blend):
 *  - dark plum command-center stages (#160d26 / #221438)
 *  - cream product canvases (#fbf8f2)
 *  - violet primary (#7c3aed), teal (#45c4b0), neon green (#1fd47a) accents
 *  - dark annotation pills with white mono text, hand-drawn marker arrows,
 *    dotted connector lines, soft drop shadows, crisp vector geometry.
 */

export const FONT =
  "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
export const MONO =
  "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace";

export const C = {
  stage: '#160d26',
  stagePanel: '#221438',
  stageLine: '#3b2757',
  cream: '#fbf8f2',
  creamDim: '#f3eee3',
  ink: '#241433',
  inkSoft: '#5b4a75',
  violet: '#7c3aed',
  violetDeep: '#6d28d9',
  teal: '#45c4b0',
  mint: '#7de3d0',
  green: '#1fd47a',
  greenDeep: '#0e9f5c',
  amber: '#f5a524',
  red: '#f04452',
  white: '#ffffff',
} as const;

type TextProps = {
  x: number;
  y: number;
  children: React.ReactNode;
  size?: number;
  weight?: number;
  fill?: string;
  anchor?: 'start' | 'middle' | 'end';
  mono?: boolean;
  letterSpacing?: number;
  opacity?: number;
};

/** Crisp SVG label. */
export function T({
  x,
  y,
  children,
  size = 13,
  weight = 600,
  fill = C.ink,
  anchor = 'start',
  mono = false,
  letterSpacing,
  opacity,
}: TextProps) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fontWeight={weight}
      fill={fill}
      textAnchor={anchor}
      letterSpacing={letterSpacing}
      opacity={opacity}
      style={{ fontFamily: mono ? MONO : FONT }}
    >
      {children}
    </text>
  );
}

type PillProps = {
  x: number;
  y: number;
  label: string;
  /** pill color dot, defaults to neon green */
  dot?: string;
  /** width override when the label needs room */
  w?: number;
};

/**
 * Dark annotation pill with white mono text — the signature LGM callout.
 * Positioned by its top-left corner; width auto-sizes from the label.
 */
export function Pill({ x, y, label, dot = C.green, w }: PillProps) {
  const width = w ?? label.length * 7.4 + 34;
  const h = 26;
  return (
    <g transform={`translate(${x},${y})`}>
      <rect
        width={width}
        height={h}
        rx={h / 2}
        fill="#12081f"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth={1}
      />
      <circle cx={15} cy={h / 2} r={4} fill={dot} />
      <text
        x={26}
        y={h / 2 + 4.5}
        fontSize={11}
        fontWeight={700}
        fill="#fff"
        letterSpacing={1.2}
        style={{ fontFamily: MONO }}
      >
        {label}
      </text>
    </g>
  );
}

type MarkerArrowProps = {
  /** SVG path data, hand-drawn feel */
  d: string;
  color?: string;
  width?: number;
};

/** Hand-drawn curved marker arrow (teal), with a soft round cap. */
export function MarkerArrow({ d, color = C.teal, width = 3.5 }: MarkerArrowProps) {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      opacity={0.9}
    />
  );
}

type DottedLineProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
};

/** Dotted connector line between nodes. */
export function DottedLine({ x1, y1, x2, y2, color = C.teal }: DottedLineProps) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke={color}
      strokeWidth={2.5}
      strokeDasharray="1 9"
      strokeLinecap="round"
      opacity={0.85}
    />
  );
}

type RoundBtnProps = {
  cx: number;
  cy: number;
  r?: number;
  tone: 'call' | 'end' | 'muted';
  label?: string;
};

/** Circular call-control button: green call, red end, gray muted. */
export function RoundBtn({ cx, cy, r = 26, tone, label }: RoundBtnProps) {
  const fill = tone === 'call' ? C.green : tone === 'end' ? C.red : '#e4ddf0';
  const glyph = tone === 'muted' ? C.inkSoft : '#fff';
  // classic handset glyph (lucide "phone"), centered via translate
  const s = (r * 0.95) / 12;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={fill} />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth={1}
      />
      <path
        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"
        fill={glyph}
        transform={`translate(${cx - 12 * s} ${cy - 12 * s}) scale(${s})`}
        opacity={0.95}
      />
      {label && (
        <T x={cx} y={cy + r + 18} size={10.5} anchor="middle" fill={C.inkSoft} mono>
          {label}
        </T>
      )}
    </g>
  );
}

/** Soft drop shadow filter + dot-grid pattern defs shared by every visual. */
export function VisualDefs({ id }: { id: string }) {
  return (
    <defs>
      <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="10" stdDeviation="14" floodColor="#0d0618" floodOpacity="0.35" />
      </filter>
      <filter id={`${id}-lift`} x="-20%" y="-20%" width="140%" height="160%">
        <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#0d0618" floodOpacity="0.28" />
      </filter>
      <pattern id={`${id}-dots`} width="22" height="22" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.4" fill="rgba(255,255,255,0.07)" />
      </pattern>
      <pattern id={`${id}-dots-dark`} width="22" height="22" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.4" fill="rgba(36,20,51,0.08)" />
      </pattern>
      <linearGradient id={`${id}-tealbar`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={C.teal} />
        <stop offset="1" stopColor="#2b8f82" />
      </linearGradient>
      <linearGradient id={`${id}-violetbar`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a78bfa" />
        <stop offset="1" stopColor={C.violetDeep} />
      </linearGradient>
    </defs>
  );
}

/** Skeleton text bars — abstract content lines, never fake copy. */
export function Bars({
  x,
  y,
  widths,
  gap = 10,
  h = 8,
  rx = 4,
  fill = '#ddd5ec',
}: {
  x: number;
  y: number;
  widths: number[];
  gap?: number;
  h?: number;
  rx?: number;
  fill?: string;
}) {
  return (
    <g>
      {widths.map((w, i) => (
        <rect key={i} x={x} y={y + i * (h + gap)} width={w} height={h} rx={rx} fill={fill} />
      ))}
    </g>
  );
}

/** Small waveform bars for a live-call feel. */
export function Waveform({
  x,
  y,
  w,
  h,
  bars = 28,
  id,
  color,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  bars?: number;
  id: string;
  color?: string;
}) {
  const bw = w / bars;
  // deterministic pseudo-random heights
  const heights = Array.from({ length: bars }, (_, i) => {
    const v = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
    return 0.25 + v * 0.75;
  });
  return (
    <g>
      {heights.map((v, i) => {
        const bh = v * h;
        return (
          <rect
            key={i}
            x={x + i * bw + bw * 0.22}
            y={y + (h - bh) / 2}
            width={bw * 0.56}
            height={bh}
            rx={bw * 0.28}
            fill={color ?? `url(#${id}-tealbar)`}
          />
        );
      })}
    </g>
  );
}
