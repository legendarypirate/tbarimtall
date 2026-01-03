-- Fix products.id column type from UUID to INTEGER
-- This script converts products.id from UUID to INTEGER
-- Run this script if you get: "Key columns are of incompatible types: integer and uuid"

-- Step 1: Drop all foreign key constraints that reference products.id
-- This finds and drops ALL foreign key constraints pointing to products table

-- Drop constraints from orders
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname, conrelid::regclass::text as table_name
        FROM pg_constraint
        WHERE confrelid = 'products'::regclass
        AND contype = 'f'
    LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT IF EXISTS %I', r.table_name, r.conname);
        RAISE NOTICE 'Dropped foreign key constraint: % from table %', r.conname, r.table_name;
    END LOOP;
END $$;

-- Step 2: Drop primary key constraint on products.id
DO $$
DECLARE
    pk_constraint TEXT;
BEGIN
    SELECT conname INTO pk_constraint
    FROM pg_constraint
    WHERE conrelid = 'products'::regclass
    AND contype = 'p';
    
    IF pk_constraint IS NOT NULL THEN
        EXECUTE format('ALTER TABLE products DROP CONSTRAINT %I', pk_constraint);
        RAISE NOTICE 'Dropped primary key: %', pk_constraint;
    END IF;
END $$;

-- Step 3: Check if uuid column exists, if not rename id to uuid
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'uuid'
    ) THEN
        -- Rename id column to uuid
        ALTER TABLE products RENAME COLUMN id TO uuid;
        RAISE NOTICE 'Renamed id column to uuid';
    ELSE
        RAISE NOTICE 'uuid column already exists';
    END IF;
END $$;

-- Step 4: Add new INTEGER id column (SERIAL = auto-incrementing integer)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'id'
    ) THEN
        ALTER TABLE products ADD COLUMN id SERIAL;
        RAISE NOTICE 'Added new INTEGER id column';
    ELSE
        -- If id exists but is not integer, we need to handle it
        RAISE NOTICE 'id column exists, checking type...';
    END IF;
END $$;

-- Step 5: If id column exists but is UUID, we need to handle it differently
DO $$
DECLARE
    id_type TEXT;
BEGIN
    SELECT data_type INTO id_type
    FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'id';
    
    IF id_type = 'uuid' THEN
        -- id is still UUID, we need to drop it and recreate as integer
        RAISE NOTICE 'id column is still UUID, recreating as INTEGER...';
        ALTER TABLE products DROP COLUMN id;
        ALTER TABLE products ADD COLUMN id SERIAL;
        RAISE NOTICE 'Recreated id as INTEGER';
    ELSIF id_type = 'integer' THEN
        RAISE NOTICE 'id column is already INTEGER';
    END IF;
END $$;

-- Step 6: Populate integer id with sequential values based on creation order
UPDATE products 
SET id = subquery.row_num
FROM (
    SELECT 
        uuid,
        ROW_NUMBER() OVER (ORDER BY "createdAt", uuid) as row_num
    FROM products
) AS subquery
WHERE products.uuid = subquery.uuid;

-- Step 7: Update orders.productId from UUID to INTEGER
UPDATE orders o
SET "productId" = p.id
FROM products p
WHERE o."productId"::text = p.uuid::text;

-- Step 8: Update reviews.productId from UUID to INTEGER
UPDATE reviews r
SET "productId" = p.id
FROM products p
WHERE r."productId"::text = p.uuid::text;

-- Step 9: Update download_tokens.productId from UUID to INTEGER (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'download_tokens') THEN
        UPDATE download_tokens dt
        SET "productId" = p.id
        FROM products p
        WHERE dt."productId"::text = p.uuid::text;
        RAISE NOTICE 'Updated download_tokens.productId';
    END IF;
END $$;

-- Step 10: Set id as PRIMARY KEY and NOT NULL
ALTER TABLE products 
    ALTER COLUMN id SET NOT NULL;

ALTER TABLE products 
    ADD PRIMARY KEY (id);

-- Step 11: Ensure uuid column has unique constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'products'::regclass
        AND conname = 'products_uuid_unique'
    ) THEN
        ALTER TABLE products 
            ADD CONSTRAINT products_uuid_unique UNIQUE (uuid);
        RAISE NOTICE 'Added unique constraint on uuid';
    END IF;
END $$;

-- Step 12: Re-add foreign key constraints

-- Re-add foreign key for orders
ALTER TABLE orders 
    ADD CONSTRAINT "orders_productId_fkey" 
    FOREIGN KEY ("productId") 
    REFERENCES products(id) 
    ON DELETE NO ACTION 
    ON UPDATE CASCADE;

-- Re-add foreign key for reviews
ALTER TABLE reviews 
    ADD CONSTRAINT "reviews_productId_fkey" 
    FOREIGN KEY ("productId") 
    REFERENCES products(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Re-add foreign key for download_tokens (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'download_tokens') THEN
        ALTER TABLE download_tokens 
            ADD CONSTRAINT "download_tokens_productId_fkey" 
            FOREIGN KEY ("productId") 
            REFERENCES products(id) 
            ON DELETE NO ACTION 
            ON UPDATE CASCADE;
        RAISE NOTICE 'Re-added foreign key for download_tokens';
    END IF;
END $$;

-- Step 13: Verify the change
DO $$
DECLARE
    id_type TEXT;
    uuid_exists BOOLEAN;
BEGIN
    SELECT data_type INTO id_type
    FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'id';
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'products' AND column_name = 'uuid'
    ) INTO uuid_exists;
    
    RAISE NOTICE 'Verification:';
    RAISE NOTICE '  products.id type: %', id_type;
    RAISE NOTICE '  products.uuid exists: %', uuid_exists;
    
    IF id_type = 'integer' THEN
        RAISE NOTICE '✅ Migration completed successfully!';
    ELSE
        RAISE WARNING '⚠️  Warning: products.id type is %, expected integer', id_type;
    END IF;
END $$;
