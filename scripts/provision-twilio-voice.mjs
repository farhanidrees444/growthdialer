/**
 * One-time Twilio voice stack provisioner.
 * Loads .env.local and configures TwiML App + owned DIDs.
 *
 * Usage: node scripts/provision-twilio-voice.mjs [+E164...]
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import twilio from 'twilio';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = join(root, '.env.local');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const raw = readFileSync(path, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(envPath);

const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
const twimlAppSid = process.env.TWILIO_TWIML_APP_SID?.trim();
const appUrl = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.growthdialer.com').replace(/\/$/, '');

if (!accountSid || !authToken || !twimlAppSid) {
  console.error('Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_TWIML_APP_SID in .env.local');
  process.exit(1);
}

const client = twilio(accountSid, authToken);
const extraNumbers = process.argv.slice(2);
const defaultNumber = process.env.TWILIO_NUMBER?.trim();

async function main() {
  const voiceUrl = `${appUrl}/api/twilio/voice`;
  const voiceFallbackUrl = `${appUrl}/api/twilio/voice-fallback`;
  const statusUrl = `${appUrl}/api/twilio/status-callback`;

  console.log('Updating TwiML App', twimlAppSid);
  console.log('  Voice URL:', voiceUrl);
  console.log('  Fallback URL:', voiceFallbackUrl);
  console.log('  Status URL:', statusUrl);

  await client.applications(twimlAppSid).update({
    voiceUrl,
    voiceMethod: 'POST',
    voiceFallbackUrl,
    voiceFallbackMethod: 'POST',
    statusCallback: statusUrl,
    statusCallbackMethod: 'POST',
  });

  const targets = new Set(
    [...extraNumbers, defaultNumber].filter(Boolean).map((n) => n.replace(/\s/g, '')),
  );

  if (targets.size === 0) {
    const all = await client.incomingPhoneNumbers.list({ limit: 50 });
    for (const num of all) targets.add(num.phoneNumber);
  }

  for (const e164 of targets) {
    const matches = await client.incomingPhoneNumbers.list({ phoneNumber: e164, limit: 1 });
    const incoming = matches[0];
    if (!incoming) {
      console.warn('  Number not in account:', e164);
      continue;
    }
    await client.incomingPhoneNumbers(incoming.sid).update({
      voiceApplicationSid: twimlAppSid,
    });
    console.log('  Linked DID', e164, '→ TwiML App');
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
