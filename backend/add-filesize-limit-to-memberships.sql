-- Add fileSizeLimit and fileSizeLimitUnit columns to memberships table
-- Run this migration to add file size limit fields to the memberships table
-- PostgreSQL compatible

-- Create ENUM type if it doesn't exist
DO $$ BEGIN
    CREATE TYPE file_size_unit AS ENUM ('MB', 'GB', 'TB');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add columns
ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS "fileSizeLimit" DECIMAL(10, 2) NULL;

ALTER TABLE memberships 
ADD COLUMN IF NOT EXISTS "fileSizeLimitUnit" file_size_unit NULL DEFAULT 'MB';

-- Add comments to the columns
COMMENT ON COLUMN memberships."fileSizeLimit" IS 'Maximum file size limit for one-time upload (e.g., 60 for 60MB)';
COMMENT ON COLUMN memberships."fileSizeLimitUnit" IS 'Unit for file size limit (MB, GB, or TB)';

