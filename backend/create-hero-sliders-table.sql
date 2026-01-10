-- Create hero_sliders table
CREATE TABLE IF NOT EXISTS hero_sliders (
  id SERIAL PRIMARY KEY,
  imageUrl VARCHAR(500) NOT NULL,
  title VARCHAR(255),
  subtitle VARCHAR(255),
  "order" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on order for faster sorting
CREATE INDEX IF NOT EXISTS idx_hero_sliders_order ON hero_sliders("order");

-- Create index on isActive for faster filtering
CREATE INDEX IF NOT EXISTS idx_hero_sliders_isactive ON hero_sliders("isActive");

