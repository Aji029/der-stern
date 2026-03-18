import type { OrderItem, OrderDiscount } from '../types/order';

export function calculateItemTotal(quantity: number, price: number): number {
  if (!quantity || !price || isNaN(quantity) || isNaN(price)) {
    return 0;
  }
  return parseFloat((quantity * price).toFixed(2));
}

export function validateOrderItem(item: Partial<OrderItem>): string | null {
  if (!item.quantity || item.quantity <= 0) {
    return 'Quantity must be greater than 0';
  }
  if (!item.ekPrice) {
    return 'Purchase price is required';
  }
  if (!item.vkPrice) {
    return 'Selling price is required';
  }
  // Allow negative VK price for discount items
  if (item.vkPrice > 0 && item.vkPrice < item.ekPrice) {
    return 'Selling price cannot be lower than purchase price (except for discounts)';
  }
  return null;
}

export function calculateOrderTotal(items: OrderItem[] = [], discount?: OrderDiscount): {
  totalAmount: number;
  finalAmount: number;
  vatAmountA: number;
  vatAmountB: number;
} {
  if (!items?.length) {
    return { 
      totalAmount: 0, 
      finalAmount: 0,
      vatAmountA: 0,
      vatAmountB: 0
    };
  }
  
  // Calculate regular items total (excluding discount items)
  const regularItems = items.filter(item => item.vkPrice > 0);
  const totalAmount = regularItems.reduce((sum, item) => {
    const itemTotal = calculateItemTotal(item.quantity, item.vkPrice);
    return parseFloat((sum + itemTotal).toFixed(2));
  }, 0);

  // Calculate VAT amounts
  const vatAmountA = regularItems
    .filter(item => item.product.mwst === 'A')
    .reduce((sum, item) => {
      const itemTotal = calculateItemTotal(item.quantity, item.vkPrice);
      const vatAmount = itemTotal - (itemTotal / 1.07);
      return parseFloat((sum + vatAmount).toFixed(2));
    }, 0);

  const vatAmountB = regularItems
    .filter(item => item.product.mwst === 'B')
    .reduce((sum, item) => {
      const itemTotal = calculateItemTotal(item.quantity, item.vkPrice);
      const vatAmount = itemTotal - (itemTotal / 1.19);
      return parseFloat((sum + vatAmount).toFixed(2));
    }, 0);

  // Calculate discount amount
  let discountAmount = 0;
  if (discount?.item) {
    // For discount items, the vkPrice is already negative
    discountAmount = Math.abs(calculateItemTotal(discount.item.quantity, discount.item.vkPrice));
  }

  const finalAmount = Math.max(0, parseFloat((totalAmount - discountAmount).toFixed(2)));

  return {
    totalAmount,
    finalAmount,
    vatAmountA,
    vatAmountB
  };
}