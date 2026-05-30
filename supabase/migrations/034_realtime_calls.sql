-- Migration 034: Enable Supabase Realtime for the calls table
-- so the browser can subscribe to inbound call events
-- (INSERT direction='inbound', status='ringing' → show popup).
--
-- Run in Supabase SQL Editor (Farhan runs this manually).
-- Safe to re-run: wrapped in DO block to avoid "already member" error.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'calls'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
  END IF;
END $$;

-- Ensure full row data is sent on UPDATE so the popup can read
-- updated status values (missed, completed, rejected).
-- Migration 009 may already have set this — safe to re-run.
ALTER TABLE public.calls REPLICA IDENTITY FULL;
