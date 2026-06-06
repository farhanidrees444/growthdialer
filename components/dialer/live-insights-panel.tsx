'use client';

import { Brain, Building2, Mail, Sparkles, Tag, TrendingUp, User } from 'lucide-react';
import type { LeadRecord } from '@/lib/dialer/state-machine';
import { DialerSurface } from './dialer-surface';
import { Badge } from '@/components/ui/badge';
import { AiInsightsMaterialize } from '@/components/premium/ai-insights-materialize';
import { cn } from '@/lib/utils';

interface LiveInsightsPanelProps {
  lead: LeadRecord;
  /** When true, show in-progress state while AI pipeline runs */
  analyzing?: boolean;
}

export function LiveInsightsPanel({ lead, analyzing = false }: LiveInsightsPanelProps) {
  const score = lead.ai_score;
  const scoreLabel =
    score == null ? null : score >= 80 ? 'Hot' : score >= 55 ? 'Warm' : 'Cold';
  const scoreColor =
    score == null ? '' : score >= 80 ? 'text-amber-400' : score >= 55 ? 'text-cyan-400' : 'text-zinc-400';

  const aiFields = lead.activity_summary
    ? [{ id: 'summary', label: 'AI summary', value: lead.activity_summary, icon: <Brain className="h-3.5 w-3.5" />, variant: 'violet' as const }]
    : [];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Live Insights
          </span>
          {scoreLabel && (
            <Badge variant="secondary" className={cn('text-[10px] font-bold', scoreColor)}>
              {scoreLabel} · {score}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 scrollbar-hide">
        <AiInsightsMaterialize
          fields={aiFields}
          loading={analyzing && aiFields.length === 0}
          emptyMessage={
            analyzing
              ? 'Analysis in progress — insights will stream in when ready.'
              : 'No AI insights yet. They appear automatically after calls are processed.'
          }
        />

        <section>
          <SectionLabel icon={User} label="Lead context" />
          <DialerSurface className="p-3 space-y-2.5">
            <Row label="Name" value={lead.name} />
            {lead.company && <Row icon={Building2} label="Company" value={lead.company} />}
            {lead.title && <Row label="Title" value={lead.title} />}
            {lead.email && <Row icon={Mail} label="Email" value={lead.email} />}
            {lead.industry && <Row label="Industry" value={lead.industry} />}
            {lead.company_size && <Row label="Size" value={lead.company_size} />}
            {lead.revenue && <Row icon={TrendingUp} label="Revenue" value={lead.revenue} />}
            {lead.call_attempts !== undefined && (
              <Row label="Attempts" value={String(lead.call_attempts)} />
            )}
            {lead.last_called_at && (
              <Row label="Last call" value={formatRelative(lead.last_called_at)} />
            )}
            {lead.tags && lead.tags.length > 0 && (
              <div className="flex items-start gap-2 text-xs pt-1">
                <Tag className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex flex-wrap gap-1">
                  {lead.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-[10px] border-white/10">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {lead.notes && (
              <div className="pt-1 border-t border-white/[0.06]">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                <p className="text-xs text-white/70 leading-relaxed line-clamp-4">{lead.notes}</p>
              </div>
            )}
          </DialerSurface>
        </section>

        <DialerSurface className="p-3 opacity-80">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Live AI Coach
            <Badge className="text-[9px] bg-primary/15 text-primary border-0">Soon</Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Real-time sentiment, objection handling, and talk-track suggestions during live calls — shipping in v2.
          </p>
        </DialerSurface>
      </div>
    </div>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: typeof User; label: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

function Row({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof User;
}) {
  return (
    <div className="flex items-start gap-2 text-xs">
      {Icon ? <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" /> : null}
      <span className="w-16 shrink-0 text-muted-foreground">{label}</span>
      <span className="text-white/80 break-all">{value}</span>
    </div>
  );
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 48) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}
