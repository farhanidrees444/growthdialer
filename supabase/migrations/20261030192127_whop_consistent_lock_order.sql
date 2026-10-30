-- Keep the reservation/activation lock order consistent; no customer rows are modified.
CREATE OR REPLACE FUNCTION public.apply_whop_membership(
 p_event_id text, p_intent_id uuid, p_membership_id text, p_plan_id text, p_product_id text,
 p_status text, p_updated_at timestamptz, p_period_start timestamptz, p_period_end timestamptz,
 p_cancel_at_period_end boolean, p_sandbox boolean
) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE intent billing_checkout_intents; existing subscriptions; billing_user uuid;
BEGIN
 -- Event receipt and entitlement changes commit together; failures remain retryable.
 INSERT INTO whop_processed_events(id) VALUES(p_event_id) ON CONFLICT DO NOTHING;
 IF NOT FOUND THEN RETURN; END IF;
 -- Both reservation and activation lock user -> intent -> subscription.
 -- Read the immutable owner without locking the intent so reservation cannot
 -- hold the user lock while activation holds the intent lock.
 SELECT user_id INTO STRICT billing_user FROM billing_checkout_intents WHERE id = p_intent_id;
 PERFORM pg_advisory_xact_lock(hashtextextended(billing_user::text, 0));
 SELECT * INTO STRICT intent FROM billing_checkout_intents WHERE id = p_intent_id FOR UPDATE;
 IF intent.user_id IS DISTINCT FROM billing_user THEN RAISE EXCEPTION 'Checkout owner changed'; END IF;
 IF intent.sandbox <> p_sandbox OR intent.provider_plan_id IS DISTINCT FROM p_plan_id
   OR intent.product_id IS DISTINCT FROM p_product_id OR intent.checkout_id IS NULL THEN
   RAISE EXCEPTION 'Checkout mismatch';
 END IF;
 IF intent.membership_id IS NOT NULL AND intent.membership_id <> p_membership_id THEN
   RAISE EXCEPTION 'Checkout already consumed';
 END IF;
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
