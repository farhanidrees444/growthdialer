'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Phone, ChevronRight, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PremiumEmptyState } from '@/components/ui/premium-empty-state';
import { useWorkspace } from '@/contexts/workspace-context';
import { useLeads } from '@/contexts/leads-context';

interface Lead {
  id: string;
  name: string | null;
  title: string | null;
  company: string | null;
  status: string;
  ai_score: number | null;
}

function scoreColor(score: number | null) {
  if (score === null) return 'text-slate-600';
  if (score >= 80) return 'text-emerald-400';
  if (score >= 50) return 'text-amber-400';
  return 'text-slate-400';
}

function initials(name: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UpNextQueue() {
  const router = useRouter();
  const { currentWorkspace, apiFetch } = useWorkspace();
  const { setImportOpen } = useLeads();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentWorkspace?.id) return;
    setLoading(true);
    apiFetch('/api/leads/queue?limit=5&status=queued,new,callback')
      .then((r) => r.json())
      .then((data) => setLeads(data.leads ?? []))
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [currentWorkspace?.id, apiFetch]);

  return (
    <Card className="flex h-full flex-col border-white/10 bg-[oklch(0.09_0.006_285)]/90 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-400" />
          <span className="text-xs font-semibold text-white">Up Next</span>
        </div>
        <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
          By priority
        </span>
      </div>

      <div className="flex-1 px-3 py-2">
        {loading ? (
          <div className="space-y-2 pt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-xl border border-white/[0.04] bg-white/[0.02]" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <PremiumEmptyState
            icon={Phone}
            scene="dialer"
            accent="violet"
            compact
            title="Nothing queued yet"
            description="Import leads to see your top priorities here."
            primaryAction={{ label: 'Import CSV', onClick: () => setImportOpen(true) }}
            secondaryAction={{ label: 'Open dialer', href: '/dialer' }}
            className="py-8"
          />
        ) : (
          <motion.div
            className="space-y-1 pt-1"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
          >
            {leads.map((lead) => (
              <motion.button
                key={lead.id}
                type="button"
                variants={{ hidden: { opacity: 0, x: 8 }, show: { opacity: 1, x: 0 } }}
                transition={{ duration: 0.18 }}
                onClick={() => router.push(`/dialer?lead_id=${lead.id}`)}
                className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-2.5 py-2 text-left transition-all hover:border-white/[0.06] hover:bg-white/[0.03]"
              >
                {/* Avatar */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-[11px] font-bold text-indigo-300">
                  {initials(lead.name)}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-200">
                    {lead.name ?? 'Unknown'}
                  </p>
                  <p className="truncate text-[10px] text-slate-600">
                    {[lead.title, lead.company].filter(Boolean).join(' · ') || lead.status}
                  </p>
                </div>

                {/* Score + arrow */}
                <div className="flex shrink-0 items-center gap-1.5">
                  {lead.ai_score !== null && (
                    <span className={`font-mono text-xs font-bold ${scoreColor(lead.ai_score)}`}>
                      {lead.ai_score}
                    </span>
                  )}
                  <ChevronRight className="h-3 w-3 text-slate-700 transition-colors group-hover:text-slate-400" />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      <div className="border-t border-white/[0.06] px-4 py-2.5">
        <Link
          href="/leads"
          className="flex items-center justify-center gap-1 text-[11px] font-medium text-slate-500 transition-colors hover:text-slate-300"
        >
          View all leads
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}
