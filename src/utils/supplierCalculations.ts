import type { OrderItem } from '../types/order';

export interface SupplierTotals {
  totalEK: number;
  totalVK: number;
  totalQuantity: number;
}

export function calculateSupplierTotals(items: OrderItem[]): SupplierTotals {
  return items.reduce((acc, item) => ({
    totalEK: acc.totalEK + (item.ekPrice * item.quantity),
    totalVK: acc.totalVK + (item.vkPrice * item.quantity),
    totalQuantity: acc.totalQuantity + item.quantity,
  }), { totalEK: 0, totalVK: 0, totalQuantity: 0 });
}