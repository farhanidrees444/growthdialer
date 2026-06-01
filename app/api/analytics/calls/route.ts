import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// ─── Constants ────────────────────────────────────────────────────────────────

const DISP_LABELS: Record<string, string> = {
  interested:     'Interested',
  callback:       'Callback',
  meeting_booked: 'Meeting Booked',
  voicemail:      'Voicemail',
  not_interested: 'Not Interested',
  wrong_number:   'Wrong Number',
  gatekeeper:     'Gatekeeper',
  dnc:            'DNC',
  missed:         'Missed',
};

const DISP_COLORS: Record<string, string> = {
  interested:     '#10b981',
  callback:       '#f59e0b',
  meeting_booked: '#8b5cf6',
  voicemail:      '#3b82f6',
  not_interested: '#ef4444',
  wrong_number:   '#64748b',
  gatekeeper:     '#a78bfa',
  dnc:            '#be123c',
  missed:         '#94a3b8',
};

const SENT_COLORS: Record<string, string> = {
  positive: '#10b981',
  neutral:  '#f59e0b',
  negative: '#ef4444',
};

const DOW_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DOW_BY_INDEX: Record<number, string> = {
  0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat',
};

function fmtHour(h: number): string {
  if (h === 0)  return '12a';
  if (h < 12)   return `${h}a`;
  if (h === 12) return '12p';
  return `${h - 12}p`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type CallRow = {
  started_at:        string;
  answered_at:       string | null;
  duration_seconds:  number | null;
  direction:         string | null;
  disposition:       string | null;
  from_number:       string | null;
  to_number:         string | null;
  ai_sentiment:      string | null;
  ai_intent:         string | null;
  ai_analysis_status: string | null;
  ai_keywords:       unknown;
};

export type KpiSet = {
  totalCalls:    number;
  connectedCalls: number;
  connectRate:   number;   // 0–100
  avgDuration:   number;   // seconds
  totalTalkTime: number;   // seconds
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeKpis(calls: CallRow[]): KpiSet {
  const total     = calls.length;
  const answered  = calls.filter((c) => !!c.answered_at);
  const connected = answered.length;
  const totalTalk = calls.reduce((s, c) => s + (c.duration_seconds ?? 0), 0);
  const avgDur    = connected > 0
    ? answered.reduce((s, c) => s + (c.duration_seconds ?? 0), 0) / connected
    : 0;
  return {
    totalCalls:    total,
    connectedCalls: connected,
    connectRate:   total > 0 ? +((connected / total) * 100).toFixed(1) : 0,
    avgDuration:   Math.round(avgDur),
    totalTalkTime: totalTalk,
  };
}

function allDaysInRange(start: string, end: string): string[] {
  const days: string[] = [];
  const cur     = new Date(start);
  const endDate = new Date(end);
  while (cur < endDate) {
    days.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start') ?? new Date(Date.now() - 30 * 86400_000).toISOString();
    const end   = searchParams.get('end')   ?? new Date().toISOString();
    const dir   = searchParams.get('direction')  ?? 'all';
    const disp  = searchParams.get('disposition') ?? '';
    const num   = searchParams.get('number')      ?? '';

    // Previous period: same duration, immediately before start
    const startMs  = new Date(start).getTime();
    const endMs    = new Date(end).getTime();
    const spanMs   = Math.max(endMs - startMs, 1);
    const prevStart = new Date(startMs - spanMs).toISOString();

    // Single query covering both current + previous period
    let q = supabase
      .from('calls')
      .select(`
        started_at, answered_at, duration_seconds, direction,
        disposition, from_number, to_number,
        ai_sentiment, ai_intent, ai_analysis_status, ai_keywords
      `)
      .eq('user_id', user.id)
      .gte('started_at', prevStart)
      .lt('started_at', end)
      .not('started_at', 'is', null)
      .order('started_at', { ascending: true })
      .limit(10000);

    if (dir !== 'all') q = q.eq('direction', dir);
    if (disp) q = q.eq('disposition', disp);
    if (num)  q = q.or(`from_number.eq.${num},to_number.eq.${num}`);

    const { data: all, error: dbErr } = await q;
    if (dbErr) {
      console.error('[ANALYTICS-CALLS] DB error:', dbErr);
      return NextResponse.json({ error: dbErr.message }, { status: 500 });
    }

    const rows    = (all ?? []) as CallRow[];
    const current = rows.filter((c) => c.started_at >= start);
    const prev    = rows.filter((c) => c.started_at < start);

    const kpi     = computeKpis(current);
    const kpiPrev = computeKpis(prev);

    // ── Calls over time (all days filled, even zeros) ─────────────────────
    const dayRange = allDaysInRange(start, end);
    type DayBucket = { in: number; out: number; conn: number; dur: number };
    const dayMap = new Map<string, DayBucket>(
      dayRange.map((d) => [d, { in: 0, out: 0, conn: 0, dur: 0 }]),
    );
    for (const c of current) {
      const day = c.started_at.slice(0, 10);
      const b   = dayMap.get(day);
      if (!b) continue;
      if (c.direction === 'inbound') b.in++; else b.out++;
      if (c.answered_at) { b.conn++; b.dur += c.duration_seconds ?? 0; }
    }
    const callsOverTime = dayRange.map((date) => {
      const b = dayMap.get(date)!;
      return { date, inbound: b.in, outbound: b.out, total: b.in + b.out };
    });

    // ── Sparklines (parallel arrays, same length as callsOverTime) ────────
    const sparklines = {
      totalCalls:  callsOverTime.map((d) => d.total),
      connectRate: dayRange.map((d) => {
        const b = dayMap.get(d)!;
        return b.in + b.out > 0 ? Math.round((b.conn / (b.in + b.out)) * 100) : 0;
      }),
      avgDuration: dayRange.map((d) => {
        const b = dayMap.get(d)!;
        return b.conn > 0 ? Math.round(b.dur / b.conn) : 0;
      }),
      talkTime: dayRange.map((d) => dayMap.get(d)!.dur),
    };

    // ── Disposition breakdown ─────────────────────────────────────────────
    const dispMap = new Map<string, number>();
    for (const c of current) {
      if (c.disposition) dispMap.set(c.disposition, (dispMap.get(c.disposition) ?? 0) + 1);
    }
    const dispositions = Array.from(dispMap.entries())
      .map(([d, count]) => ({
        disposition: d,
        label: DISP_LABELS[d] ?? d.replace(/_/g, ' ').replace(/\b\w/g, (x) => x.toUpperCase()),
        count,
        color: DISP_COLORS[d] ?? '#64748b',
      }))
      .sort((a, b) => b.count - a.count);

    // ── Hour of day (0–23, UTC) ───────────────────────────────────────────
    const hourBuckets = Array.from({ length: 24 }, (_, h) => ({
      hour: h, label: fmtHour(h), total: 0, connected: 0, connectRate: 0,
    }));
    for (const c of current) {
      const h = new Date(c.started_at).getUTCHours();
      hourBuckets[h].total++;
      if (c.answered_at) hourBuckets[h].connected++;
    }
    for (const b of hourBuckets) {
      b.connectRate = b.total > 0 ? Math.round((b.connected / b.total) * 100) : 0;
    }

    // ── Day of week (Mon–Sun) ─────────────────────────────────────────────
    const dowCount = Object.fromEntries(DOW_ORDER.map((d) => [d, 0]));
    for (const c of current) {
      const dow = DOW_BY_INDEX[new Date(c.started_at).getUTCDay()];
      if (dow && dow in dowCount) dowCount[dow]++;
    }
    const dayOfWeek = DOW_ORDER.map((day) => ({ day, calls: dowCount[day] }));

    // ── Per-number performance ────────────────────────────────────────────
    const numMap = new Map<string, { total: number; conn: number; dur: number }>();
    for (const c of current) {
      // User's side: from_number on outbound, to_number on inbound
      const n = c.direction === 'inbound' ? (c.to_number ?? '') : (c.from_number ?? '');
      if (!n) continue;
      if (!numMap.has(n)) numMap.set(n, { total: 0, conn: 0, dur: 0 });
      const b = numMap.get(n)!;
      b.total++;
      if (c.answered_at) { b.conn++; b.dur += c.duration_seconds ?? 0; }
    }
    const perNumber = Array.from(numMap.entries())
      .map(([number, v]) => ({
        number,
        total:       v.total,
        connected:   v.conn,
        avgDuration: v.conn > 0 ? Math.round(v.dur / v.conn) : 0,
        connectRate: v.total > 0 ? Math.round((v.conn / v.total) * 100) : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // ── AI Insights (only from completed analysis) ────────────────────────
    const analyzed = current.filter((c) => c.ai_analysis_status === 'completed');

    const sentMap = new Map<string, number>();
    for (const c of analyzed) {
      if (c.ai_sentiment) sentMap.set(c.ai_sentiment, (sentMap.get(c.ai_sentiment) ?? 0) + 1);
    }
    const sentiment = Array.from(sentMap.entries())
      .map(([s, count]) => ({ sentiment: s, count, color: SENT_COLORS[s] ?? '#94a3b8' }))
      .sort((a, b) => b.count - a.count);

    const intentMap = new Map<string, number>();
    for (const c of analyzed) {
      if (c.ai_intent) intentMap.set(c.ai_intent, (intentMap.get(c.ai_intent) ?? 0) + 1);
    }
    const intents = Array.from(intentMap.entries())
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const kwMap = new Map<string, number>();
    for (const c of analyzed) {
      if (!Array.isArray(c.ai_keywords)) continue;
      for (const kw of c.ai_keywords as unknown[]) {
        if (typeof kw !== 'string' || !kw.trim()) continue;
        const k = kw.toLowerCase().trim();
        kwMap.set(k, (kwMap.get(k) ?? 0) + 1);
      }
    }
    const keywords = Array.from(kwMap.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 24);

    return NextResponse.json({
      current:      kpi,
      prev:         kpiPrev,
      callsOverTime,
      dispositions,
      hourOfDay:    hourBuckets,
      dayOfWeek,
      perNumber,
      ai: { sentiment, intents, keywords, totalAnalyzed: analyzed.length },
      sparklines,
    });
  } catch (err) {
    console.error('[ANALYTICS-CALLS]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
