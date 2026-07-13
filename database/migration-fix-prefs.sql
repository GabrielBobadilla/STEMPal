-- Migration: Fix study_duration type from INTEGER to TEXT
-- The frontend sends string values like '30min', '1hour', '2hours', '3plus'
ALTER TABLE preferences ALTER COLUMN study_duration TYPE TEXT USING study_duration::TEXT;
