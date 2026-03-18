/*
  # Add direct price update function

  1. New Functions
    - `update_product_price_direct`: Updates product prices directly without recursion
      - Parameters:
        - p_artikel_nr: Product article number
        - p_price: New price value
        - p_price_type: Price type ('ek_price' or 'vk_price')
      
  2. Changes
    - Creates a more efficient price update function that avoids stack depth issues
    - Uses direct updates instead of recursive calls
    - Handles both EK and VK price updates
    
  3. Security
    - Function is accessible to authenticated users only
*/

-- Create the direct price update function
CREATE OR REPLACE FUNCTION public.update_product_price_direct(
  p_artikel_nr text,
  p_price numeric,
  p_price_type text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate price type
  IF p_price_type NOT IN ('ek_price', 'vk_price') THEN
    RAISE EXCEPTION 'Invalid price type. Must be either ''ek_price'' or ''vk_price''';
  END IF;

  -- Update product price
  EXECUTE format('
    UPDATE products 
    SET %I = $1, 
        updated_at = now() 
    WHERE artikel_nr = $2', 
    p_price_type)
  USING p_price, p_artikel_nr;

  -- Update order items prices
  IF p_price_type = 'vk_price' THEN
    UPDATE order_items
    SET vk_price = p_price,
        total = quantity * p_price
    WHERE product_id = p_artikel_nr
    AND order_id IN (
      SELECT id FROM orders 
      WHERE status IN ('Pending', 'Processing')
    );
  ELSIF p_price_type = 'ek_price' THEN
    UPDATE order_items
    SET ek_price = p_price
    WHERE product_id = p_artikel_nr
    AND order_id IN (
      SELECT id FROM orders 
      WHERE status IN ('Pending', 'Processing')
    );
  END IF;

  -- Update order totals
  UPDATE orders o
  SET total_amount = (
    SELECT COALESCE(SUM(oi.quantity * oi.vk_price), 0)
    FROM order_items oi
    WHERE oi.order_id = o.id
  )
  WHERE id IN (
    SELECT DISTINCT order_id 
    FROM order_items 
    WHERE product_id = p_artikel_nr
  )
  AND status IN ('Pending', 'Processing');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_product_price_direct TO authenticated;