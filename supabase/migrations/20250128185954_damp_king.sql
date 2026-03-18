-- Create function to update supplier across orders
CREATE OR REPLACE FUNCTION update_supplier_across_orders(
  p_product_id TEXT,
  p_supplier_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update supplier_id in products table
  UPDATE products
  SET 
    supplier_id = p_supplier_id,
    updated_at = NOW()
  WHERE artikel_nr = p_product_id;

  -- Update supplier_id in all order items for this product
  UPDATE order_items
  SET supplier_id = p_supplier_id
  WHERE product_id = p_product_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_supplier_across_orders TO authenticated;