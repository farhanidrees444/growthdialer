-- Restrict integration waitlist reads to the submitting user only
DROP POLICY IF EXISTS "integration_waitlist_select" ON integration_waitlist;

CREATE POLICY "integration_waitlist_select"
  ON integration_waitlist FOR SELECT
  USING (auth.uid() = user_id);

-- Tighten insert: must match authenticated user when user_id is set
DROP POLICY IF EXISTS "integration_waitlist_insert" ON integration_waitlist;

CREATE POLICY "integration_waitlist_insert"
  ON integration_waitlist FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
