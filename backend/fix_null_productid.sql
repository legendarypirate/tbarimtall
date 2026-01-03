-- Fix NULL productId values in orders table
-- This script handles NULL values by either assigning a valid productId or deleting invalid orders

-- Step 1: Check current state
SELECT 
  COUNT(*) as total_orders,
  COUNT("productId") as orders_with_product,
  COUNT(*) - COUNT("productId") as orders_with_null_product
FROM orders;

-- Step 2: View orders with NULL productId (for inspection)
SELECT 
  id, 
  "userId", 
  amount, 
  "paymentMethod", 
  status, 
  "createdAt"
FROM orders 
WHERE "productId" IS NULL
ORDER BY "createdAt" DESC;

-- Step 3: Option A - Assign a default productId to NULL orders (if you have a default product)
-- First, check if there are any products available
-- SELECT id FROM products LIMIT 1;

-- If you want to assign a default productId (replace <DEFAULT_PRODUCT_ID> with an actual product ID):
-- UPDATE orders 
-- SET "productId" = <DEFAULT_PRODUCT_ID>
-- WHERE "productId" IS NULL;

-- Step 3: Option B - Delete orders with NULL productId (if they are invalid)
-- This is safer if NULL productId orders are invalid
DELETE FROM orders 
WHERE "productId" IS NULL;

-- Step 4: Verify no NULL values remain
SELECT 
  COUNT(*) as total_orders,
  COUNT("productId") as orders_with_product,
  COUNT(*) - COUNT("productId") as orders_with_null_product
FROM orders;

-- Step 5: Now set the column to NOT NULL (if no NULL values exist)
-- First, drop the foreign key constraint temporarily
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS "orders_productId_fkey";

ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS "orders_productId_fkey1";

-- Set NOT NULL constraint
ALTER TABLE orders 
ALTER COLUMN "productId" SET NOT NULL;

-- Re-add foreign key constraint
ALTER TABLE orders 
ADD CONSTRAINT "orders_productId_fkey" 
FOREIGN KEY ("productId") 
REFERENCES products(id) 
ON DELETE NO ACTION 
ON UPDATE CASCADE;

-- Step 6: Verify the fix
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'productId';

