import type { OrderItem, OrderDiscount } from '../types/order';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateGutschrift(
  items: OrderItem[],
  product: any,
  existingDiscount?: OrderDiscount
): ValidationResult {
  // Don't allow multiple discounts
  if (existingDiscount) {
    return {
      isValid: false,
      error: 'An existing Gutschrift is already applied to this order'
    };
  }

  // Ensure discount is not negative or zero
  if (product.vkPrice <= 0) {
    return {
      isValid: false,
      error: 'Gutschrift amount must be greater than 0'
    };
  }

  return { isValid: true };
}