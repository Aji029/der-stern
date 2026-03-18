/*
  # Remove unused supplier columns

  1. Changes
    - Remove payment_terms column
    - Remove supplier_type column
    - Remove rating column
    - Remove notes column
    
  2. Safety
    - Uses ALTER TABLE DROP COLUMN IF EXISTS to prevent errors
*/

ALTER TABLE public.suppliers 
  DROP COLUMN IF EXISTS payment_terms,
  DROP COLUMN IF EXISTS supplier_type,
  DROP COLUMN IF EXISTS rating,
  DROP COLUMN IF EXISTS notes;