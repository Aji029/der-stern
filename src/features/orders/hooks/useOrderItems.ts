import { useState, useCallback } from 'react';
import type { OrderItem } from '../../../types/order';
import { validateOrderItem } from '../../../utils/orderCalculations';

export function useOrderItems(initialItems: OrderItem[] = []) {
  const [items, setItems] = useState<OrderItem[]>(initialItems);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateItem = useCallback((index: number, updates: Partial<OrderItem>) => {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      updatedItems[index] = { ...updatedItems[index], ...updates };
      
      // Validate updated item
      const error = validateOrderItem(updatedItems[index]);
      if (error) {
        setErrors(prev => ({ ...prev, [`item-${index}`]: error }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`item-${index}`];
          return newErrors;
        });
      }
      
      return updatedItems;
    });
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prevItems => prevItems.filter((_, i) => i !== index));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`item-${index}`];
      return newErrors;
    });
  }, []);

  const addItem = useCallback((item: OrderItem) => {
    setItems(prevItems => [...prevItems, item]);
  }, []);

  return {
    items,
    errors,
    updateItem,
    removeItem,
    addItem
  };
}