-- SMS / 10DLC workspace profiles, opt-outs, and message metadata.

CREATE TABLE IF NOT EXISTS public.workspace_messaging_profiles (
  workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  legal_business_name TEXT,
  ein_or_tax_id TEXT,
  brand_id TEXT,
  brand_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (brand_status IN ('draft', 'submitted', 'approved', 'rejected', 'suspended')),
  campaign_id TEXT,
  campaign_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (campaign_status IN ('draft', 'pending_carrier', 'active', 'expired', 'rejected')),
  use_case TEXT NOT NULL DEFAULT 'sales_outbound'
    CHECK (use_case IN ('sales_outbound', 'customer_care', 'mixed')),
  sample_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  opt_in_description TEXT,
  opt_out_keywords TEXT[] NOT NULL DEFAULT ARRAY['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT'],
  daily_volume_cap INTEGER,
  messaging_profile_id TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sms_opt_outs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  phone_e164 TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'keyword'
    CHECK (source IN ('keyword', 'manual', 'import', 'api')),
  opted_out_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, phone_e164)
);

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS sms_opt_out BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.sms_messages
  ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sms_opt_outs_workspace_phone
  ON public.sms_opt_outs(workspace_id, phone_e164);

CREATE INDEX IF NOT EXISTS idx_sms_messages_agent_created
  ON public.sms_messages(agent_id, created_at DESC)
  WHERE agent_id IS NOT NULL;

ALTER TABLE public.workspace_messaging_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_opt_outs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_messaging_profiles_read ON public.workspace_messaging_profiles;
CREATE POLICY workspace_messaging_profiles_read ON public.workspace_messaging_profiles
  FOR SELECT USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.status = 'active'
    )
  );

DROP POLICY IF EXISTS workspace_messaging_profiles_manage ON public.workspace_messaging_profiles;
CREATE POLICY workspace_messaging_profiles_manage ON public.workspace_messaging_profiles
  FOR ALL USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin')
    )
  );

DROP POLICY IF EXISTS sms_opt_outs_read ON public.sms_opt_outs;
CREATE POLICY sms_opt_outs_read ON public.sms_opt_outs
  FOR SELECT USING (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid() AND wm.status = 'active'
    )
  );

DROP POLICY IF EXISTS sms_messages_insert_workspace ON public.sms_messages;
CREATE POLICY sms_messages_insert_workspace ON public.sms_messages
  FOR INSERT WITH CHECK (
    workspace_id IN (
      SELECT wm.workspace_id FROM public.workspace_members wm
      WHERE wm.user_id = auth.uid()
        AND wm.status = 'active'
        AND wm.role IN ('owner', 'admin', 'manager', 'agent')
    )
  );

DROP TRIGGER IF EXISTS workspace_messaging_profiles_updated_at ON public.workspace_messaging_profiles;
CREATE TRIGGER workspace_messaging_profiles_updated_at
  BEFORE UPDATE ON public.workspace_messaging_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
