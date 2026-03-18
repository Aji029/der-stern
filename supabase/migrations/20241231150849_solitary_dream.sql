/*
  # Create Products Table

  1. New Tables
    - `products`
      - `artikel_nr` (text, primary key) - Product article number
      - `name` (text) - Product name
      - `vk_price` (decimal) - Selling price
      - `ek_price` (decimal) - Purchase price
      - `mwst` (text) - VAT rate
      - `packung_art` (text) - Package type
      - `packung_inhalt` (text) - Package content
      - `herkunftsland` (text) - Country of origin
      - `produktgruppe` (text) - Product group
      - `supplier_id` (text) - Reference to supplier
      - `image_url` (text) - Product image URL
      - `ist_bestand` (integer) - Current stock
      - `status` (text) - Product status
      - Standard timestamps and user reference

  2. Security
    - Enable RLS
    - Public read access
    - Authenticated users can modify
    
  3. Indexes
    - User ID
    - Supplier ID
    - Status
*/

-- Create products table
CREATE TABLE public.products (
  artikel_nr TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vk_price DECIMAL(10,2) NOT NULL,
  ek_price DECIMAL(10,2) NOT NULL,
  mwst TEXT NOT NULL,
  packung_art TEXT NOT NULL,
  packung_inhalt TEXT NOT NULL,
  herkunftsland TEXT NOT NULL DEFAULT 'Germany',
  produktgruppe TEXT NOT NULL DEFAULT 'Backwaren',
  supplier_id TEXT,
  image_url TEXT,
  ist_bestand INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Products are publicly readable"
  ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON public.products
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update products"
  ON public.products
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete products"
  ON public.products
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX idx_products_status ON public.products(status);

-- Create trigger for updated_at timestamp
DO $$ BEGIN
  CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;