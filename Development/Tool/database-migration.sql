-- Execute this script in the Supabase SQL Editor
-- This adds the contact fields for CC-006: Save Recommendations

ALTER TABLE diagnostic_sessions
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS abn TEXT,
ADD COLUMN IF NOT EXISTS business_structure TEXT,
ADD COLUMN IF NOT EXISTS annual_turnover_range TEXT,
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS recommendations_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS recommendations_summary JSONB,
ADD COLUMN IF NOT EXISTS recommendations_shared_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add constraints
ALTER TABLE diagnostic_sessions
ADD CONSTRAINT check_abn_format 
CHECK (abn IS NULL OR (abn ~ '^[0-9]{11}$'));

ALTER TABLE diagnostic_sessions
ADD CONSTRAINT check_business_structure 
CHECK (business_structure IS NULL OR business_structure IN 
  ('sole_trader', 'partnership', 'company', 'trust', 'cooperative', 'nfp'));

ALTER TABLE diagnostic_sessions
ADD CONSTRAINT check_annual_turnover_range 
CHECK (annual_turnover_range IS NULL OR annual_turnover_range IN 
  ('under_250k', '250k_500k', '500k_1m', '1m_5m', '5m_10m', '10m_50m', 'over_50m'));
