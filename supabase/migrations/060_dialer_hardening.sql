-- 060_dialer_hardening.sql
-- Reconciles schema drift found in the dialer call path: columns the code
-- reads/writes but no earlier migration creates, plus single-user scoping for
-- sms_messages (workspace tenancy was removed; the table was still
-- workspace-keyed, which broke SMS send/read/webhook paths).
--
-- Additive only: IF NOT EXISTS guards everywhere. Safe to re-run.
-- Run AFTER all earlier migrations (001-059) in Supabase SQL Editor.

-- ── 1. leads.ai_score ──────────────────────────────────────────────────────
-- Written by the dialer "mark as hot" toggle, read by the lead detail page.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'leads') THEN
    ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS ai_score INTEGER;
  END IF;
END $$;

-- ── 2. call_analytics.sentiment_score ───────────────────────────────────────
-- Written by /api/ai/process-call when sentiment analysis is enabled.
-- (Migration 007 creates it as FLOAT when applied; this is a no-op then.)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'call_analytics') THEN
    ALTER TABLE public.call_analytics
      ADD COLUMN IF NOT EXISTS sentiment_score DOUBLE PRECISION;
  END IF;
END $$;

-- ── 3. purchased_numbers spam columns ──────────────────────────────────────
-- Read/written by /api/numbers/[id]/spam-check and /api/numbers/list
-- (number health / spam-risk monitoring).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'purchased_numbers') THEN
    ALTER TABLE public.purchased_numbers
      ADD COLUMN IF NOT EXISTS spam_score INTEGER,
      ADD COLUMN IF NOT EXISTS last_spam_check TIMESTAMPTZ;
  END IF;
END $$;

-- ── 4. sms_messages: single-user scoping ────────────────────────────────────
-- The send path inserted (workspace_id = user id, agent_id = <no such column>)
-- and the read path filtered by a non-existent user_id column. Scope by user_id.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'sms_messages') THEN
    ALTER TABLE public.sms_messages
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

    -- workspace_id is legacy in single-user mode; allow NULL going forward.
    ALTER TABLE public.sms_messages ALTER COLUMN workspace_id DROP NOT NULL;

    -- Backfill user_id from lead ownership …
    UPDATE public.sms_messages m
       SET user_id = l.user_id
      FROM public.leads l
     WHERE m.lead_id = l.id AND m.user_id IS NULL;

    -- … then from the owning number (outbound from_number / inbound to_number).
    UPDATE public.sms_messages m
       SET user_id = p.user_id
      FROM public.purchased_numbers p
     WHERE m.user_id IS NULL
       AND p.status = 'active'
       AND (p.phone_number = m.from_number OR p.phone_number = m.to_number);

    CREATE INDEX IF NOT EXISTS idx_sms_messages_user_id
      ON public.sms_messages(user_id);

    -- Replace workspace-based RLS with single-user RLS.
    DROP POLICY IF EXISTS sms_messages_workspace_select ON public.sms_messages;
    DROP POLICY IF EXISTS sms_messages_insert_workspace ON public.sms_messages;
    DROP POLICY IF EXISTS sms_messages_workspace_insert ON public.sms_messages;
    DROP POLICY IF EXISTS sms_messages_workspace_update ON public.sms_messages;
    DROP POLICY IF EXISTS sms_messages_workspace_delete ON public.sms_messages;

    DROP POLICY IF EXISTS sms_messages_user_select ON public.sms_messages;
    CREATE POLICY sms_messages_user_select ON public.sms_messages
      FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS sms_messages_user_insert ON public.sms_messages;
    CREATE POLICY sms_messages_user_insert ON public.sms_messages
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS sms_messages_user_update ON public.sms_messages;
    CREATE POLICY sms_messages_user_update ON public.sms_messages
      FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

    DROP POLICY IF EXISTS sms_messages_user_delete ON public.sms_messages;
    CREATE POLICY sms_messages_user_delete ON public.sms_messages
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- workspace_messaging_profiles: key by user in single-user mode (table was
-- workspace-keyed; the compliance API already reads/writes by user id).
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'workspace_messaging_profiles') THEN
    ALTER TABLE public.workspace_messaging_profiles
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_messaging_profiles_user_id_key') THEN
      ALTER TABLE public.workspace_messaging_profiles
        ADD CONSTRAINT workspace_messaging_profiles_user_id_key UNIQUE (user_id);
    END IF;
  END IF;
END $$;

-- sms_opt_outs: key by user in single-user mode. workspace_id kept (nullable)
-- for any legacy rows.
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'sms_opt_outs') THEN
    ALTER TABLE public.sms_opt_outs
      ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

    ALTER TABLE public.sms_opt_outs ALTER COLUMN workspace_id DROP NOT NULL;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'sms_opt_outs_user_phone_key') THEN
      ALTER TABLE public.sms_opt_outs
        ADD CONSTRAINT sms_opt_outs_user_phone_key UNIQUE (user_id, phone_e164);
    END IF;

    CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_user_phone
      ON public.sms_opt_outs(user_id, phone_e164);
  END IF;
END $$;
