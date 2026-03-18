import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { useProducts } from '../../../../context/ProductContext';
import { SupplierSelect } from '../../../../components/orders/SupplierSelect';
import { ProfitMarginDisplay } from '../../../../components/ProfitMarginDisplay';
import { formatPrice } from '../../../../utils/priceCalculations';
import type { OrderItem } from '../../../../types/order';

interface OrderItemsProps {
  items: OrderItem[];
  onChange: (items: OrderItem[]) => void;
  errors?: Record<string, string>;
}

export function OrderItems({ items, onChange, errors = {} }: OrderItemsProps) {
  const { products } = useProducts();

  const handleAddItem = () => {
    const newItem: OrderItem = {
      product: { artikelNr: '', name: '', mwst: 'A' },
      quantity: 1,
      ekPrice: 0,
      vkPrice: 0,
      total: 0,
    };
    onChange([...items, newItem]);
  };

  const handleUpdateItem = (index: number, updates: Partial<OrderItem>) => {
    const updatedItems = items.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    );
    onChange(updatedItems);
  };

  const handleProductChange = (index: number, artikelNr: string) => {
    const product = products.find(p => p.artikelNr === artikelNr);
    if (product) {
      handleUpdateItem(index, {
        product: {
          artikelNr: product.artikelNr,
          name: product.name,
          mwst: product.mwst,
          supplierId: product.supplierId,
        },
        ekPrice: product.ekPrice,
        vkPrice: product.vkPrice,
        total: product.vkPrice,
      });
    }
  };

  const handleSupplierChange = (index: number, supplierId: string) => {
    handleUpdateItem(index, {
      product: {
        ...items[index].product,
        supplierId,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Order Items</h3>
        <Button onClick={handleAddItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {items.map((item, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product
              </label>
              <select
                value={item.product.artikelNr || ''}
                onChange={(e) => handleProductChange(index, e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">Select a product</option>
                {products.map(product => (
                  <option key={product.artikelNr} value={product.artikelNr}>
                    {product.name} ({product.artikelNr})
                  </option>
                ))}
              </select>
              {errors[`items.${index}.product`] && (
                <p className="mt-1 text-sm text-red-600">{errors[`items.${index}.product`]}</p>
              )}
            </div>

            <SupplierSelect
              value={item.product.supplierId || ''}
              onChange={(supplierId) => handleSupplierChange(index, supplierId)}
              error={errors[`items.${index}.supplier`]}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => handleUpdateItem(index, { 
                  quantity: parseInt(e.target.value),
                  total: parseInt(e.target.value) * item.vkPrice,
                })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
                required
              />
              {errors[`items.${index}.quantity`] && (
                <p className="mt-1 text-sm text-red-600">{errors[`items.${index}.quantity`]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={item.vkPrice}
                onChange={(e) => handleUpdateItem(index, { 
                  vkPrice: parseFloat(e.target.value),
                  total: item.quantity * parseFloat(e.target.value),
                })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
                required
              />
              {errors[`items.${index}.vkPrice`] && (
                <p className="mt-1 text-sm text-red-600">{errors[`items.${index}.vkPrice`]}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total
              </label>
              <div className="px-3 py-2 border rounded-lg bg-gray-50">
                {formatPrice(item.total || (item.quantity * item.vkPrice))}
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
              onClick={() => {
                const newItems = items.filter((_, i) => i !== index);
                onChange(newItems);
              }}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}