import { useState, useCallback, useEffect } from 'react';
import type { OrderItem } from '../../../types/order';
import { validateOrderItem } from '../../../utils/orderCalculations';

export function useOrderItemsWithSupplier(initialItems: OrderItem[] = []) {
  const [items, setItems] = useState<OrderItem[]>(initialItems);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset items when initialItems change
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const updateItem = useCallback((index: number, updates: Partial<OrderItem>) => {
    setItems(prevItems => {
      const updatedItems = [...prevItems];
      // Preserve supplier information when updating item
      const currentItem = updatedItems[index];
      updatedItems[index] = {
        ...currentItem,
        ...updates,
        product: {
          ...currentItem.product,
          ...updates.product,
          // Ensure supplier ID is preserved
          supplierId: updates.product?.supplierId || currentItem.product.supplierId,
        }
      };
      
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

  const addItem = useCallback((newItem: OrderItem) => {
    // Validate new item before adding
    const error = validateOrderItem(newItem);
    if (error) {
      setErrors(prev => ({ ...prev, 'new-item': error }));
      return false;
    }
    
    setItems(prevItems => [...prevItems, newItem]);
    return true;
  }, []);

  return {
    items,
    errors,
    updateItem,
    removeItem,
    addItem,
    setItems, // Expose setItems for direct updates when needed
  };
}