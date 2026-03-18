-- First ensure all supplier_id references are valid UUIDs
UPDATE public.products
SET supplier_id = NULL
WHERE supplier_id IS NOT NULL AND NOT supplier_id::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

UPDATE public.order_items
SET supplier_id = NULL
WHERE supplier_id IS NOT NULL AND NOT supplier_id::TEXT ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Ensure supplier_id is UUID type in products table
ALTER TABLE public.products
  ALTER COLUMN supplier_id TYPE UUID USING supplier_id::UUID;

-- Ensure supplier_id is UUID type in order_items table  
ALTER TABLE public.order_items
  ALTER COLUMN supplier_id TYPE UUID USING supplier_id::UUID;

-- Add foreign key constraints
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS products_supplier_id_fkey,
  ADD CONSTRAINT products_supplier_id_fkey 
  FOREIGN KEY (supplier_id) 
  REFERENCES public.suppliers(id)
  ON DELETE SET NULL;

ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS order_items_supplier_id_fkey,
  ADD CONSTRAINT order_items_supplier_id_fkey
  FOREIGN KEY (supplier_id)
  REFERENCES public.suppliers(id)
  ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_order_items_supplier_id ON public.order_items(supplier_id);