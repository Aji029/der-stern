/*
  # Remove Packung Inhalt Column
  
  1. Changes
    - Remove packung_inhalt column from products table
    - Use safe DO block to prevent errors
*/

DO $$ 
BEGIN
  -- Remove packung_inhalt column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'packung_inhalt'
  ) THEN
    ALTER TABLE public.products 
    DROP COLUMN packung_inhalt;
  END IF;
END $$;