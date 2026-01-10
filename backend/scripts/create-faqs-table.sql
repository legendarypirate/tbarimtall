-- Create FAQs table
-- This script creates the faqs table for storing frequently asked questions

CREATE TABLE IF NOT EXISTS faqs (
  id SERIAL PRIMARY KEY,
  question JSON NOT NULL,
  answer JSON NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on order for faster sorting
CREATE INDEX IF NOT EXISTS idx_faqs_order ON faqs("order");

-- Create index on isActive for filtering active FAQs
CREATE INDEX IF NOT EXISTS idx_faqs_isactive ON faqs("isActive");

-- Add comment to table
COMMENT ON TABLE faqs IS 'Stores frequently asked questions with multilingual support (Mongolian and English)';

-- Add comments to columns
COMMENT ON COLUMN faqs.question IS 'JSON object with mn and en keys for multilingual questions';
COMMENT ON COLUMN faqs.answer IS 'JSON object with mn and en keys for multilingual answers';
COMMENT ON COLUMN faqs."order" IS 'Display order (lower numbers appear first)';
COMMENT ON COLUMN faqs."isActive" IS 'Whether the FAQ is active and visible to users';

