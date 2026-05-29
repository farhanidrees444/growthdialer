-- Add recording_supabase_path if not already present
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_supabase_path TEXT;
