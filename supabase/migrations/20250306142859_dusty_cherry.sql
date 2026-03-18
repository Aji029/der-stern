/*
  # Add direct price update function
  
  1. Changes
    - Create a new function for direct price updates that avoids recursion
    - Function updates prices directly in the products table
    - Function updates prices in order_items table for pending/processing orders
*/

CREATE OR REPLACE FUNCTION update_product_price_direct(
  p_artikel_nr TEXT,
  p_price NUMERIC,
  p_price_type TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the product price
  EXECUTE format('
    UPDATE products 
    SET %I = $1
    WHERE artikel_nr = $2',
    p_price_type
  ) USING p_price, p_artikel_nr;

  -- Update order items for pending/processing orders
  IF p_price_type = 'ek_price' THEN
    UPDATE order_items oi
    SET ek_price = p_price
    FROM orders o
    WHERE oi.order_id = o.id
    AND oi.product_id = p_artikel_nr
    AND o.status IN ('Pending', 'Processing');
  ELSIF p_price_type = 'vk_price' THEN
    UPDATE order_items oi
    SET 
      vk_price = p_price,
      total = quantity * p_price
    FROM orders o
    WHERE oi.order_id = o.id
    AND oi.product_id = p_artikel_nr
    AND o.status IN ('Pending', 'Processing');

    -- Update order totals
    UPDATE orders o
    SET total_amount = (
      SELECT SUM(oi.quantity * oi.vk_price)
      FROM order_items oi
      WHERE oi.order_id = o.id
    )
    WHERE id IN (
      SELECT DISTINCT o2.id
      FROM orders o2
      JOIN order_items oi2 ON oi2.order_id = o2.id
      WHERE oi2.product_id = p_artikel_nr
      AND o2.status IN ('Pending', 'Processing')
    );
  END IF;
END;
$$;

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS update_product_price(TEXT, NUMERIC, TEXT);

COMMENT ON FUNCTION update_product_price_direct IS 'Updates product prices and related order items without recursion';