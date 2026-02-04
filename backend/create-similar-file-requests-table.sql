-- Create similar_file_requests table
CREATE TABLE IF NOT EXISTS similar_file_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  "productId" INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  "authorId" INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  "adminNotes" TEXT,
  "processedAt" TIMESTAMP,
  "processedBy" INTEGER REFERENCES users(id) ON DELETE SET NULL,
  "journalistNotes" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_similar_file_requests_user_id ON similar_file_requests("userId");
CREATE INDEX IF NOT EXISTS idx_similar_file_requests_product_id ON similar_file_requests("productId");
CREATE INDEX IF NOT EXISTS idx_similar_file_requests_author_id ON similar_file_requests("authorId");
CREATE INDEX IF NOT EXISTS idx_similar_file_requests_status ON similar_file_requests(status);
CREATE INDEX IF NOT EXISTS idx_similar_file_requests_created_at ON similar_file_requests("createdAt");

-- Add comment to table
COMMENT ON TABLE similar_file_requests IS 'Ижил төстэй файл захиалгын хүсэлтүүд';
COMMENT ON COLUMN similar_file_requests."userId" IS 'Хүсэлт илгээсэн хэрэглэгч';
COMMENT ON COLUMN similar_file_requests."productId" IS 'Ижил төстэй контент хүссэн бараа';
COMMENT ON COLUMN similar_file_requests."authorId" IS 'Контент нийтлэгч (журналист)';
COMMENT ON COLUMN similar_file_requests.description IS 'Хэрэглэгчийн тайлбар';
COMMENT ON COLUMN similar_file_requests.status IS 'Хүсэлтийн статус: pending, approved, rejected, completed';
COMMENT ON COLUMN similar_file_requests."adminNotes" IS 'Админий тайлбар';
COMMENT ON COLUMN similar_file_requests."processedBy" IS 'Хүсэлт боловсруулсан админ';
COMMENT ON COLUMN similar_file_requests."journalistNotes" IS 'Нийтлэгчийн тайлбар';

