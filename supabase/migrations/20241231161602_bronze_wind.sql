-- Create function to update product prices and related order items atomically
CREATE OR REPLACE FUNCTION public.update_product_price(
  p_artikel_nr TEXT,
  p_price DECIMAL,
  p_price_type TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate input
  IF p_artikel_nr IS NULL OR p_price IS NULL OR p_price_type IS NULL THEN
    RAISE EXCEPTION 'All parameters are required';
  END IF;

  IF p_price < 0 THEN
    RAISE EXCEPTION 'Price cannot be negative';
  END IF;

  IF p_price_type NOT IN ('ek_price', 'vk_price') THEN
    RAISE EXCEPTION 'Invalid price type';
  END IF;

  -- Update product price
  EXECUTE format('
    UPDATE public.products 
    SET %I = $1, updated_at = NOW()
    WHERE artikel_nr = $2', p_price_type)
  USING p_price, p_artikel_nr;

  -- Update order items for pending/processing orders
  EXECUTE format('
    UPDATE public.order_items
    SET %I = $1
    WHERE product_id = $2
    AND order_id IN (
      SELECT id FROM public.orders
      WHERE status IN (''Pending'', ''Processing'')
    )', p_price_type)
  USING p_price, p_artikel_nr;

END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_product_price TO authenticated;