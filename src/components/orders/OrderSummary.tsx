import React from 'react';
import { calculateOrderTotal } from '../../utils/orderCalculations';
import { formatPrice } from '../../utils/priceCalculations';
import type { OrderItem, OrderDiscount } from '../../types/order';

interface OrderSummaryProps {
  items: OrderItem[];
  discount?: OrderDiscount;
}

export function OrderSummary({ items, discount }: OrderSummaryProps) {
  const { 
    subtotal, 
    discountAmount, 
    finalAmount,
    vatAmountA,
    vatAmountB
  } = calculateOrderTotal(items, discount);
  
  const totalItems = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg mt-4">
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Items:</span>
          <span className="font-medium">{totalItems}</span>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal (excl. VAT):</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>

        {vatAmountA > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">VAT 7% (A):</span>
            <span className="font-medium">{formatPrice(vatAmountA)}</span>
          </div>
        )}

        {vatAmountB > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">VAT 19% (B):</span>
            <span className="font-medium">{formatPrice(vatAmountB)}</span>
          </div>
        )}

        {discount && (
          <div className="flex justify-between text-sm text-red-600">
            <span>Gutschrift:</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-base font-semibold pt-2 border-t">
          <span>Final Amount (incl. VAT):</span>
          <span>{formatPrice(finalAmount)}</span>
        </div>
      </div>
    </div>
  );
}