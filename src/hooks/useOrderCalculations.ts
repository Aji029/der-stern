import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { calculateOrderTotals } from '../utils/orderCalculations';
import type { Order, OrderItem } from '../types/order';

export function useOrderCalculations(initialOrder: Order) {
  const [order, setOrder] = useState(initialOrder);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateOrderItem = useCallback(async (itemIndex: number, updates: Partial<OrderItem>) => {
    try {
      setIsUpdating(true);
      setError(null);

      const updatedItems = [...order.items];
      updatedItems[itemIndex] = { ...updatedItems[itemIndex], ...updates };

      const { totalAmount } = calculateOrderTotals(updatedItems);

      const { error: updateError } = await supabase
        .from('orders')
        .update({
          items: updatedItems,
          totalAmount,
          updated_at: new Date(),
        })
        .eq('id', order.id);

      if (updateError) throw updateError;

      setOrder(prev => ({
        ...prev,
        items: updatedItems,
        totalAmount,
      }));
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  }, [order]);

  return {
    order,
    isUpdating,
    error,
    updateOrderItem,
  };
}