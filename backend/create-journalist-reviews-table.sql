-- Create journalist_reviews table
CREATE TABLE IF NOT EXISTS journalist_reviews (
  id SERIAL PRIMARY KEY,
  "journalistId" INTEGER NOT NULL,
  "userId" INTEGER NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("journalistId") REFERENCES journalists(id) ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT unique_journalist_user_review UNIQUE ("journalistId", "userId")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_journalist_reviews_journalist ON journalist_reviews("journalistId");
CREATE INDEX IF NOT EXISTS idx_journalist_reviews_user ON journalist_reviews("userId");

