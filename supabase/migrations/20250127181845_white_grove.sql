-- Create function to efficiently fetch orders with related data
CREATE OR REPLACE FUNCTION get_orders_with_details(
  p_limit INTEGER,
  p_offset INTEGER,
  p_status TEXT DEFAULT NULL,
  p_customer_id UUID DEFAULT NULL,
  p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  id TEXT,
  customer_id UUID,
  status TEXT,
  total_amount DECIMAL,
  order_date TIMESTAMP WITH TIME ZONE,
  payment_status TEXT,
  customer_name TEXT,
  items_count BIGINT,
  total_quantity DECIMAL
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_orders AS (
    SELECT o.*, c.company_name as customer_name
    FROM orders o
    INNER JOIN customers c ON c.id = o.customer_id
    WHERE (p_status IS NULL OR o.status = p_status)
    AND (p_customer_id IS NULL OR o.customer_id = p_customer_id)
    AND (p_date_from IS NULL OR o.order_date >= p_date_from)
    AND (p_date_to IS NULL OR o.order_date <= p_date_to)
  ),
  order_stats AS (
    SELECT 
      order_id,
      COUNT(*) as items_count,
      SUM(quantity) as total_quantity
    FROM order_items
    GROUP BY order_id
  )
  SELECT 
    fo.id,
    fo.customer_id,
    fo.status,
    fo.total_amount,
    fo.order_date,
    fo.payment_status,
    fo.customer_name,
    COALESCE(os.items_count, 0),
    COALESCE(os.total_quantity, 0)
  FROM filtered_orders fo
  LEFT JOIN order_stats os ON os.order_id = fo.id
  ORDER BY fo.order_date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Create function to get product details efficiently
CREATE OR REPLACE FUNCTION get_product_details(
  p_artikel_nr TEXT,
  p_include_price_history BOOLEAN DEFAULT false
)
RETURNS TABLE (
  artikel_nr TEXT,
  name TEXT,
  vk_price DECIMAL,
  ek_price DECIMAL,
  mwst TEXT,
  supplier_name TEXT,
  current_stock INTEGER,
  price_history JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.artikel_nr,
    p.name,
    p.vk_price,
    p.ek_price,
    p.mwst,
    s.company_name as supplier_name,
    p.ist_bestand as current_stock,
    CASE WHEN p_include_price_history THEN
      (SELECT jsonb_agg(
        jsonb_build_object(
          'price', ph.vk_price,
          'date', ph.order_date
        )
      )
      FROM get_product_price_history(p.artikel_nr, 3) ph)
    ELSE NULL
    END as price_history
  FROM products p
  LEFT JOIN suppliers s ON s.id = p.supplier_id
  WHERE p.artikel_nr = p_artikel_nr;
END;
$$;

-- Create function to get customer order summary
CREATE OR REPLACE FUNCTION get_customer_order_summary(
  p_customer_id UUID,
  p_date_from TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_date_to TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_orders BIGINT,
  total_amount DECIMAL,
  avg_order_value DECIMAL,
  most_ordered_products JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH order_stats AS (
    SELECT 
      COUNT(*) as total_orders,
      SUM(total_amount) as total_amount,
      AVG(total_amount) as avg_order_value
    FROM orders
    WHERE customer_id = p_customer_id
    AND (p_date_from IS NULL OR order_date >= p_date_from)
    AND (p_date_to IS NULL OR order_date <= p_date_to)
  ),
  product_stats AS (
    SELECT 
      p.name,
      p.artikel_nr,
      SUM(oi.quantity) as total_quantity
    FROM order_items oi
    INNER JOIN orders o ON o.id = oi.order_id
    INNER JOIN products p ON p.artikel_nr = oi.product_id
    WHERE o.customer_id = p_customer_id
    AND (p_date_from IS NULL OR o.order_date >= p_date_from)
    AND (p_date_to IS NULL OR o.order_date <= p_date_to)
    GROUP BY p.name, p.artikel_nr
    ORDER BY total_quantity DESC
    LIMIT 5
  )
  SELECT 
    os.total_orders,
    os.total_amount,
    os.avg_order_value,
    (SELECT jsonb_agg(
      jsonb_build_object(
        'name', ps.name,
        'artikel_nr', ps.artikel_nr,
        'total_quantity', ps.total_quantity
      )
    ) FROM product_stats ps) as most_ordered_products
  FROM order_stats os;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_orders_with_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_details TO authenticated;
GRANT EXECUTE ON FUNCTION get_customer_order_summary TO authenticated;