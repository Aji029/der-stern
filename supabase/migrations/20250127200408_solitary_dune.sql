-- Drop and recreate sequence to start from 10100
DROP SEQUENCE IF EXISTS order_number_seq;

CREATE SEQUENCE order_number_seq
  START WITH 10100
  INCREMENT BY 1
  MAXVALUE 99999
  MINVALUE 10100
  CYCLE;

-- Update existing orders to use new sequence if needed
DO $$ 
BEGIN
  -- Reset sequence to start after highest existing order number
  PERFORM setval('order_number_seq', 
    GREATEST(
      10100,
      (SELECT COALESCE(MAX(CAST(id AS INTEGER)), 10100) FROM orders)
    )
  );
END $$;