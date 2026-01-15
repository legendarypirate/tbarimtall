-- Add foreign key constraint for membership_type if it doesn't exist
-- This script safely adds the foreign key constraint without causing syntax errors

-- First, drop the constraint if it exists (in case it was created incorrectly)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'users_membership_type_fkey'
    ) THEN
        ALTER TABLE "users" DROP CONSTRAINT "users_membership_type_fkey";
    END IF;
END $$;

-- Add the foreign key constraint properly
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'users_membership_type_fkey'
    ) THEN
        ALTER TABLE "users" 
        ADD CONSTRAINT "users_membership_type_fkey" 
        FOREIGN KEY ("membership_type") 
        REFERENCES "memberships" ("id") 
        ON DELETE SET NULL 
        ON UPDATE CASCADE;
    END IF;
END $$;

