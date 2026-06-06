import type { SupabaseClient } from '@supabase/supabase-js';

const HUBSPOT_AUTH_URL = 'https://app.hubspot.com/oauth/authorize';
const HUBSPOT_TOKEN_URL = 'https://api.hubapi.com/oauth/v1/token';
const HUBSPOT_API = 'https://api.hubapi.com';

export const HUBSPOT_SCOPES = [
  'crm.objects.contacts.read',
  'crm.objects.contacts.write',
  'crm.objects.calls.write',
].join(' ');

export function hubspotRedirectUri(): string {
  const base = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${base}/api/integrations/hubspot/callback`;
}

export function buildHubspotAuthorizeUrl(state: string): string | null {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  if (!clientId) return null;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: hubspotRedirectUri(),
    scope: HUBSPOT_SCOPES,
    state,
  });
  return `${HUBSPOT_AUTH_URL}?${params.toString()}`;
}

export async function exchangeHubspotCode(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
} | null> {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch(HUBSPOT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: hubspotRedirectUri(),
      code,
    }),
  });

  if (!res.ok) {
    console.error('[HubSpot] token exchange failed:', await res.text());
    return null;
  }

  return res.json();
}

export async function refreshHubspotToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
} | null> {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch(HUBSPOT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) return null;
  return res.json();
}

async function getValidAccessToken(
  supabase: SupabaseClient,
  workspaceId: string,
  userId: string,
): Promise<string | null> {
  const { data: cred } = await supabase
    .from('integration_credentials')
    .select('*')
    .eq('provider', 'hubspot')
    .eq('is_active', true)
    .or(`workspace_id.eq.${workspaceId},user_id.eq.${userId}`)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!cred) return null;

  const expiresAt = cred.expires_at ? new Date(cred.expires_at).getTime() : 0;
  if (expiresAt > Date.now() + 60_000) {
    return cred.access_token;
  }

  if (!cred.refresh_token) return null;
  const refreshed = await refreshHubspotToken(cred.refresh_token);
  if (!refreshed) return null;

  const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
  await supabase
    .from('integration_credentials')
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: newExpiry,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cred.id);

  return refreshed.access_token;
}

async function findHubspotContactByPhone(
  accessToken: string,
  phone: string,
): Promise<string | null> {
  const digits = phone.replace(/\D/g, '').slice(-10);
  if (!digits) return null;

  const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/contacts/search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filterGroups: [{
        filters: [{
          propertyName: 'phone',
          operator: 'CONTAINS_TOKEN',
          value: digits,
        }],
      }],
      limit: 1,
    }),
  });

  if (!res.ok) return null;
  const data = await res.json() as { results?: { id: string }[] };
  return data.results?.[0]?.id ?? null;
}

export async function logCallToHubspot(
  supabase: SupabaseClient,
  params: {
    workspaceId: string;
    userId: string;
    leadPhone: string;
    leadName: string;
    disposition: string;
    notes?: string;
    durationSeconds?: number;
    direction?: string;
  },
): Promise<boolean> {
  const token = await getValidAccessToken(supabase, params.workspaceId, params.userId);
  if (!token) return false;

  const contactId = await findHubspotContactByPhone(token, params.leadPhone);
  if (!contactId) return false;

  const body = [
    `Disposition: ${params.disposition}`,
    params.notes ? `Notes: ${params.notes}` : '',
  ].filter(Boolean).join('\n');

  const res = await fetch(`${HUBSPOT_API}/crm/v3/objects/calls`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        hs_timestamp: new Date().toISOString(),
        hs_call_title: `GrowthDialer — ${params.leadName}`,
        hs_call_body: body,
        hs_call_duration: String((params.durationSeconds ?? 0) * 1000),
        hs_call_direction: params.direction === 'inbound' ? 'INBOUND' : 'OUTBOUND',
        hs_call_status: 'COMPLETED',
        hs_call_disposition: params.disposition,
      },
      associations: [{
        to: { id: contactId },
        types: [{
          associationCategory: 'HUBSPOT_DEFINED',
          associationTypeId: 194,
        }],
      }],
    }),
  });

  if (!res.ok) {
    console.error('[HubSpot] log call failed:', await res.text());
    return false;
  }
  return true;
}
