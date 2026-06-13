/**
 * One-off: release stale numbers for a user, keep a single active DID.
 * Usage: node scripts/release-stale-numbers.mjs <email> <keep_e164>
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

const email = process.argv[2];
const keepE164 = process.argv[3]?.replace(/\D/g, '').replace(/^1?(\d{10})$/, '+1$1')
  ?? process.argv[3];

if (!email || !keepE164) {
  console.error('Usage: node scripts/release-stale-numbers.mjs <email> <keep_e164>');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

const { data: users, error: userErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (userErr) {
  console.error('listUsers failed:', userErr.message);
  process.exit(1);
}

const user = users.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
if (!user) {
  console.error('User not found:', email);
  process.exit(1);
}

const normalize = (p) => {
  const d = p.replace(/\D/g, '');
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith('1')) return `+${d}`;
  return p.startsWith('+') ? p : `+${d}`;
};

const keep = normalize(keepE164);

const { data: numbers, error: numErr } = await supabase
  .from('purchased_numbers')
  .select('id, phone_number, status, is_default')
  .eq('user_id', user.id);

if (numErr) {
  console.error('numbers query failed:', numErr.message);
  process.exit(1);
}

console.log('User:', user.id, email);
console.log('Keep:', keep);
console.log('Current numbers:', numbers?.map((n) => `${n.phone_number} (${n.status})`).join(', '));

const keepRow = numbers?.find((n) => normalize(n.phone_number) === keep);
if (!keepRow) {
  console.error('Keep number not found in purchased_numbers:', keep);
  process.exit(1);
}

const now = new Date().toISOString();
const toRelease = (numbers ?? []).filter(
  (n) => normalize(n.phone_number) !== keep && n.status !== 'released',
);

for (const row of toRelease) {
  const { error } = await supabase
    .from('purchased_numbers')
    .update({ status: 'released', released_at: now, is_default: false })
    .eq('id', row.id);
  if (error) {
    console.error('Release failed:', row.phone_number, error.message);
    process.exit(1);
  }
  console.log('Released:', row.phone_number);
}

await supabase
  .from('purchased_numbers')
  .update({ is_default: false })
  .eq('user_id', user.id)
  .neq('id', keepRow.id);

const { error: primaryErr } = await supabase
  .from('purchased_numbers')
  .update({ status: 'active', is_default: true, released_at: null })
  .eq('id', keepRow.id);

if (primaryErr) {
  console.error('Set primary failed:', primaryErr.message);
  process.exit(1);
}

const { data: profiles } = await supabase
  .from('profiles')
  .select('user_id')
  .eq('user_id', user.id)
  .maybeSingle();

if (profiles) {
  await supabase.from('profiles').update({ default_number: keep }).eq('user_id', user.id);
}

console.log('Done. Active inbound line:', keep);
