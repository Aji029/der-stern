import { useState, useCallback, useEffect } from 'react';
import type { Order, OrderItem } from '../../../types/order';

export function useOrderState(initialOrder: Order) {
  const [order, setOrder] = useState<Order>(initialOrder);

  // Reset order when initialOrder changes
  useEffect(() => {
    setOrder(initialOrder);
  }, [initialOrder]);

  const updateOrderItem = useCallback((index: number, updates: Partial<OrderItem>) => {
    setOrder(prevOrder => {
      if (index < 0 || index >= prevOrder.items.length) {
        return prevOrder;
      }

      const updatedItems = [...prevOrder.items];
      updatedItems[index] = {
        ...updatedItems[index],
        ...updates,
        product: {
          ...updatedItems[index].product,
          ...(updates.product || {})
        }
      };

      return {
        ...prevOrder,
        items: updatedItems
      };
    });
  }, []);

  const removeOrderItem = useCallback((index: number) => {
    setOrder(prevOrder => ({
      ...prevOrder,
      items: prevOrder.items.filter((_, i) => i !== index)
    }));
  }, []);

  const addOrderItem = useCallback(() => {
    setOrder(prevOrder => ({
      ...prevOrder,
      items: [
        ...prevOrder.items,
        {
          product: { artikelNr: '', name: '', mwst: 'A' },
          quantity: 1,
          ekPrice: 0,
          vkPrice: 0,
          total: 0
        }
      ]
    }));
  }, []);

  return {
    order,
    setOrder,
    updateOrderItem,
    removeOrderItem,
    addOrderItem
  };
}