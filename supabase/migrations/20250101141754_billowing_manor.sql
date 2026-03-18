-- Add billing_address column to customers table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'billing_address'
  ) THEN
    ALTER TABLE public.customers 
    ADD COLUMN billing_address TEXT;
  END IF;
END $$;