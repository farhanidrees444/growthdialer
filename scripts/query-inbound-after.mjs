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

const since = '2026-06-13T19:31:00.000Z';
const { data: after } = await supabase
  .from('calls')
  .select('id, status, answered_at, ended_at, hangup_cause, created_at, telnyx_webrtc_leg_id, disposition')
  .eq('user_id', userId)
  .eq('direction', 'inbound')
  .gte('created_at', since)
  .order('created_at', { ascending: false });
console.log('AFTER_1931', JSON.stringify(after, null, 2));

const { data: success } = await supabase
  .from('calls')
  .select('id, status, answered_at, ended_at, created_at, telnyx_webrtc_leg_id, duration')
  .eq('user_id', userId)
  .eq('direction', 'inbound')
  .gte('created_at', '2026-06-13T18:50:00Z')
  .lte('created_at', '2026-06-13T18:55:00Z')
  .order('created_at', { ascending: false });
console.log('SUCCESS_1850_1855', JSON.stringify(success, null, 2));
