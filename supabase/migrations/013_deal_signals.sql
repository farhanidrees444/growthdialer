-- Deal value signals extracted by AI from call transcripts
ALTER TABLE calls
  ADD COLUMN IF NOT EXISTS deal_value_usd NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS deal_indicator TEXT;

-- deal_indicator examples: 'mentioned_budget', 'requested_quote', 'discussed_deal_size'
-- deal_value_usd: AI-extracted dollar amount from the call, NULL if not mentioned

COMMENT ON COLUMN calls.deal_value_usd IS 'AI-extracted deal value in USD from call transcript. NULL if no deal discussed.';
COMMENT ON COLUMN calls.deal_indicator IS 'Reason the AI assigned a deal value (e.g. mentioned_budget, requested_quote).';

CREATE INDEX IF NOT EXISTS idx_calls_deal_value ON calls(user_id, deal_value_usd)
  WHERE deal_value_usd IS NOT NULL;
