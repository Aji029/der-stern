/*
  # Add Performance Index for Orders Status Column

  1. Changes
    - Add index on orders.status column for fast filtering
    - This enables efficient queries when filtering by order status
    
  2. Performance Impact
    - Dramatically speeds up status-based filtering
    - Supports efficient pagination with status filters
    - Minimal storage overhead
*/

-- Add index on status column for fast filtering
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Add composite index for status + order_date for combined filtering
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, order_date DESC);