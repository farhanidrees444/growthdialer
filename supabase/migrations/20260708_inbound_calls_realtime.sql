-- Enable Supabase Realtime for inbound_calls so agents get accept/decline overlay
-- when the server routes a PSTN call to them (independent of WebRTC SDK timing).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'inbound_calls'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.inbound_calls;
  END IF;
END $$;

ALTER TABLE public.inbound_calls REPLICA IDENTITY FULL;
