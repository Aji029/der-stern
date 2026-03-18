import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { EditablePrice } from '../../../../components/ui/EditablePrice';
import { ProfitMarginDisplay } from '../../../../components/ProfitMarginDisplay';
import { ProductSearchInput } from '../../../../components/search/ProductSearchInput';
import { SupplierSelect } from '../../../../components/orders/SupplierSelect';
import { MwstSelect } from '../../../../components/MwstSelect';
import { formatPrice } from '../../../../utils/priceCalculations';
import type { OrderItem } from '../../../../types/order';

interface OrderItemsProps {
  items: OrderItem[];
  onUpdateItem: (index: number, updates: Partial<OrderItem>) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
}

export function OrderItems({
  items,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
}: OrderItemsProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Order Items</h2>
        <div className="flex items-center space-x-4">
          <div className="w-64">
            <ProductSearchInput
              onSelect={(product) => {
                const newItem: OrderItem = {
                  product: {
                    artikelNr: product.artikelNr,
                    name: product.name,
                    mwst: product.mwst,
                    supplierId: product.supplierId,
                  },
                  quantity: 1,
                  ekPrice: product.ekPrice,
                  vkPrice: product.vkPrice,
                  total: product.vkPrice,
                };
                onAddItem();
                onUpdateItem(items.length, newItem);
              }}
              placeholder="Search to add product..."
            />
          </div>
          <Button onClick={onAddItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="font-medium">{item.product.name}</div>
                <div className="text-sm text-gray-500">Art. Nr: {item.product.artikelNr}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier
                </label>
                <SupplierSelect
                  value={item.product.supplierId || ''}
                  onChange={(supplierId) => {
                    onUpdateItem(index, {
                      product: { ...item.product, supplierId }
                    });
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MwSt
                </label>
                <MwstSelect
                  value={item.product.mwst}
                  onChange={(mwst) => {
                    onUpdateItem(index, {
                      product: { ...item.product, mwst }
                    });
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.quantity}
                  onChange={(e) => {
                    const quantity = parseFloat(e.target.value) || 0;
                    onUpdateItem(index, {
                      quantity,
                      total: quantity * item.vkPrice,
                    });
                  }}
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
            </div>

            <div className="flex justify-between items-center">
              <ProfitMarginDisplay
                ekPrice={item.ekPrice}
                vkPrice={item.vkPrice}
                mwst={item.product.mwst}
              />
              <div className="flex items-center space-x-4">
                <div className="text-sm font-medium">
                  Total: {formatPrice(item.total || (item.quantity * item.vkPrice))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveItem(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}