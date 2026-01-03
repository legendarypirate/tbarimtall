-- Add phone column to users table
-- Run this migration to add the phone field to the users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone VARCHAR(50) NULL;

-- Add comment to the column
COMMENT ON COLUMN users.phone IS 'User phone number';

