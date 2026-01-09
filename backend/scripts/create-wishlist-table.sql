-- Create wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id SERIAL PRIMARY KEY,
  "userId" INTEGER NOT NULL,
  "productId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("productId") REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE("userId", "productId")
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_wishlists_userId ON wishlists("userId");
CREATE INDEX IF NOT EXISTS idx_wishlists_productId ON wishlists("productId");

