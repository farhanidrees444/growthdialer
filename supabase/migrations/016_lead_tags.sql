-- Lead tags system: user-defined colored tags assignable to many leads

CREATE TABLE IF NOT EXISTS public.lead_tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_tags_user_name
  ON public.lead_tags (user_id, name);

CREATE INDEX IF NOT EXISTS idx_lead_tags_user_id
  ON public.lead_tags (user_id);

CREATE TABLE IF NOT EXISTS public.lead_tag_assignments (
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES public.lead_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (lead_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_lead
  ON public.lead_tag_assignments (lead_id);

CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_tag
  ON public.lead_tag_assignments (tag_id);

-- RLS
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tags"
  ON public.lead_tags FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own tag assignments"
  ON public.lead_tag_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id AND l.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.leads l
      WHERE l.id = lead_id AND l.user_id = auth.uid()
    )
  );
