-- Fix null userId constraint violation in orders table
-- Run these queries in order

-- 1. First, check how many orders have null userId
SELECT COUNT(*) as null_user_count 
FROM orders 
WHERE "userId" IS NULL;

-- 2. View orders with null userId (optional - to see what you're dealing with)
SELECT id, "productId", amount, "paymentMethod", status, "createdAt"
FROM orders 
WHERE "userId" IS NULL
ORDER BY "createdAt" DESC;

-- 3. OPTION A: Make userId column nullable (RECOMMENDED - since model allows null for guest orders)
-- This aligns the database with the model definition
ALTER TABLE orders 
ALTER COLUMN "userId" DROP NOT NULL;

-- 4. OPTION B: If you want to assign a default user to null orders instead
-- First, get a default user ID (replace with an actual user ID from your users table)
-- SELECT id FROM users WHERE role = 'viewer' LIMIT 1;

-- Then update null userIds to that user (UNCOMMENT AND REPLACE <DEFAULT_USER_ID> with actual ID)
-- UPDATE orders 
-- SET "userId" = <DEFAULT_USER_ID>
-- WHERE "userId" IS NULL;

-- 5. OPTION C: If null orders are invalid and should be deleted
-- DELETE FROM orders WHERE "userId" IS NULL;

-- 6. Verify the fix
SELECT 
  COUNT(*) as total_orders,
  COUNT("userId") as orders_with_user,
  COUNT(*) - COUNT("userId") as orders_without_user
FROM orders;

