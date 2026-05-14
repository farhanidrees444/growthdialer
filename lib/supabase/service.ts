import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

export function createServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.warn('Supabase service role key is not configured. Webhook persistence will be disabled.');
    return null;
  }

  return createSupabaseClient(url, key);
}
