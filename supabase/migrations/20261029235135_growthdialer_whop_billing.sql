-- Additive billing schema. Purchasing stays gated independently from schema rollout.
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS billing_provider text;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS whop_membership_id text UNIQUE;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS whop_updated_at timestamptz;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS whop_intent_id uuid;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS whop_sandbox boolean;

CREATE TABLE public.billing_checkout_intents (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('starter','growth','pro')),
  cycle text NOT NULL CHECK (cycle IN ('monthly','annual')),
  seats integer NOT NULL CHECK (seats BETWEEN 1 AND 500),
  amount numeric NOT NULL CHECK (amount > 0),
  product_id text NOT NULL,
  sandbox boolean NOT NULL,
  checkout_id text UNIQUE,
  provider_plan_id text,
  membership_id text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX billing_checkout_intents_user_created ON public.billing_checkout_intents(user_id, created_at);
ALTER TABLE public.billing_checkout_intents ENABLE ROW LEVEL SECURITY;
CREATE POLICY billing_intents_read_own ON public.billing_checkout_intents FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
REVOKE ALL ON public.billing_checkout_intents FROM anon, authenticated;
GRANT SELECT ON public.billing_checkout_intents TO authenticated;
GRANT ALL ON public.billing_checkout_intents TO service_role;
CREATE TABLE public.whop_processed_events (id text PRIMARY KEY, processed_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE public.whop_processed_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.whop_processed_events FROM anon, authenticated;
GRANT ALL ON public.whop_processed_events TO service_role;

CREATE FUNCTION public.apply_whop_membership(
 p_event_id text, p_intent_id uuid, p_membership_id text, p_plan_id text, p_product_id text,
 p_status text, p_updated_at timestamptz, p_period_start timestamptz, p_period_end timestamptz,
 p_cancel_at_period_end boolean, p_sandbox boolean
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE intent billing_checkout_intents; existing subscriptions;
BEGIN
 -- Event receipt and entitlement changes commit together; failures remain retryable.
 INSERT INTO whop_processed_events(id) VALUES(p_event_id) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN; END IF;
 SELECT * INTO STRICT intent FROM billing_checkout_intents WHERE id = p_intent_id FOR UPDATE;
 IF intent.sandbox <> p_sandbox OR intent.provider_plan_id IS DISTINCT FROM p_plan_id
   OR intent.product_id IS DISTINCT FROM p_product_id OR intent.checkout_id IS NULL THEN
   RAISE EXCEPTION 'Checkout mismatch';
 END IF;
 IF intent.membership_id IS NOT NULL AND intent.membership_id <> p_membership_id THEN
   RAISE EXCEPTION 'Checkout already consumed';
 END IF;
 -- Serialize different checkout intents for the same user.
 PERFORM pg_advisory_xact_lock(hashtextextended(intent.user_id::text, 0));
 SELECT * INTO existing FROM subscriptions WHERE user_id = intent.user_id FOR UPDATE;
 IF existing.whop_membership_id = p_membership_id AND existing.whop_updated_at >= p_updated_at THEN RETURN; END IF;
 -- An older membership must never overwrite a newer purchase, even on a retry.
 IF existing.whop_membership_id IS NOT NULL AND existing.whop_membership_id <> p_membership_id THEN
   IF existing.whop_intent_id IS NOT NULL AND
      (SELECT created_at FROM billing_checkout_intents WHERE id = existing.whop_intent_id) >= intent.created_at THEN RETURN; END IF;
 END IF;
 IF existing.user_id IS NOT NULL AND existing.whop_membership_id IS DISTINCT FROM p_membership_id
    AND existing.status IN ('active','trialing','past_due') THEN RAISE EXCEPTION 'Existing subscription requires reconciliation'; END IF;
 IF p_status NOT IN ('active','trialing','past_due','canceled','incomplete') THEN RAISE EXCEPTION 'Invalid state'; END IF;
 IF p_status IN ('active','trialing') AND p_period_end IS NULL THEN RAISE EXCEPTION 'Missing access expiry'; END IF;
 UPDATE billing_checkout_intents SET membership_id = p_membership_id WHERE id = intent.id;
 INSERT INTO subscriptions(user_id, plan, billing_cycle, seats, status, current_period_start, current_period_end,
   billing_provider, whop_membership_id, whop_updated_at, cancel_at_period_end, whop_intent_id, whop_sandbox)
 VALUES(intent.user_id, intent.plan, intent.cycle, intent.seats, p_status, p_period_start, p_period_end,
   'whop', p_membership_id, p_updated_at, p_cancel_at_period_end, intent.id, p_sandbox)
 ON CONFLICT(user_id) DO UPDATE SET plan=excluded.plan, billing_cycle=excluded.billing_cycle,
   seats=excluded.seats, status=excluded.status, current_period_start=excluded.current_period_start,
   current_period_end=excluded.current_period_end, billing_provider='whop',
   whop_membership_id=excluded.whop_membership_id, whop_updated_at=excluded.whop_updated_at,
   cancel_at_period_end=excluded.cancel_at_period_end, whop_intent_id=excluded.whop_intent_id, whop_sandbox=excluded.whop_sandbox;
END $$;
REVOKE ALL ON FUNCTION public.apply_whop_membership(text,uuid,text,text,text,text,timestamptz,timestamptz,timestamptz,boolean,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_whop_membership(text,uuid,text,text,text,text,timestamptz,timestamptz,timestamptz,boolean,boolean) TO service_role;
