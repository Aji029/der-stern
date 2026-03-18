import { useState, useCallback } from 'react';
import type { Order, OrderItem } from '../../../types/order';
import { validateOrderItem } from '../../../utils/orderCalculations';

export function useOrderValidation() {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateOrder = useCallback((order: Order): boolean => {
    const errors: Record<string, string> = {};

    if (!order.items?.length) {
      errors.items = 'Order must have at least one item';
    }

    order.items?.forEach((item, index) => {
      const itemError = validateOrderItem(item);
      if (itemError) {
        errors[`item-${index}`] = itemError;
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, []);

  return {
    validationErrors,
    validateOrder,
    setValidationErrors
  };
}