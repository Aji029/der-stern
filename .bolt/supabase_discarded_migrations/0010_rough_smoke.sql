/*
  # Add New Product Columns

  1. Changes
    - Adds new columns to products table for extended product information
    - Adds indexes for improved query performance
    - Updates existing column constraints

  2. New Columns
    - Added detailed product information columns
    - Added inventory tracking columns
    - Added categorization columns
    - Added variant and grouping columns
    - Added search optimization columns
*/

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS base_id TEXT,
  ADD COLUMN IF NOT EXISTS category_id TEXT,
  ADD COLUMN IF NOT EXISTS variant_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS package_content TEXT,
  ADD COLUMN IF NOT EXISTS package_variants JSONB,
  ADD COLUMN IF NOT EXISTS by_article_search TEXT,
  ADD COLUMN IF NOT EXISTS by_match_priority_search TEXT,
  ADD COLUMN IF NOT EXISTS by_order_priority_search TEXT,
  ADD COLUMN IF NOT EXISTS count_orders_inv INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quantity_ordered_inv INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS seller_order_item_number TEXT,
  ADD COLUMN IF NOT EXISTS system_favorite_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS in_shopping_cart BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ist_bestand INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS product_producer TEXT,
  ADD COLUMN IF NOT EXISTS favorite_id TEXT,
  ADD COLUMN IF NOT EXISTS categories TEXT[],
  ADD COLUMN IF NOT EXISTS in_stock BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_inactive_in_group BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS its_all_inactive_products BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS count_variants INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS product_ids_group TEXT[];

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_base_id ON public.products(base_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_variant_id ON public.products(variant_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_by_article_search ON public.products(by_article_search);
CREATE INDEX IF NOT EXISTS idx_products_in_stock ON public.products(in_stock);

-- Update existing column
ALTER TABLE public.products 
  ALTER COLUMN herkunftsland SET DEFAULT 'Germany',
  ALTER COLUMN produktgruppe SET DEFAULT 'Backwaren';