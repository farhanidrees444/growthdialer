-- Production launch: assign master Twilio DID, wipe demo data for all other users.

DO $$
DECLARE
  master_id UUID;
  master_ws UUID;
  master_number TEXT := '+16624814068';
BEGIN
  SELECT id INTO master_id
  FROM auth.users
  WHERE lower(email) = lower('farhanidrees.digital@gmail.com')
  LIMIT 1;

  IF master_id IS NULL THEN
    RAISE NOTICE 'Master user farhanidrees.digital@gmail.com not found — skipping data migration';
    RETURN;
  END IF;

  SELECT workspace_id INTO master_ws
  FROM public.workspace_members
  WHERE user_id = master_id AND status = 'active'
  ORDER BY joined_at ASC NULLS LAST
  LIMIT 1;

  -- Coaching
  DELETE FROM public.coaching_metrics WHERE agent_id IS DISTINCT FROM master_id;
  DELETE FROM public.coaching_sessions
  WHERE agent_id IS DISTINCT FROM master_id OR coach_id IS DISTINCT FROM master_id;

  -- Parallel dial
  DELETE FROM public.parallel_dial_legs
  WHERE session_id IN (
    SELECT id FROM public.parallel_dial_sessions WHERE user_id IS DISTINCT FROM master_id
  );

  DELETE FROM public.parallel_dial_sessions WHERE user_id IS DISTINCT FROM master_id;

  -- Operational data for non-master accounts
  DELETE FROM public.notifications WHERE user_id IS DISTINCT FROM master_id;

  IF to_regclass('public.activities') IS NOT NULL THEN
    DELETE FROM public.activities WHERE user_id IS DISTINCT FROM master_id;
  END IF;

  DELETE FROM public.voicemails WHERE user_id IS DISTINCT FROM master_id;
  DELETE FROM public.calls WHERE user_id IS DISTINCT FROM master_id;
  DELETE FROM public.leads WHERE user_id IS DISTINCT FROM master_id;

  -- Number settings then numbers (non-master)
  DELETE FROM public.phone_number_settings
  WHERE user_id IS DISTINCT FROM master_id;

  DELETE FROM public.purchased_numbers WHERE user_id IS DISTINCT FROM master_id;

  -- Master: drop legacy Telnyx-purchased numbers, keep only production Twilio DID
  DELETE FROM public.phone_number_settings
  WHERE purchased_number_id IN (
    SELECT id FROM public.purchased_numbers
    WHERE user_id = master_id AND phone_number IS DISTINCT FROM master_number
  );

  DELETE FROM public.purchased_numbers
  WHERE user_id = master_id AND phone_number IS DISTINCT FROM master_number;

  -- Upsert master Twilio number
  INSERT INTO public.purchased_numbers (
    user_id,
    workspace_id,
    phone_number,
    status,
    is_default,
    country,
    country_name,
    number_type,
    telnyx_number_id,
    telnyx_order_id,
    purchased_at
  )
  VALUES (
    master_id,
    master_ws,
    master_number,
    'active',
    true,
    'US',
    'United States',
    'local',
    NULL,
    NULL,
    now()
  )
  ON CONFLICT (phone_number) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    workspace_id = COALESCE(public.purchased_numbers.workspace_id, EXCLUDED.workspace_id),
    status = 'active',
    is_default = true,
    telnyx_number_id = NULL,
    telnyx_order_id = NULL;

  -- If row exists under another format, normalize in place
  UPDATE public.purchased_numbers
  SET
    phone_number = master_number,
    user_id = master_id,
    workspace_id = COALESCE(workspace_id, master_ws),
    status = 'active',
    is_default = true,
    telnyx_number_id = NULL,
    telnyx_order_id = NULL
  WHERE user_id = master_id
    AND regexp_replace(phone_number, '[^0-9+]', '', 'g') IN (master_number, '+16624814068', '16624814068');

  UPDATE public.purchased_numbers
  SET is_default = false
  WHERE user_id = master_id AND phone_number IS DISTINCT FROM master_number;

  UPDATE public.purchased_numbers
  SET
    is_default = true,
    status = 'active',
    telnyx_number_id = NULL,
    telnyx_order_id = NULL,
    workspace_id = COALESCE(workspace_id, master_ws)
  WHERE user_id = master_id AND phone_number = master_number;

  -- Clear legacy Telnyx browser credentials for everyone
  UPDATE public.user_settings
  SET telnyx_telephony_credential_id = NULL
  WHERE telnyx_telephony_credential_id IS NOT NULL;

  -- Telemetry reset
  TRUNCATE public.call_events;

  RAISE NOTICE 'Twilio launch migration complete for master %', master_id;
END $$;
