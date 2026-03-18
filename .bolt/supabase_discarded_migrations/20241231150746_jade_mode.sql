-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create handle_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create customers table first
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create customer policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Customers are publicly readable" ON public.customers;
  DROP POLICY IF EXISTS "Authenticated users can modify customers" ON public.customers;
  
  CREATE POLICY "Customers are publicly readable"
    ON public.customers
    FOR SELECT
    USING (true);

  CREATE POLICY "Authenticated users can modify customers"
    ON public.customers
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
END $$;

-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
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
  base_id TEXT,
  category_id TEXT,
  variant_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create product policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Products are publicly readable" ON public.products;
  DROP POLICY IF EXISTS "Authenticated users can modify products" ON public.products;
  
  CREATE POLICY "Products are publicly readable"
    ON public.products
    FOR SELECT
    USING (true);

  CREATE POLICY "Authenticated users can modify products"
    ON public.products
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
END $$;

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('Pending', 'Processing', 'Completed', 'Cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  delivery_date TIMESTAMP WITH TIME ZONE,
  payment_status TEXT NOT NULL CHECK (payment_status IN ('Pending', 'Paid', 'Overdue')),
  shipping_address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id)
);

-- Create order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(artikel_nr) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  ek_price DECIMAL(10,2) NOT NULL,
  vk_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for orders and items
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create order policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Orders are publicly readable" ON public.orders;
  DROP POLICY IF EXISTS "Authenticated users can modify orders" ON public.orders;
  
  CREATE POLICY "Orders are publicly readable"
    ON public.orders
    FOR SELECT
    USING (true);

  CREATE POLICY "Authenticated users can modify orders"
    ON public.orders
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
END $$;

-- Create order items policies
DO $$ BEGIN
  DROP POLICY IF EXISTS "Order items are publicly readable" ON public.order_items;
  DROP POLICY IF EXISTS "Authenticated users can modify order items" ON public.order_items;
  
  CREATE POLICY "Order items are publicly readable"
    ON public.order_items
    FOR SELECT
    USING (true);

  CREATE POLICY "Authenticated users can modify order items"
    ON public.order_items
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON public.customers(company_name);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_base_id ON public.products(base_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_variant_id ON public.products(variant_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Create triggers with checks
DO $$ BEGIN
  -- Drop existing triggers if they exist
  DROP TRIGGER IF EXISTS set_customers_updated_at ON public.customers;
  DROP TRIGGER IF EXISTS set_products_updated_at ON public.products;
  DROP TRIGGER IF EXISTS set_orders_updated_at ON public.orders;
  
  -- Create new triggers
  CREATE TRIGGER set_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

  CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

  CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
END $$;