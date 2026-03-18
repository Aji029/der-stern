-- Drop existing function and view
DROP FUNCTION IF EXISTS get_product_price_history;
DROP VIEW IF EXISTS product_price_history;

-- Create improved function to get price history for a product
CREATE OR REPLACE FUNCTION get_product_price_history(
  p_product_id TEXT,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  vk_price DECIMAL,
  order_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH ordered_prices AS (
    SELECT DISTINCT
      oi.vk_price,
      o.order_date,
      ROW_NUMBER() OVER (
        PARTITION BY oi.vk_price 
        ORDER BY o.order_date DESC
      ) as rn
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = p_product_id
    AND o.status = 'Completed'
  )
  SELECT 
    vk_price,
    order_date
  FROM ordered_prices
  WHERE rn = 1
  ORDER BY order_date DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_product_price_history TO authenticated;