/*
  # Create direct price update function
  
  1. New Functions
    - update_product_price_direct: Updates product prices and related order items
      - Parameters:
        - p_artikel_nr: Product article number
        - p_price: New price value
        - p_price_type: Price type ('ek_price' or 'vk_price')
      
  2. Changes
    - Creates a more efficient price update function that avoids stack depth issues
    - Handles both product and order item updates in a single function
    
  3. Security
    - Function is accessible to authenticated users only
*/

-- Create function for direct price updates
CREATE OR REPLACE FUNCTION update_product_price_direct(
  p_artikel_nr TEXT,
  p_price NUMERIC,
  p_price_type TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update product price
  IF p_price_type = 'ek_price' THEN
    UPDATE products 
    SET ek_price = p_price,
        updated_at = NOW()
    WHERE artikel_nr = p_artikel_nr;
    
    -- Update order items EK price for pending/processing orders
    UPDATE order_items oi
    SET ek_price = p_price
    FROM orders o
    WHERE oi.order_id = o.id
    AND oi.product_id = p_artikel_nr
    AND o.status IN ('Pending', 'Processing');
    
  ELSIF p_price_type = 'vk_price' THEN
    UPDATE products 
    SET vk_price = p_price,
        updated_at = NOW()
    WHERE artikel_nr = p_artikel_nr;
    
    -- Update order items VK price and total for pending/processing orders
    UPDATE order_items oi
    SET vk_price = p_price,
        total = quantity * p_price
    FROM orders o
    WHERE oi.order_id = o.id
    AND oi.product_id = p_artikel_nr
    AND o.status IN ('Pending', 'Processing');
    
    -- Update order totals
    WITH updated_orders AS (
      SELECT DISTINCT o.id
      FROM orders o
      JOIN order_items oi ON oi.order_id = o.id
      WHERE oi.product_id = p_artikel_nr
      AND o.status IN ('Pending', 'Processing')
    )
    UPDATE orders o
    SET total_amount = (
      SELECT SUM(oi.quantity * oi.vk_price)
      FROM order_items oi
      WHERE oi.order_id = o.id
    )
    WHERE id IN (SELECT id FROM updated_orders);
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_product_price_direct TO authenticated;