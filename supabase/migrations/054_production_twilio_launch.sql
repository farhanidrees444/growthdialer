-- Production launch: assign master Twilio DID, wipe demo data for all other users.
-- Uses only columns guaranteed on base purchased_numbers schema.

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

  IF to_regclass('public.workspace_members') IS NOT NULL THEN
    SELECT workspace_id INTO master_ws
    FROM public.workspace_members
    WHERE user_id = master_id AND status = 'active'
    ORDER BY joined_at ASC NULLS LAST
    LIMIT 1;
  END IF;

  IF to_regclass('public.coaching_metrics') IS NOT NULL THEN
    DELETE FROM public.coaching_metrics WHERE agent_id IS DISTINCT FROM master_id;
  END IF;

  IF to_regclass('public.coaching_sessions') IS NOT NULL THEN
    DELETE FROM public.coaching_sessions
    WHERE agent_id IS DISTINCT FROM master_id OR coach_id IS DISTINCT FROM master_id;
  END IF;

  IF to_regclass('public.parallel_dial_legs') IS NOT NULL THEN
    DELETE FROM public.parallel_dial_legs
    WHERE session_id IN (
      SELECT id FROM public.parallel_dial_sessions WHERE user_id IS DISTINCT FROM master_id
    );
  END IF;

  IF to_regclass('public.parallel_dial_sessions') IS NOT NULL THEN
    DELETE FROM public.parallel_dial_sessions WHERE user_id IS DISTINCT FROM master_id;
  END IF;

  IF to_regclass('public.notifications') IS NOT NULL THEN
    DELETE FROM public.notifications WHERE user_id IS DISTINCT FROM master_id;
  END IF;

  IF to_regclass('public.activities') IS NOT NULL THEN
    DELETE FROM public.activities WHERE user_id IS DISTINCT FROM master_id;
  END IF;

  IF to_regclass('public.voicemails') IS NOT NULL THEN
    DELETE FROM public.voicemails WHERE user_id IS DISTINCT FROM master_id;
  END IF;

  IF to_regclass('public.calls') IS NOT NULL THEN
    DELETE FROM public.calls WHERE user_id IS DISTINCT FROM master_id;
  END IF;

  IF to_regclass('public.leads') IS NOT NULL THEN
    DELETE FROM public.leads WHERE user_id IS DISTINCT FROM master_id;
  END IF;

  IF to_regclass('public.phone_number_settings') IS NOT NULL THEN
    DELETE FROM public.phone_number_settings WHERE user_id IS DISTINCT FROM master_id;
  END IF;

  IF to_regclass('public.purchased_numbers') IS NOT NULL THEN
    DELETE FROM public.purchased_numbers WHERE user_id IS DISTINCT FROM master_id;

    IF to_regclass('public.phone_number_settings') IS NOT NULL THEN
      DELETE FROM public.phone_number_settings
      WHERE purchased_number_id IN (
        SELECT id FROM public.purchased_numbers
        WHERE user_id = master_id AND phone_number IS DISTINCT FROM master_number
      );
    END IF;

    DELETE FROM public.purchased_numbers
    WHERE user_id = master_id AND phone_number IS DISTINCT FROM master_number;

    INSERT INTO public.purchased_numbers (
      user_id,
      phone_number,
      status,
      is_default,
      country,
      purchased_at
    )
    VALUES (
      master_id,
      master_number,
      'active',
      true,
      'US',
      now()
    )
    ON CONFLICT (phone_number) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      status = 'active',
      is_default = true,
      country = EXCLUDED.country;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'purchased_numbers' AND column_name = 'workspace_id'
    ) THEN
      UPDATE public.purchased_numbers
      SET workspace_id = COALESCE(workspace_id, master_ws)
      WHERE user_id = master_id AND phone_number = master_number;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'purchased_numbers' AND column_name = 'telnyx_number_id'
    ) THEN
      UPDATE public.purchased_numbers
      SET telnyx_number_id = NULL, telnyx_order_id = NULL
      WHERE user_id = master_id;
    END IF;

    UPDATE public.purchased_numbers
    SET is_default = false
    WHERE user_id = master_id AND phone_number IS DISTINCT FROM master_number;

    UPDATE public.purchased_numbers
    SET is_default = true, status = 'active'
    WHERE user_id = master_id AND phone_number = master_number;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_settings' AND column_name = 'telnyx_telephony_credential_id'
  ) THEN
    UPDATE public.user_settings
    SET telnyx_telephony_credential_id = NULL
    WHERE telnyx_telephony_credential_id IS NOT NULL;
  END IF;

  IF to_regclass('public.call_events') IS NOT NULL THEN
    TRUNCATE public.call_events;
  END IF;

  RAISE NOTICE 'Twilio launch migration complete for master %', master_id;
END $$;
