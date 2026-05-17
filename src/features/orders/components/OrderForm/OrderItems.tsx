import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { ProductSearchInput } from '../../../../components/search/ProductSearchInput';
import { ProfitMarginDisplay } from '../../../../components/ProfitMarginDisplay';
import { EditablePrice } from '../../../../components/ui/EditablePrice';
import { supabase } from '../../../../lib/supabase';
import type { OrderItem } from '../../types';

interface OrderItemsProps {
  items: OrderItem[];
  onChange: (items: OrderItem[]) => void;
  errors?: Record<string, string>;
  customerId?: string;
  customerName?: string;
}

export function OrderItems({ items, onChange, errors = {}, customerId, customerName }: OrderItemsProps) {
  const handleAddProduct = async (product: any, quantity: number = 1) => {
    // Try to apply customer-specific default VK if a customer is selected
    let vkPrice = product.vkPrice;
    if (customerId) {
      try {
        const { data } = await supabase.rpc('get_customer_product_price', {
          p_customer_id: customerId,
          p_product_id: product.artikelNr,
        });
        if (data !== null && data !== undefined) {
          vkPrice = data;
        }
      } catch {
        // Silently fall back to product default
      }
    }

    const newItem: OrderItem = {
      product: {
        artikelNr: product.artikelNr,
        name: product.name,
        mwst: product.mwst,
        supplierId: product.supplierId
      },
      quantity,
      ekPrice: product.ekPrice,
      vkPrice,
      total: quantity * vkPrice
    };
    onChange([...items, newItem]);
  };

  return (
    <div className="space-y-6">
      {/* Product Search */}
      <div className="mb-6">
        <ProductSearchInput
          onSelect={handleAddProduct}
          placeholder="Search to add products..."
          customerId={customerId}
          selectedProducts={items.map(item => item.product.artikelNr)}
        />
      </div>

      {/* Order Items List */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 transition-colors"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-medium text-gray-900">{item.product.name}</h3>
                <p className="text-sm text-gray-500">Art. Nr: {item.product.artikelNr}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newItems = items.filter((_, i) => i !== index);
                  onChange(newItems);
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Remove
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  value={item.quantity || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    const quantity = value ? parseFloat(value) : 0;
                    const newItems = [...items];
                    newItems[index] = {
                      ...item,
                      quantity,
                      total: quantity * item.vkPrice
                    };
                    onChange(newItems);
                  }}
                  placeholder="0"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
                />
                {errors[`items.${index}.quantity`] && (
                  <p className="mt-1 text-sm text-red-600">{errors[`items.${index}.quantity`]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  VK Price
                </label>
                <div className="ring-1 ring-brand-300 rounded-xl">
                  <EditablePrice
                    value={item.vkPrice}
                    onChange={(value) => {
                      const newItems = [...items];
                      newItems[index] = { ...item, vkPrice: value, total: item.quantity * value };
                      onChange(newItems);
                    }}
                    isVK={true}
                    productId={item.product.artikelNr}
                    customerId={customerId}
                    customerName={customerName}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Total
                </label>
                <div className="px-3 py-2 border rounded-lg bg-gray-50 min-h-[42px] flex items-center">
                  {(item.quantity * item.vkPrice).toFixed(2)} €
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <ProfitMarginDisplay
                ekPrice={item.ekPrice}
                vkPrice={item.vkPrice}
                mwst={item.product.mwst}
              />
            </div>
          </div>
        ))}

        {items.length === 0 && (
          <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No items in this order</h3>
            <p className="text-gray-500">Use the search above to add products</p>
          </div>
        )}
      </div>
    </div>
  );
}
