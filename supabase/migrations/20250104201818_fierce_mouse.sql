/*
  # Add MwSt column to orders table
  
  1. Changes
    - Add mwst column to orders table
    - Set default value to 'B'
    - Add check constraint to ensure valid values
    - Create index for efficient queries
  
  2. Security
    - Maintain existing RLS policies
*/

-- First ensure any existing mwst column is dropped to avoid conflicts
ALTER TABLE public.orders 
DROP COLUMN IF EXISTS mwst;

-- Add mwst column with default value
ALTER TABLE public.orders
ADD COLUMN mwst TEXT NOT NULL DEFAULT 'B';

-- Add check constraint to ensure valid values
DO $$ 
BEGIN
  ALTER TABLE public.orders
  ADD CONSTRAINT orders_mwst_check
  CHECK (mwst IN ('A', 'B'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create index for mwst queries if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'orders' AND indexname = 'idx_orders_mwst'
  ) THEN
    CREATE INDEX idx_orders_mwst ON public.orders(mwst);
  END IF;
END $$;

-- Update existing orders to use default value if needed
UPDATE public.orders
SET mwst = 'B'
WHERE mwst IS NULL OR mwst NOT IN ('A', 'B');