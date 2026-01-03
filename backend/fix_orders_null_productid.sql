-- Pure SQL script to fix NULL productId values in orders table
-- Run this script in your PostgreSQL database

-- ============================================
-- STEP 1: Check current state
-- ============================================
SELECT 
  'Current orders status:' as info,
  COUNT(*) as total_orders,
  COUNT("productId") as orders_with_product,
  COUNT(*) - COUNT("productId") as orders_with_null_product
FROM orders;

-- ============================================
-- STEP 2: View orders with NULL productId (optional - for inspection)
-- ============================================
-- Uncomment to see which orders have NULL productId:
-- SELECT 
--   id, 
--   "userId", 
--   amount, 
--   "paymentMethod", 
--   status, 
--   "createdAt"
-- FROM orders 
-- WHERE "productId" IS NULL
-- ORDER BY "createdAt" DESC;

-- ============================================
-- STEP 3: Drop foreign key constraints
-- ============================================
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS "orders_productId_fkey";

ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS "orders_productId_fkey1";

-- ============================================
-- STEP 4: Fix NULL values by assigning first available product ID
-- ============================================
-- This assigns the first product ID to all NULL productId orders
UPDATE orders 
SET "productId" = (
  SELECT id 
  FROM products 
  ORDER BY id ASC 
  LIMIT 1
)
WHERE "productId" IS NULL
AND EXISTS (SELECT 1 FROM products LIMIT 1);

-- ============================================
-- STEP 5: Delete any remaining NULL orders (if no products exist)
-- ============================================
-- This deletes orders that still have NULL productId (only if no products exist)
DELETE FROM orders 
WHERE "productId" IS NULL;

-- ============================================
-- STEP 6: Verify no NULL values remain
-- ============================================
SELECT 
  'After fix - orders status:' as info,
  COUNT(*) as total_orders,
  COUNT("productId") as orders_with_product,
  COUNT(*) - COUNT("productId") as orders_with_null_product
FROM orders;

-- ============================================
-- STEP 7: Set NOT NULL constraint
-- ============================================
ALTER TABLE orders 
ALTER COLUMN "productId" SET NOT NULL;

-- ============================================
-- STEP 8: Re-add foreign key constraint
-- ============================================
ALTER TABLE orders 
ADD CONSTRAINT "orders_productId_fkey" 
FOREIGN KEY ("productId") 
REFERENCES products(id) 
ON DELETE NO ACTION 
ON UPDATE CASCADE;

-- ============================================
-- STEP 9: Final verification
-- ============================================
SELECT 
  'Final verification:' as info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'productId';

SELECT '✅ Fix completed successfully!' as status;

