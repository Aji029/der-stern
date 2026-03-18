-- Add additional columns to products table
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS base_id TEXT,
  ADD COLUMN IF NOT EXISTS category_id TEXT,
  ADD COLUMN IF NOT EXISTS variant_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS package_content TEXT,
  ADD COLUMN IF NOT EXISTS package_variants JSONB,
  ADD COLUMN IF NOT EXISTS ist_bestand INTEGER DEFAULT 0;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_products_base_id ON public.products(base_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_variant_id ON public.products(variant_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);