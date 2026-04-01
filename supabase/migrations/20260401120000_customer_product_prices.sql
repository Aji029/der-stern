-- Table: custom VK (selling price) per customer per product
CREATE TABLE public.customer_product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(artikel_nr) ON DELETE CASCADE,
  vk_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  UNIQUE (customer_id, product_id, user_id)
);

-- RLS
ALTER TABLE public.customer_product_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own customer prices"
  ON public.customer_product_prices
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER set_customer_product_prices_updated_at
  BEFORE UPDATE ON public.customer_product_prices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RPC: get a customer's custom VK for one product (returns NULL if not set)
CREATE OR REPLACE FUNCTION get_customer_product_price(
  p_customer_id UUID,
  p_product_id TEXT
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_price DECIMAL;
BEGIN
  SELECT vk_price INTO v_price
  FROM public.customer_product_prices
  WHERE customer_id = p_customer_id
    AND product_id  = p_product_id
    AND user_id     = auth.uid();
  RETURN v_price; -- NULL when no custom price is set
END;
$$;

GRANT EXECUTE ON FUNCTION get_customer_product_price TO authenticated;
