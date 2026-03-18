/*
  # Create Core Tables with Relationships

  1. Tables (in order)
    - customers
    - products 
    - orders
    - order_items

  2. Security
    - Enable RLS on all tables
    - Public read access
    - Authenticated users can modify
    
  3. Relationships
    - orders.customer_id -> customers.id
    - order_items.order_id -> orders.id
    - order_items.product_id -> products.artikel_nr
*/

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
CREATE POLICY "Customers are publicly readable"
  ON public.customers
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can modify customers"
  ON public.customers
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create orders table with proper reference
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

-- Enable RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create order policies
CREATE POLICY "Orders are publicly readable"
  ON public.orders
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can modify orders"
  ON public.orders
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create order items table with proper references
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_id TEXT REFERENCES public.products(artikel_nr) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  ek_price DECIMAL(10,2) NOT NULL,
  vk_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  supplier_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for order items
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create order items policies
CREATE POLICY "Order items are publicly readable"
  ON public.order_items
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can modify order items"
  ON public.order_items
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_name ON public.customers(company_name);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON public.order_items(product_id);

-- Create triggers for updated_at timestamps
DO $$ BEGIN
  CREATE TRIGGER set_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;