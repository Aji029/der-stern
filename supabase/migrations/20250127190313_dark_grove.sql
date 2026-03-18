-- Create a function to create order with items in a single transaction
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_customer_id UUID,
  p_status TEXT,
  p_total_amount DECIMAL,
  p_order_date TIMESTAMP WITH TIME ZONE,
  p_delivery_date TIMESTAMP WITH TIME ZONE,
  p_payment_status TEXT,
  p_shipping_address TEXT,
  p_notes TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id TEXT;
  v_item JSONB;
BEGIN
  -- Create order
  INSERT INTO orders (
    customer_id,
    status,
    total_amount,
    final_amount,
    order_date,
    delivery_date,
    payment_status,
    shipping_address,
    notes,
    user_id
  ) VALUES (
    p_customer_id,
    p_status,
    p_total_amount,
    p_total_amount,
    p_order_date,
    p_delivery_date,
    p_payment_status,
    p_shipping_address,
    p_notes,
    auth.uid()
  )
  RETURNING id INTO v_order_id;

  -- Insert order items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (
      order_id,
      product_id,
      quantity,
      ek_price,
      vk_price,
      total,
      mwst,
      supplier_id,
      user_id
    ) VALUES (
      v_order_id,
      v_item->>'product_id',
      (v_item->>'quantity')::DECIMAL,
      (v_item->>'ek_price')::DECIMAL,
      (v_item->>'vk_price')::DECIMAL,
      (v_item->>'total')::DECIMAL,
      v_item->>'mwst',
      (v_item->>'supplier_id')::UUID,
      auth.uid()
    );
  END LOOP;

  -- Return the created order data
  RETURN jsonb_build_object(
    'id', v_order_id,
    'customer_id', p_customer_id,
    'status', p_status,
    'total_amount', p_total_amount,
    'order_date', p_order_date,
    'delivery_date', p_delivery_date,
    'payment_status', p_payment_status,
    'shipping_address', p_shipping_address,
    'notes', p_notes
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_order_with_items TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_status ON orders(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_order_items_product_supplier ON order_items(product_id, supplier_id);