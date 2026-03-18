import React from 'react';
import { Button } from '../../../../components/ui/Button';
import { OrderItem } from './OrderItem';
import type { OrderItem as OrderItemType } from '../../../../types/order';

interface OrderItemsProps {
  items: OrderItemType[];
  isEditing: boolean;
  onAddItem: () => void;
  onUpdateItem: (index: number, updates: Partial<OrderItemType>) => void;
  onRemoveItem: (index: number) => void;
}

export function OrderItems({
  items,
  isEditing,
  onAddItem,
  onUpdateItem,
  onRemoveItem
}: OrderItemsProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Products</h3>
        {isEditing && (
          <Button variant="outline" onClick={onAddItem}>
            Add Product
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <OrderItem
            key={index}
            item={item}
            index={index}
            isEditing={isEditing}
            onUpdate={onUpdateItem}
            onRemove={onRemoveItem}
          />
        ))}
      </div>
    </div>
  );
}