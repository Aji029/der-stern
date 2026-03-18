import { useState } from 'react';
import { updateOrder } from '../lib/db/orders';
import { calculateOrderTotals } from '../utils/orderCalculations';
import type { Order } from '../types/order';

export function useOrderUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOrderUpdate = async (id: string, order: Order) => {
    try {
      setIsUpdating(true);
      setError(null);

      // Validate and calculate totals
      const { totalAmount } = calculateOrderTotals(order.items);
      if (typeof totalAmount !== 'number' || isNaN(totalAmount)) {
        throw new Error('Invalid order total');
      }

      // Update order with validated total
      await updateOrder(id, {
        ...order,
        totalAmount,
        updated_at: new Date()
      });

    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    isUpdating,
    error,
    handleOrderUpdate
  };
}