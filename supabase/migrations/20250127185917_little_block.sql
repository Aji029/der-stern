-- First drop the existing foreign key constraint
ALTER TABLE public.order_items
DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;

-- Re-add the constraint with ON DELETE CASCADE
ALTER TABLE public.order_items
ADD CONSTRAINT order_items_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES public.products(artikel_nr)
ON DELETE CASCADE;

-- Create function to safely delete products
CREATE OR REPLACE FUNCTION safely_delete_product(p_artikel_nr TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get the user_id of the product
  SELECT user_id INTO v_user_id
  FROM products
  WHERE artikel_nr = p_artikel_nr;

  -- Check if product exists and user owns it
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Delete the product (cascade will handle order_items)
  DELETE FROM products
  WHERE artikel_nr = p_artikel_nr
  AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION safely_delete_product TO authenticated;