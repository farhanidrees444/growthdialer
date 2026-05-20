-- Voicemail recordings table
CREATE TABLE IF NOT EXISTS voicemails (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  audio_url        TEXT        NOT NULL,
  duration_seconds INT         NOT NULL,
  file_size_bytes  BIGINT      NOT NULL,
  is_default       BOOLEAN     NOT NULL DEFAULT false,
  drop_count       INT         NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voicemails_user ON voicemails(user_id);
CREATE INDEX IF NOT EXISTS idx_voicemails_user_default ON voicemails(user_id, is_default);

ALTER TABLE voicemails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voicemails_user_all"
  ON voicemails FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Storage bucket for voicemail audio files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'voicemail-recordings',
  'voicemail-recordings',
  false,
  5242880,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/x-m4a']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: users can only access their own files (stored under {user_id}/ prefix)
CREATE POLICY "voicemail_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'voicemail-recordings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "voicemail_storage_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'voicemail-recordings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "voicemail_storage_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'voicemail-recordings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- AMD auto-drop setting on user_settings
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS auto_drop_vm BOOLEAN NOT NULL DEFAULT false;

-- Local presence setting
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS local_presence_enabled BOOLEAN NOT NULL DEFAULT false;
