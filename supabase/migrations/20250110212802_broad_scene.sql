-- Create customer_favorites table to track frequently ordered products
CREATE TABLE public.customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id) NOT NULL,
  product_id TEXT REFERENCES public.products(artikel_nr) NOT NULL,
  order_count INTEGER DEFAULT 1,
  total_quantity DECIMAL(10,2) DEFAULT 0,
  last_ordered_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS
ALTER TABLE public.customer_favorites ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_customer_favorites_customer_id ON public.customer_favorites(customer_id);
CREATE INDEX idx_customer_favorites_product_id ON public.customer_favorites(product_id);
CREATE INDEX idx_customer_favorites_user_id ON public.customer_favorites(user_id);
CREATE UNIQUE INDEX idx_customer_favorites_unique ON public.customer_favorites(customer_id, product_id);

-- Create RLS policies
CREATE POLICY "Users can view their own customer favorites"
  ON public.customer_favorites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customer favorites"
  ON public.customer_favorites
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customer favorites"
  ON public.customer_favorites
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own customer favorites"
  ON public.customer_favorites
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER set_customer_favorites_updated_at
  BEFORE UPDATE ON public.customer_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to update customer favorites when orders are created/updated
CREATE OR REPLACE FUNCTION update_customer_favorites()
RETURNS TRIGGER AS $$
BEGIN
  -- For new orders or updates
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') AND NEW.status != 'Cancelled' THEN
    -- Insert or update customer favorites for each item
    INSERT INTO public.customer_favorites (
      customer_id,
      product_id,
      order_count,
      total_quantity,
      last_ordered_at,
      user_id
    )
    SELECT 
      NEW.customer_id,
      oi.product_id,
      1,
      oi.quantity,
      NEW.order_date,
      NEW.user_id
    FROM order_items oi
    WHERE oi.order_id = NEW.id
    ON CONFLICT (customer_id, product_id) DO UPDATE SET
      order_count = customer_favorites.order_count + 1,
      total_quantity = customer_favorites.total_quantity + EXCLUDED.total_quantity,
      last_ordered_at = GREATEST(customer_favorites.last_ordered_at, EXCLUDED.last_ordered_at),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for orders
CREATE TRIGGER update_customer_favorites_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_favorites();