-- Migration 006: Add metadata columns to purchased_numbers
-- Run this in Supabase SQL editor

ALTER TABLE purchased_numbers
  ADD COLUMN IF NOT EXISTS country_code   text,
  ADD COLUMN IF NOT EXISTS country_name   text,
  ADD COLUMN IF NOT EXISTS number_type    text,
  ADD COLUMN IF NOT EXISTS region         text,
  ADD COLUMN IF NOT EXISTS locality       text,
  ADD COLUMN IF NOT EXISTS telnyx_number_id text;

-- Backfill country_code from existing country column where missing
UPDATE purchased_numbers
SET country_code = country
WHERE country_code IS NULL AND country IS NOT NULL;
