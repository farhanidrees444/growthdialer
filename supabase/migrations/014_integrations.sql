-- Integration credentials (OAuth tokens, stored encrypted in prod)
CREATE TABLE IF NOT EXISTS integration_credentials (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      TEXT        NOT NULL,
  access_token  TEXT        NOT NULL,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ,
  metadata      JSONB,
  is_active     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

ALTER TABLE integration_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_creds_user_all"
  ON integration_credentials FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Integration waitlist (users requesting upcoming integrations)
CREATE TABLE IF NOT EXISTS integration_waitlist (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  email      TEXT        NOT NULL,
  provider   TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(email, provider)
);

ALTER TABLE integration_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integration_waitlist_insert"
  ON integration_waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "integration_waitlist_select"
  ON integration_waitlist FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NOT NULL);
