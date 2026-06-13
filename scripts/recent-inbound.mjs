import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
  for (const line of raw.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    if (!process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}
loadEnv();

const userId = '601d7d0e-c45e-434f-830c-64313211781d';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
const { data: calls } = await supabase
  .from('calls')
  .select('id, status, answered_at, ended_at, hangup_cause, created_at, telnyx_webrtc_leg_id, disposition')
  .eq('user_id', userId)
  .eq('direction', 'inbound')
  .gte('created_at', since)
  .order('created_at', { ascending: false })
  .limit(10);

console.log('SINCE', since);
console.log('CALLS', JSON.stringify(calls, null, 2));

const { data: presence } = await supabase.from('voice_agent_presence').select('*').eq('user_id', userId).maybeSingle();
console.log('PRESENCE', presence);
