-- Create function to get price history for a product
CREATE OR REPLACE FUNCTION get_product_price_history(
  p_product_id TEXT,
  p_limit INTEGER DEFAULT 3
)
RETURNS TABLE (
  price DECIMAL,
  order_date TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH unique_prices AS (
    SELECT DISTINCT ON (oi.vk_price)
      oi.vk_price as price,
      o.order_date
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = p_product_id
    AND o.status = 'Completed'
    ORDER BY oi.vk_price, o.order_date DESC
  )
  SELECT price, order_date
  FROM unique_prices
  ORDER BY order_date DESC
  LIMIT p_limit;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_product_price_history TO authenticated;

-- Create view for easier querying
CREATE OR REPLACE VIEW product_price_history AS
SELECT DISTINCT ON (oi.product_id, oi.vk_price)
  oi.product_id,
  oi.vk_price as price,
  o.order_date
FROM order_items oi
INNER JOIN orders o ON o.id = oi.order_id
WHERE o.status = 'Completed'
ORDER BY oi.product_id, oi.vk_price, o.order_date DESC;

-- Grant select permission to authenticated users
GRANT SELECT ON product_price_history TO authenticated;