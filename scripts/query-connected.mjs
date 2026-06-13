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

const { data: connected } = await supabase
  .from('calls')
  .select('id, status, answered_at, ended_at, created_at, telnyx_webrtc_leg_id, duration_seconds, disposition')
  .eq('user_id', userId)
  .eq('direction', 'inbound')
  .not('answered_at', 'is', null)
  .gte('created_at', '2026-06-13T18:00:00Z')
  .order('created_at', { ascending: false });

console.log('CONNECTED_SINCE_18UTC', JSON.stringify(connected, null, 2));

const { data: recent } = await supabase
  .from('calls')
  .select('id, status, answered_at, ended_at, created_at, telnyx_webrtc_leg_id, duration_seconds, disposition')
  .eq('user_id', userId)
  .eq('direction', 'inbound')
  .gte('created_at', '2026-06-13T20:00:00Z')
  .order('created_at', { ascending: false });

console.log('SINCE_20UTC', JSON.stringify(recent, null, 2));

const { data: latest } = await supabase
  .from('calls')
  .select('id, status, answered_at, ended_at, created_at, telnyx_webrtc_leg_id, duration_seconds, disposition')
  .eq('user_id', userId)
  .eq('direction', 'inbound')
  .order('created_at', { ascending: false })
  .limit(8);
console.log('LATEST', JSON.stringify(latest, null, 2));
