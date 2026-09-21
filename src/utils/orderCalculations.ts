import type { OrderItem, OrderDiscount } from '../types/order';

// VK prices are NET (before MwSt). VAT is added on top at the line's rate.
const VAT_RATE = { A: 0.07, B: 0.19 } as const;

const r2 = (n: number) => parseFloat(n.toFixed(2));

export function calculateItemTotal(quantity: number, price: number): number {
  if (!quantity || !price || isNaN(quantity) || isNaN(price)) {
    return 0;
  }
  return r2(quantity * price);
}

// A Gutschrift (credit for a returned item) is a normal line with a NEGATIVE VK
// price. Kept as a line — not a separate object — so every invoice PDF credits it,
// tax included, at the returned item's own rate.
export function isGutschriftLine(item: Pick<OrderItem, 'vkPrice' | 'product'>): boolean {
  return item.vkPrice < 0 || item.product?.name?.startsWith('Gutschrift: ') === true;
}

export function validateOrderItem(item: Partial<OrderItem>): string | null {
  if (!item.quantity || item.quantity <= 0) {
    return 'Quantity must be greater than 0';
  }
  const isCredit = (item.vkPrice ?? 0) < 0;
  if (!isCredit && !item.ekPrice) {
    return 'Purchase price is required';
  }
  if (!item.vkPrice) {
    return 'Selling price is required';
  }
  if (item.vkPrice > 0 && item.vkPrice < (item.ekPrice ?? 0)) {
    return 'Selling price cannot be lower than purchase price (except for discounts)';
  }
  return null;
}

export function calculateOrderTotal(items: OrderItem[] = [], discount?: OrderDiscount): {
  /** Net total of the positive lines only (before any credit). Matches stored orders.total_amount. */
  totalAmount: number;
  /** Net total of ALL lines including credits, floored at 0. Matches stored orders.final_amount. */
  finalAmount: number;
  vatAmountA: number;
  vatAmountB: number;
  nettoA: number;
  nettoB: number;
  brutto: number;
} {
  if (!items?.length) {
    return { totalAmount: 0, finalAmount: 0, vatAmountA: 0, vatAmountB: 0, nettoA: 0, nettoB: 0, brutto: 0 };
  }

  const lineNet = (item: OrderItem) => calculateItemTotal(item.quantity, item.vkPrice);

  // Credit lines are negative, so they reduce the net AND the VAT at their own rate.
  const nettoA = r2(items.filter(i => i.product.mwst === 'A').reduce((s, i) => s + lineNet(i), 0));
  const nettoB = r2(items.filter(i => i.product.mwst === 'B').reduce((s, i) => s + lineNet(i), 0));
  let vatAmountA = r2(nettoA * VAT_RATE.A);
  let vatAmountB = r2(nettoB * VAT_RATE.B);

  const totalAmount = r2(items.filter(i => i.vkPrice > 0).reduce((s, i) => s + lineNet(i), 0));
  let finalAmount = r2(items.reduce((s, i) => s + lineNet(i), 0));

  // Legacy: older orders stored the credit BOTH as a negative line and in this
  // `discount` object. Only apply it here if it is not already a line, otherwise
  // it would be subtracted twice.
  if (discount?.item) {
    const alreadyALine = items.some(
      i => i.vkPrice < 0 && i.product.artikelNr === discount.item.product.artikelNr
    );
    if (!alreadyALine) {
      const creditNet = Math.abs(calculateItemTotal(discount.item.quantity, discount.item.vkPrice));
      finalAmount = r2(finalAmount - creditNet);
      if (discount.item.product.mwst === 'A') vatAmountA = r2(vatAmountA - creditNet * VAT_RATE.A);
      else vatAmountB = r2(vatAmountB - creditNet * VAT_RATE.B);
    }
  }

  finalAmount = Math.max(0, finalAmount);
  vatAmountA = Math.max(0, vatAmountA);
  vatAmountB = Math.max(0, vatAmountB);
  const brutto = r2(finalAmount + vatAmountA + vatAmountB);

  return { totalAmount, finalAmount, vatAmountA, vatAmountB, nettoA, nettoB, brutto };
}
