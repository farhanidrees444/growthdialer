'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import type { RubricBreakdown } from './types';

const LABELS: Array<{ key: keyof RubricBreakdown; label: string }> = [
  { key: 'opener_strength', label: 'Opener' },
  { key: 'discovery_depth', label: 'Discovery' },
  { key: 'objection_handling', label: 'Objections' },
  { key: 'value_articulation', label: 'Value' },
  { key: 'close_attempt', label: 'Close' },
];

export function ScoreRadarChart({ breakdown }: { breakdown: RubricBreakdown | null | undefined }) {
  const data = LABELS.map((item) => ({
    metric: item.label,
    score: Math.max(0, Math.min(20, Number(breakdown?.[item.key] ?? 0))),
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="rgba(255,255,255,0.12)" />
          <PolarAngleAxis dataKey="metric" tick={{ fill: '#CBD5E1', fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: 'rgba(0,0,0,0.88)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12 }}
            labelStyle={{ color: '#fff' }}
          />
          <Radar
            name="Score"
            dataKey="score"
            stroke="#06B6D4"
            fill="#8B5CF6"
            fillOpacity={0.35}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
