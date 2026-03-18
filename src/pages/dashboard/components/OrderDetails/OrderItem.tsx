import React from 'react';
import { Button } from '../../../../components/ui/Button';
import { ProfitMarginDisplay } from '../../../../components/ProfitMarginDisplay';
import { EditablePrice } from '../../../../components/ui/EditablePrice';
import { ProductSearchSelect } from '../../../../components/search/ProductSearchSelect';
import { SupplierSearchSelect } from '../../../../components/search/SupplierSearchSelect';
import { useProducts } from '../../../../context/ProductContext';
import type { OrderItem as OrderItemType } from '../../../../types/order';

interface OrderItemProps {
  item: OrderItemType;
  index: number;
  isEditing: boolean;
  onUpdate: (index: number, updates: Partial<OrderItemType>) => void;
  onRemove: (index: number) => void;
}

export function OrderItem({ item, index, isEditing, onUpdate, onRemove }: OrderItemProps) {
  const { products } = useProducts();

  const handleProductChange = (artikelNr: string) => {
    const product = products.find(p => p.artikelNr === artikelNr);
    if (product) {
      onUpdate(index, {
        product: {
          artikelNr: product.artikelNr,
          name: product.name,
          mwst: product.mwst,
          supplierId: product.supplierId
        },
        ekPrice: product.ekPrice,
        vkPrice: product.vkPrice,
        total: item.quantity * product.vkPrice
      });
    }
  };

  return (
    <div className="border rounded-lg p-4">
      {isEditing ? (
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
            <ProductSearchSelect
              value={item.product.artikelNr}
              onChange={handleProductChange}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <SupplierSearchSelect
              value={item.product.supplierId || ''}
              onChange={(supplierId) => onUpdate(index, {
                product: { ...item.product, supplierId }
              })}
            />
          </div>
        </div>
      ) : (
        <div className="mb-4">
          <div className="font-medium">{item.product.name}</div>
          <div className="text-sm text-gray-500">Art. Nr: {item.product.artikelNr}</div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-500">Quantity</label>
          {isEditing ? (
            <input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => {
                const quantity = parseInt(e.target.value) || 1;
                onUpdate(index, {
                  quantity,
                  total: quantity * item.vkPrice
                });
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
            />
          ) : (
            <div className="mt-1">{item.quantity}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500">EK Price</label>
          {isEditing ? (
            <EditablePrice
              value={item.ekPrice}
              onChange={(value) => onUpdate(index, { ekPrice: value })}
            />
          ) : (
            <div className="mt-1">€{item.ekPrice.toFixed(2)}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500">VK Price</label>
          {isEditing ? (
            <EditablePrice
              value={item.vkPrice}
              onChange={(value) => onUpdate(index, {
                vkPrice: value,
                total: item.quantity * value
              })}
            />
          ) : (
            <div className="mt-1">€{item.vkPrice.toFixed(2)}</div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500">Total</label>
          <div className="mt-1 font-medium">€{(item.quantity * item.vkPrice).toFixed(2)}</div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <ProfitMarginDisplay
          ekPrice={item.ekPrice}
          vkPrice={item.vkPrice}
          mwst={item.product.mwst}
        />
        {isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRemove(index)}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}