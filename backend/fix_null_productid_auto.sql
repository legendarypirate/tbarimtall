-- Automated fix for NULL productId values in orders table
-- This script assigns the first available product ID to orders with NULL productId

-- Step 1: Drop foreign key constraints temporarily
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS "orders_productId_fkey";

ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS "orders_productId_fkey1";

-- Step 2: Assign a default productId to NULL orders using the first available product
-- If no products exist, this will fail - handle that case separately
UPDATE orders 
SET "productId" = (
  SELECT id 
  FROM products 
  ORDER BY id ASC 
  LIMIT 1
)
WHERE "productId" IS NULL
AND EXISTS (SELECT 1 FROM products LIMIT 1);

-- Step 3: If there are still NULL values (no products exist), delete those orders
-- Uncomment the line below if you want to delete orders when no products exist:
-- DELETE FROM orders WHERE "productId" IS NULL;

-- Step 4: Set NOT NULL constraint
ALTER TABLE orders 
ALTER COLUMN "productId" SET NOT NULL;

-- Step 5: Re-add foreign key constraint
ALTER TABLE orders 
ADD CONSTRAINT "orders_productId_fkey" 
FOREIGN KEY ("productId") 
REFERENCES products(id) 
ON DELETE NO ACTION 
ON UPDATE CASCADE;

-- Step 6: Verify the fix
SELECT 
  'orders' as table_name,
  column_name,
  data_type,
  is_nullable,
  (SELECT COUNT(*) FROM orders WHERE "productId" IS NULL) as null_count
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'productId';

