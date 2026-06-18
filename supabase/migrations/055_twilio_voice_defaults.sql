-- Ensure master account voice defaults for browser inbound + recording.
DO $$
DECLARE
  master_id UUID;
BEGIN
  SELECT id INTO master_id
  FROM auth.users
  WHERE lower(email) = lower('farhanidrees.digital@gmail.com')
  LIMIT 1;

  IF master_id IS NULL THEN
    RAISE NOTICE 'Master user not found — skipping voice defaults';
    RETURN;
  END IF;

  IF to_regclass('public.user_settings') IS NOT NULL THEN
    INSERT INTO public.user_settings (user_id, inbound_mode, inbound_ring_seconds, recording_mode)
    VALUES (master_id, 'browser', 35, 'always')
    ON CONFLICT (user_id) DO UPDATE SET
      inbound_mode = COALESCE(public.user_settings.inbound_mode, EXCLUDED.inbound_mode),
      inbound_ring_seconds = COALESCE(public.user_settings.inbound_ring_seconds, EXCLUDED.inbound_ring_seconds),
      recording_mode = COALESCE(public.user_settings.recording_mode, EXCLUDED.recording_mode);
  END IF;
END $$;
