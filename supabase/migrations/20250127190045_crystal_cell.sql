-- First drop the existing foreign key constraint
ALTER TABLE public.customer_favorites
DROP CONSTRAINT IF EXISTS customer_favorites_product_id_fkey;

-- Re-add the constraint with ON DELETE CASCADE
ALTER TABLE public.customer_favorites
ADD CONSTRAINT customer_favorites_product_id_fkey
FOREIGN KEY (product_id)
REFERENCES public.products(artikel_nr)
ON DELETE CASCADE;

-- Update the safely_delete_product function to handle customer_favorites
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

  -- Delete the product (cascade will handle order_items and customer_favorites)
  DELETE FROM products
  WHERE artikel_nr = p_artikel_nr
  AND user_id = auth.uid();

  RETURN FOUND;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION safely_delete_product TO authenticated;