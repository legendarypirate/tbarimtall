-- Add termsAccepted column to users table
-- This column tracks whether a user has accepted the terms and conditions

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "termsAccepted" BOOLEAN DEFAULT false;

-- Update comment for the column
COMMENT ON COLUMN users."termsAccepted" IS 'Whether user has accepted the terms and conditions';

