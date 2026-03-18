import type { OrderFormData, OrderItem } from '../types';

export function validateOrderForm(data: OrderFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.customerId) {
    errors.customerId = 'Please select a customer';
  }

  if (data.items.length === 0) {
    errors.items = 'Please add at least one item';
  }

  data.items.forEach((item, index) => {
    const itemErrors = validateOrderItem(item);
    if (itemErrors) {
      errors[`items.${index}`] = itemErrors;
    }
  });

  return errors;
}

export function validateOrderItem(item: OrderItem): string | null {
  if (!item.product.artikelNr) {
    return 'Please select a product';
  }

  if (!item.quantity || item.quantity <= 0) {
    return 'Quantity must be greater than 0';
  }

  if (!item.vkPrice || item.vkPrice <= 0) {
    return 'Selling price must be greater than 0';
  }

  if (!item.ekPrice || item.ekPrice <= 0) {
    return 'Purchase price must be greater than 0';
  }

  if (item.vkPrice < item.ekPrice) {
    return 'Selling price cannot be less than purchase price';
  }

  return null;
}