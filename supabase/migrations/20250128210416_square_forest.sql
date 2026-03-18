-- Update sequences table with new starting value
INSERT INTO public.sequences (key, value)
VALUES ('invoice_sequence', 10159)
ON CONFLICT (key) 
DO UPDATE SET value = 10159
WHERE sequences.value < 10159;

-- Create or replace function to get next invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Get and increment the sequence
  UPDATE sequences 
  SET value = value + 1 
  WHERE key = 'invoice_sequence'
  RETURNING value INTO next_number;

  -- If no sequence found, create it starting at 10159
  IF next_number IS NULL THEN
    INSERT INTO sequences (key, value)
    VALUES ('invoice_sequence', 10159)
    RETURNING value INTO next_number;
  END IF;

  -- Format as YYYYMMDD-XXXX
  RETURN to_char(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_number::TEXT, 4, '0');
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_next_invoice_number TO authenticated;