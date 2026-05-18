import { createServiceClient } from '@/lib/supabase/service';

const DAILY_LIMITS = {
  free: 50,
  pro: 1000,
  enterprise: 10000,
} as const;

export async function checkAIRateLimit(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const supabase = createServiceClient();
  if (!supabase) return { allowed: true, used: 0, limit: 1000 };

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Get user plan
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  const plan = (profile?.plan ?? 'free') as keyof typeof DAILY_LIMITS;
  const limit = DAILY_LIMITS[plan] ?? DAILY_LIMITS.free;

  // Count AI analyses done today
  const { count } = await supabase
    .from('call_analytics')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', todayStart.toISOString());

  const used = count ?? 0;
  return { allowed: used < limit, used, limit };
}
