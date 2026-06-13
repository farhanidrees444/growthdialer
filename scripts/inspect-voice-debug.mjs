/**
 * Inspect recent inbound voice state for debug session 30998c.
 * Usage: node scripts/inspect-voice-debug.mjs [email]
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    for (const line of raw.split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (!m) continue;
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* ignore */ }
}

loadEnv();

const email = process.argv[2] ?? 'farhanidrees.digital@gmail.com';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing Supabase env');
  process.exit(1);
}

const supabase = createClient(url, key);
const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
const user = users?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error('User not found:', email);
  process.exit(1);
}

console.log('USER', user.id, user.email);

const { data: presence, error: presErr } = await supabase
  .from('voice_agent_presence')
  .select('*')
  .eq('user_id', user.id)
  .maybeSingle();
console.log('PRESENCE', presErr?.message ?? presence);

const { data: settings } = await supabase
  .from('user_settings')
  .select('telnyx_telephony_credential_id, recording_mode, inbound_mode, inbound_forward_number, inbound_ring_seconds')
  .eq('user_id', user.id)
  .maybeSingle();
console.log('USER_SETTINGS', settings);

const { data: numbers, error: numErr } = await supabase
  .from('purchased_numbers')
  .select('id, phone_number, status, is_default, user_id, workspace_id')
  .or(`user_id.eq.${user.id},phone_number.eq.+15304792128`)
  .order('created_at', { ascending: false });
console.log('NUMBERS', numErr?.message ?? numbers);

const { data: calls } = await supabase
  .from('calls')
  .select('id, status, direction, from_number, to_number, telnyx_call_id, telnyx_webrtc_leg_id, created_at, answered_at, ended_at')
  .eq('user_id', user.id)
  .eq('direction', 'inbound')
  .order('created_at', { ascending: false })
  .limit(8);
console.log('RECENT_INBOUND_CALLS', JSON.stringify(calls, null, 2));

if (calls?.[0]?.id) {
  const { data: latest } = await supabase.from('calls').select('*').eq('id', calls[0].id).single();
  console.log('LATEST_CALL_FULL', JSON.stringify(latest, null, 2));
}

try {
  const { data: pns } = await supabase
    .from('phone_number_settings')
    .select('*')
    .eq('user_id', user.id);
  console.log('PHONE_NUMBER_SETTINGS', pns);
} catch (e) {
  console.log('PHONE_NUMBER_SETTINGS', 'table missing or error', e.message);
}
