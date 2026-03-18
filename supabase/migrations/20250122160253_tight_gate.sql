-- Drop existing function if it exists
DROP FUNCTION IF EXISTS get_product_price_history;

-- Create improved function with explicit column references
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
      items.vk_price,
      ord.order_date,
      ROW_NUMBER() OVER (
        PARTITION BY items.vk_price 
        ORDER BY ord.order_date DESC
      ) as rn
    FROM order_items items
    INNER JOIN orders ord ON ord.id = items.order_id
    WHERE items.product_id = p_product_id
    AND ord.status = 'Completed'
  )
  SELECT 
    op.vk_price,
    op.order_date
  FROM ordered_prices op
  WHERE op.rn = 1
  ORDER BY op.order_date DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_product_price_history TO authenticated;