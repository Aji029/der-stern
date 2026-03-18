/*
  # Reset Order Numbers and Add Reference Number
  
  1. Reset order sequence to start from 10005
  2. Add reference_number column to orders table
*/

-- Drop and recreate sequence
DROP SEQUENCE IF EXISTS order_number_seq;

CREATE SEQUENCE order_number_seq
  START WITH 10005
  INCREMENT BY 1
  MAXVALUE 99999
  MINVALUE 10005
  CYCLE;

-- Add reference_number column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'reference_number'
  ) THEN
    ALTER TABLE public.orders 
    ADD COLUMN reference_number TEXT;
  END IF;
END $$;