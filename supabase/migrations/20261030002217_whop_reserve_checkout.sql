-- Share the activation lock: checking the current subscription and reserving a
-- pending purchase must be atomic with membership activation for this user.
CREATE FUNCTION public.reserve_whop_checkout(
  p_id uuid, p_user_id uuid, p_plan text, p_cycle text, p_seats integer,
  p_amount numeric, p_product_id text, p_sandbox boolean
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE intent billing_checkout_intents;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::text, 0));
  IF EXISTS (SELECT 1 FROM subscriptions WHERE user_id = p_user_id AND status IN ('active','trialing','past_due')) THEN
    RAISE EXCEPTION 'Existing subscription requires reconciliation';
  END IF;
  SELECT * INTO intent FROM billing_checkout_intents
    WHERE user_id = p_user_id AND sandbox = p_sandbox AND membership_id IS NULL FOR UPDATE;
  IF FOUND THEN
    IF intent.plan <> p_plan OR intent.cycle <> p_cycle OR intent.seats <> p_seats OR intent.amount <> p_amount OR intent.product_id <> p_product_id THEN
      RAISE EXCEPTION 'Pending checkout selection differs';
    END IF;
  ELSE
    INSERT INTO billing_checkout_intents(id,user_id,plan,cycle,seats,amount,product_id,sandbox)
      VALUES(p_id,p_user_id,p_plan,p_cycle,p_seats,p_amount,p_product_id,p_sandbox) RETURNING * INTO intent;
  END IF;
  RETURN jsonb_build_object('id',intent.id,'checkout_id',intent.checkout_id);
END $$;
REVOKE ALL ON FUNCTION public.reserve_whop_checkout(uuid,uuid,text,text,integer,numeric,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_whop_checkout(uuid,uuid,text,text,integer,numeric,text,boolean) TO service_role;
