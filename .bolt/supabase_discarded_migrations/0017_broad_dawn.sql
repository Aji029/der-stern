/*
  # Add Order Date Tracking

  1. Changes
    - Add selected_date column to orders table
    - Add date_filter_active boolean column
    - Add indexes for date filtering performance

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns for date tracking
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS selected_date DATE,
  ADD COLUMN IF NOT EXISTS date_filter_active BOOLEAN DEFAULT false;

-- Add index for date filtering
CREATE INDEX IF NOT EXISTS idx_orders_selected_date ON public.orders(selected_date);
CREATE INDEX IF NOT EXISTS idx_orders_date_filter ON public.orders(date_filter_active);