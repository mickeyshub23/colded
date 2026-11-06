-- E-commerce Database Schema for Supabase (PostgreSQL)

-- Enable UUID generation (gen_random_uuid is built into PG13+)
-- If using older PG version, enable pgcrypto extension:
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0 NOT NULL,
  published BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  vendor TEXT DEFAULT '',
  type TEXT DEFAULT '',
  sku TEXT DEFAULT '',
  barcode TEXT,
  price NUMERIC(10,2) NOT NULL,
  compare_at_price NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  inventory_quantity INTEGER DEFAULT 0 NOT NULL,
  inventory_policy TEXT NOT NULL DEFAULT 'deny' CHECK (inventory_policy IN ('deny', 'allow')),
  featured_image_url TEXT,
  images JSONB DEFAULT '[]'::jsonb NOT NULL,
  options JSONB DEFAULT '[]'::jsonb NOT NULL,
  variants JSONB DEFAULT '[]'::jsonb NOT NULL,
  tags JSONB DEFAULT '[]'::jsonb NOT NULL,
  seo_title TEXT,
  seo_description TEXT,
  published BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_collection_id ON products (collection_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
CREATE INDEX IF NOT EXISTS idx_products_published ON products (published);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_collections_handle ON collections (handle);

-- Enable Row Level Security (RLS)
-- Since we use service role key for admin operations, enable RLS but add permissive policies for now
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for storefront) - adjust as needed for your security model
CREATE POLICY "Public read collections" ON collections FOR SELECT USING (true);
CREATE POLICY "Public read products" ON products FOR SELECT USING (true);

-- Allow service role full access (service_role bypasses RLS by default in Supabase)
-- No additional policies needed for service role.

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Set up realtime (optional, for admin dashboard updates)
-- ALTER PUBLICATION supabase_realtime ADD TABLE products;
-- ALTER PUBLICATION supabase_realtime ADD TABLE collections;
