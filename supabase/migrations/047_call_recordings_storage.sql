-- call-recordings bucket + RLS (bucket may already exist in dashboard — safe to re-run)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'call-recordings',
  'call-recordings',
  false,
  52428800,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Users can read their own mirrored recordings ({user_id}/{call_id}.mp3)
DROP POLICY IF EXISTS "call_recordings_storage_select" ON storage.objects;
CREATE POLICY "call_recordings_storage_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'call-recordings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Uploads are performed by the service role in webhooks/cron (bypasses RLS).
-- Optional: allow authenticated users to upload to their own folder for manual tools.
DROP POLICY IF EXISTS "call_recordings_storage_insert" ON storage.objects;
CREATE POLICY "call_recordings_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'call-recordings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "call_recordings_storage_delete" ON storage.objects;
CREATE POLICY "call_recordings_storage_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'call-recordings'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE INDEX IF NOT EXISTS idx_calls_recording_supabase_path
  ON calls (recording_supabase_path)
  WHERE recording_supabase_path IS NOT NULL;
