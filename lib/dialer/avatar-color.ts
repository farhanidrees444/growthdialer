// Stable gradient pairs, seeded from lead ID so avatar color never changes
const GRADIENTS: [string, string][] = [
  ['#7C3AED', '#06B6D4'], // purple → cyan
  ['#DB2777', '#F59E0B'], // pink → amber
  ['#059669', '#3B82F6'], // emerald → blue
  ['#DC2626', '#F97316'], // red → orange
  ['#2563EB', '#7C3AED'], // blue → purple
  ['#0891B2', '#10B981'], // cyan → emerald
  ['#7C3AED', '#EC4899'], // purple → pink
  ['#F59E0B', '#EF4444'], // amber → red
  ['#6366F1', '#06B6D4'], // indigo → cyan
  ['#10B981', '#6366F1'], // emerald → indigo
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getAvatarGradient(id: string): { from: string; to: string; css: string } {
  const [from, to] = GRADIENTS[hashId(id) % GRADIENTS.length];
  return { from, to, css: `linear-gradient(135deg, ${from}, ${to})` };
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}
