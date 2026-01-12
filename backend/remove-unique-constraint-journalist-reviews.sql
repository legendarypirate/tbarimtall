-- Remove unique constraint to allow multiple reviews from same user to same journalist
-- This will safely drop the constraint if it exists, or do nothing if it doesn't exist

-- Method 1: Try dropping by the expected name
ALTER TABLE journalist_reviews 
DROP CONSTRAINT IF EXISTS unique_journalist_user_review;

-- Method 2: Find and drop any unique constraint on (journalistId, userId) columns
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find all unique constraints on journalist_reviews that involve journalistId and userId
    FOR constraint_record IN
        SELECT con.conname
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
        WHERE nsp.nspname = 'public'
          AND rel.relname = 'journalist_reviews'
          AND con.contype = 'u'
          AND array_length(con.conkey, 1) = 2
          AND EXISTS (
              SELECT 1 FROM unnest(con.conkey) AS col1
              WHERE col1 = (
                  SELECT attnum FROM pg_attribute 
                  WHERE attrelid = con.conrelid AND attname = 'journalistId'
              )
          )
          AND EXISTS (
              SELECT 1 FROM unnest(con.conkey) AS col2
              WHERE col2 = (
                  SELECT attnum FROM pg_attribute 
                  WHERE attrelid = con.conrelid AND attname = 'userId'
              )
          )
    LOOP
        EXECUTE format('ALTER TABLE journalist_reviews DROP CONSTRAINT %I', constraint_record.conname);
        RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- Note: The non-unique indexes for performance are kept
-- They remain as:
-- CREATE INDEX IF NOT EXISTS idx_journalist_reviews_journalist ON journalist_reviews("journalistId");
-- CREATE INDEX IF NOT EXISTS idx_journalist_reviews_user ON journalist_reviews("userId");

