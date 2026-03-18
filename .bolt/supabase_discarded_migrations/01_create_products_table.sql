-- Create products table
CREATE TABLE public.products (
  artikel_nr TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  vk_price DECIMAL(10,2) NOT NULL,
  ek_price DECIMAL(10,2) NOT NULL,
  mwst TEXT NOT NULL,
  packung_art TEXT NOT NULL,
  packung_inhalt TEXT NOT NULL,
  herkunftsland TEXT NOT NULL,
  produktgruppe TEXT NOT NULL,
  supplier_id TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own products"
  ON public.products
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
  ON public.products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON public.products
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON public.products
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_products_user_id ON public.products(user_id);
CREATE INDEX idx_products_supplier_id ON public.products(supplier_id);

-- Create updated_at trigger
CREATE TRIGGER set_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();