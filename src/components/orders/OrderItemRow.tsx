import React from 'react';
import { EditablePrice } from '../ui/EditablePrice';
import { ProfitMarginDisplay } from '../ProfitMarginDisplay';
import { calculateItemTotal, calculateMarginPercentage, validateOrderItem } from '../../utils/orderCalculations';
import type { OrderItem } from '../../types/order';

interface OrderItemRowProps {
  item: OrderItem;
  onUpdate: (updates: Partial<OrderItem>) => void;
  onRemove: () => void;
}

export function OrderItemRow({ item, onUpdate, onRemove }: OrderItemRowProps) {
  const handleUpdate = (field: keyof OrderItem, value: any) => {
    const updates = { ...item, [field]: value };
    const error = validateOrderItem(updates);
    
    if (!error) {
      onUpdate({
        ...updates,
        total: calculateItemTotal(updates.quantity, updates.vkPrice),
      });
    }
  };

  return (
    <div className="flex items-center space-x-4 p-4 border-b">
      <div className="flex-1">
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={item.quantity}
          onChange={(e) => handleUpdate('quantity', parseFloat(e.target.value))}
          className="w-20 px-2 py-1 border rounded"
        />
      </div>
      
      <div className="flex-1">
        <EditablePrice
          value={item.ekPrice}
          onChange={(value) => handleUpdate('ekPrice', value)}
          label="EK Price"
        />
      </div>
      
      <div className="flex-1">
        <EditablePrice
          value={item.vkPrice}
          onChange={(value) => handleUpdate('vkPrice', value)}
          label="VK Price"
        />
      </div>
      
      <div className="flex-1">
        <ProfitMarginDisplay
          ekPrice={item.ekPrice}
          vkPrice={item.vkPrice}
          mwst={item.product.mwst}
        />
      </div>
      
      <div className="flex-1 text-right">
        {calculateItemTotal(item.quantity, item.vkPrice).toFixed(2)} €
      </div>
      
      <button
        onClick={onRemove}
        className="text-red-600 hover:text-red-800"
      >
        Remove
      </button>
    </div>
  );
}