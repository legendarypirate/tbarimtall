-- Create follows table
CREATE TABLE IF NOT EXISTS follows (
  id SERIAL PRIMARY KEY,
  "followerId" INTEGER NOT NULL,
  "journalistId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("followerId") REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY ("journalistId") REFERENCES journalists(id) ON DELETE CASCADE,
  CONSTRAINT unique_follow UNIQUE ("followerId", "journalistId")
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_follows_journalist ON follows("journalistId");
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows("followerId");

