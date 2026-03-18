/*
  # Add RLS Policies for Suppliers
  
  1. Security Changes
    - Enables row level security on suppliers table
    - Adds single policy for all operations
*/

-- Enable RLS
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create a single policy for all operations
CREATE POLICY "suppliers_user_isolation"
ON public.suppliers
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);