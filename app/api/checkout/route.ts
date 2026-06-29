import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  POLAR_API_BASE,
  getPolarProductId,
  isBillingCycle,
  isPaidPlan,
  polarHeaders,
} from '@/lib/plan/polar';

interface PolarCustomer {
  id: string;
  external_id?: string | null;
  email?: string | null;
}

interface PolarCheckout {
  id?: string;
  url?: string;
}

function appUrl(request: NextRequest) {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || request.nextUrl.origin;
}

async function polarRequest<T>(path: string, init: RequestInit, token: string): Promise<{ ok: true; data: T } | { ok: false; status: number; data: unknown }> {
  const res = await fetch(`${POLAR_API_BASE}${path}`, {
    ...init,
    headers: {
      ...polarHeaders(token),
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  });

  const data = await res.json().catch(() => null) as unknown;
  if (!res.ok) return { ok: false, status: res.status, data };
  return { ok: true, data: data as T };
}

async function getOrCreateCustomer(token: string, user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }): Promise<PolarCustomer> {
  const externalId = user.id;
  const existing = await polarRequest<PolarCustomer>(
    `/v1/customers/external/${encodeURIComponent(externalId)}`,
    { method: 'GET' },
    token,
  );

  if (existing.ok) return existing.data;
  if (existing.status !== 404) throw new Error('Could not retrieve customer');

  const created = await polarRequest<PolarCustomer>(
    '/v1/customers/',
    {
      method: 'POST',
      body: JSON.stringify({
        email: user.email,
        name: typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : undefined,
        external_id: externalId,
      }),
    },
    token,
  );

  if (!created.ok) throw new Error('Could not create customer');
  return created.data;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const plan = searchParams.get('plan');
  const cycle = searchParams.get('cycle');
  const seatsRaw = Number(searchParams.get('seats') ?? '1');

  if (!isPaidPlan(plan) || !isBillingCycle(cycle) || !Number.isInteger(seatsRaw) || seatsRaw < 1 || seatsRaw > 500) {
    return NextResponse.json({ error: 'Invalid checkout request' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const signup = new URL('/signup', appUrl(request));
    signup.searchParams.set('plan', plan);
    signup.searchParams.set('seats', String(seatsRaw));
    signup.searchParams.set('cycle', cycle);
    signup.searchParams.set('next', `/api/checkout?plan=${plan}&seats=${seatsRaw}&cycle=${cycle}`);
    return NextResponse.redirect(signup);
  }

  const token = process.env.POLAR_ACCESS_TOKEN?.trim();
  const productId = getPolarProductId(plan, cycle);
  if (!token || !productId) {
    console.error('[POLAR-CHECKOUT] Missing checkout configuration');
    return NextResponse.json({ error: 'Checkout is not available right now' }, { status: 503 });
  }

  try {
    const customer = await getOrCreateCustomer(token, user);
    const baseUrl = appUrl(request);
    const checkout = await polarRequest<PolarCheckout>(
      '/v1/checkouts/',
      {
        method: 'POST',
        body: JSON.stringify({
          products: [productId],
          seats: seatsRaw,
          allow_trial: true,
          customer_id: customer.id,
          customer_email: user.email,
          external_customer_id: user.id,
          customer_metadata: {
            user_id: user.id,
          },
          metadata: {
            userId: user.id,
            plan,
            billingCycle: cycle,
            seats: String(seatsRaw),
            productId,
          },
          success_url: `${baseUrl}/pricing/success?session_id={CHECKOUT_ID}`,
          return_url: `${baseUrl}/pricing?highlight=${plan}`,
        }),
      },
      token,
    );

    if (!checkout.ok || !checkout.data.url) {
      console.error('[POLAR-CHECKOUT] Checkout creation failed', checkout.ok ? checkout.data : checkout.data);
      return NextResponse.json({ error: 'Could not start checkout' }, { status: 502 });
    }

    return NextResponse.redirect(checkout.data.url);
  } catch (error) {
    console.error('[POLAR-CHECKOUT] Error', error);
    return NextResponse.json({ error: 'Could not start checkout' }, { status: 500 });
  }
}
