import React from 'react';
import { PlusCircle } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { EditablePrice } from '../../../../components/ui/EditablePrice';
import { ProfitMarginDisplay } from '../../../../components/ProfitMarginDisplay';
import { useProducts } from '../../../../context/ProductContext';
import { formatPrice } from '../../../../utils/priceCalculations';
import type { OrderItem } from '../../types';

interface OrderItemsProps {
  items: OrderItem[];
  onAddItem: () => void;
  onUpdateItem: (index: number, updates: Partial<OrderItem>) => void;
  onRemoveItem: (index: number) => void;
  errors?: Record<string, string>;
}

export function OrderItems({
  items,
  onAddItem,
  onUpdateItem,
  onRemoveItem,
  errors = {},
}: OrderItemsProps) {
  const { products } = useProducts();

  const handleProductChange = (index: number, artikelNr: string) => {
    const product = products.find(p => p.artikelNr === artikelNr);
    if (product) {
      onUpdateItem(index, {
        product: {
          artikelNr: product.artikelNr,
          name: product.name,
          mwst: product.mwst,
        },
        ekPrice: product.ekPrice,
        vkPrice: product.vkPrice,
        total: product.vkPrice,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Order Items</h3>
        <Button onClick={onAddItem}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
            </label>
            <select
              value={item.product.artikelNr || ''}
              onChange={(e) => handleProductChange(index, e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a product</option>
              {products.map(product => (
                <option key={product.artikelNr} value={product.artikelNr}>
                  {product.name} ({product.artikelNr})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => onUpdateItem(index, { 
                  quantity: parseInt(e.target.value),
                  total: parseInt(e.target.value) * item.vkPrice,
                })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                EK Price
              </label>
              <EditablePrice
                value={item.ekPrice}
                onChange={(value) => onUpdateItem(index, { ekPrice: value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VK Price
              </label>
              <EditablePrice
                value={item.vkPrice}
                onChange={(value) => onUpdateItem(index, { 
                  vkPrice: value,
                  total: item.quantity * value,
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total
              </label>
              <div className="px-3 py-2 border rounded-lg bg-gray-50">
                {formatPrice(item.total)}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <ProfitMarginDisplay
              ekPrice={item.ekPrice}
              vkPrice={item.vkPrice}
              mwst={item.product.mwst}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRemoveItem(index)}
              className="text-red-600 hover:text-red-700"
            >
              Remove
            </Button>
          </div>

          {errors[`item-${index}`] && (
            <p className="text-sm text-red-600 mt-1">{errors[`item-${index}`]}</p>
          )}
        </div>
      ))}
    </div>
  );
}