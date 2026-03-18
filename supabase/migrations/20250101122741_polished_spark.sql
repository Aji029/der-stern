/*
  # Add Bestellnummer to Products Table

  1. Changes
    - Add bestellnummer column to products table
    - Add index for bestellnummer lookups
    - Make bestellnummer nullable since it's optional

  2. Notes
    - Using DO block for safe column addition
    - Adding index to improve query performance
*/

DO $$ 
BEGIN
  -- Add bestellnummer column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'bestellnummer'
  ) THEN
    ALTER TABLE public.products 
    ADD COLUMN bestellnummer TEXT;

    -- Create index for bestellnummer lookups
    CREATE INDEX IF NOT EXISTS idx_products_bestellnummer 
    ON public.products(bestellnummer);
  END IF;
END $$;