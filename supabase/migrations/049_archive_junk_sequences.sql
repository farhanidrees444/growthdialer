-- One-time cleanup: archive throwaway test sequence names (Step 14).
-- Safe to re-run; only touches non-archived rows.

UPDATE public.sequences
SET status = 'archived', updated_at = now()
WHERE status <> 'archived'
  AND (
    length(trim(name)) < 3
    OR lower(trim(name)) IN (
      'test', 'testing', 'test123', 'asdf', 'asdfasdf', 'qwerty', 'zxcv',
      'demo', 'untitled', 'sequence', 'new sequence', 'aaa', 'bbb', 'xxx',
      '123', '111', 'abc', 'temp', 'tmp', 'delete me', 'junk', 'foo', 'bar',
      'baz', 'sample', 'draft', 'cadence', 'new cadence'
    )
    OR lower(trim(name)) ~ '^(test|demo|asdf|xxx|tmp|temp|draft|sample)(\\s|\\d|$)'
    OR lower(trim(name)) ~ '^(asdf|qwerty|zxcv)'
    OR regexp_replace(lower(trim(name)), '\\s', '', 'g') ~ '^(.)\\1{2,}$'
    OR trim(name) ~ '^[0-9\\s\\-_.]+$'
  );
