-- Comprehensive SQL script to fix all NULL values and type mismatches
-- Run this script to fix orders.productId, reviews.productId, and related issues

-- ============================================
-- PART 1: Fix orders.productId NULL values
-- ============================================

-- Check current state
SELECT '=== ORDERS TABLE STATUS ===' as status;
SELECT 
  COUNT(*) as total_orders,
  COUNT("productId") as orders_with_product,
  COUNT(*) - COUNT("productId") as orders_with_null_product
FROM orders;

-- Drop foreign key constraints
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS "orders_productId_fkey";

ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS "orders_productId_fkey1";

-- Assign default productId to NULL orders (using first available product)
UPDATE orders 
SET "productId" = (
  SELECT id 
  FROM products 
  ORDER BY id ASC 
  LIMIT 1
)
WHERE "productId" IS NULL
AND EXISTS (SELECT 1 FROM products LIMIT 1);

-- If still NULL (no products exist), delete those orders
DELETE FROM orders 
WHERE "productId" IS NULL;

-- Set NOT NULL
ALTER TABLE orders 
ALTER COLUMN "productId" SET NOT NULL;

-- Re-add foreign key constraint
ALTER TABLE orders 
ADD CONSTRAINT "orders_productId_fkey" 
FOREIGN KEY ("productId") 
REFERENCES products(id) 
ON DELETE NO ACTION 
ON UPDATE CASCADE;

SELECT '✅ orders.productId fixed!' as status;

-- ============================================
-- PART 2: Fix reviews.productId type and NULL values
-- ============================================

SELECT '=== REVIEWS TABLE STATUS ===' as status;

-- Check current type
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'reviews' 
AND column_name = 'productId';

-- Drop foreign key constraints
ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS "reviews_productId_fkey";

ALTER TABLE reviews 
DROP CONSTRAINT IF EXISTS "reviews_productId_fkey1";

-- Check if productId is UUID type and needs conversion
DO $$
DECLARE
  current_type text;
BEGIN
  SELECT data_type INTO current_type
  FROM information_schema.columns 
  WHERE table_name = 'reviews' 
  AND column_name = 'productId';
  
  IF current_type = 'uuid' THEN
    -- Convert UUID productId to INTEGER
    -- Step 1: Add temporary column
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS "productId_new" INTEGER;
    
    -- Step 2: Map UUID to INTEGER using products table
    UPDATE reviews r
    SET "productId_new" = p.id
    FROM products p
    WHERE r."productId"::text = p.uuid::text;
    
    -- Step 3: Set NULL for unmapped reviews
    UPDATE reviews 
    SET "productId_new" = NULL
    WHERE "productId_new" IS NULL 
    AND "productId" IS NOT NULL;
    
    -- Step 4: Replace column
    ALTER TABLE reviews DROP COLUMN "productId";
    ALTER TABLE reviews RENAME COLUMN "productId_new" TO "productId";
    
    RAISE NOTICE 'Converted reviews.productId from UUID to INTEGER';
  END IF;
END $$;

-- Fix NULL values in reviews.productId
UPDATE reviews 
SET "productId" = (
  SELECT id 
  FROM products 
  ORDER BY id ASC 
  LIMIT 1
)
WHERE "productId" IS NULL
AND EXISTS (SELECT 1 FROM products LIMIT 1);

-- Delete reviews with NULL productId if no products exist
DELETE FROM reviews 
WHERE "productId" IS NULL;

-- Set NOT NULL
ALTER TABLE reviews 
ALTER COLUMN "productId" SET NOT NULL;

-- Re-add foreign key constraint
ALTER TABLE reviews 
ADD CONSTRAINT "reviews_productId_fkey" 
FOREIGN KEY ("productId") 
REFERENCES products(id) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

SELECT '✅ reviews.productId fixed!' as status;

-- ============================================
-- PART 3: Verify all fixes
-- ============================================

SELECT '=== VERIFICATION ===' as status;

-- Check orders
SELECT 
  'orders' as table_name,
  column_name,
  data_type,
  is_nullable,
  (SELECT COUNT(*) FROM orders WHERE "productId" IS NULL) as null_count
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'productId';

-- Check reviews
SELECT 
  'reviews' as table_name,
  column_name,
  data_type,
  is_nullable,
  (SELECT COUNT(*) FROM reviews WHERE "productId" IS NULL) as null_count
FROM information_schema.columns 
WHERE table_name = 'reviews' 
AND column_name = 'productId';

SELECT '✅ All fixes completed!' as status;

