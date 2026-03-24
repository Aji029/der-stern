import React, { useState } from 'react';
import { Plus, Check, Package } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { ProductSearchInput } from '../../../../components/search/ProductSearchInput';
import { SupplierSelect } from '../../../../components/orders/SupplierSelect';
import { EditablePrice } from '../../../../components/ui/EditablePrice';
import { ProfitMarginDisplay } from '../../../../components/ProfitMarginDisplay';
import { formatPrice } from '../../../../utils/priceCalculations';
import type { OrderItem, OrderDiscount } from '../../../../types/order';

interface OrderItemsProps {
  items: OrderItem[];
  discount?: OrderDiscount;
  onUpdateItem: (index: number, updates: Partial<OrderItem>) => void;
  onAddItem: (product: any) => void;
  onRemoveItem: (index: number) => void;
  onUpdateDiscount: (discount: OrderDiscount | undefined) => void;
}

export function OrderItems({
  items,
  discount,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onUpdateDiscount,
}: OrderItemsProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'packed'>('all');
  const [showPackedItems, setShowPackedItems] = useState(true);

  const packedCount = items.filter(item => item.isPacked).length;
  const unpackedCount = items.length - packedCount;
  const totalCount = items.length;

  const filteredItems = activeTab === 'all'
    ? items
    : items;

  const unpackedItems = items.filter(item => !item.isPacked);
  const packedItems = items.filter(item => item.isPacked);

  const handlePackToggle = (index: number, currentStatus: boolean) => {
    onUpdateItem(index, {
      isPacked: !currentStatus,
      packedAt: !currentStatus ? new Date() : undefined,
    });
  };

  const handlePackAll = () => {
    items.forEach((item, index) => {
      if (!item.isPacked) {
        onUpdateItem(index, {
          isPacked: true,
          packedAt: new Date(),
        });
      }
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-3 sm:p-4">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Order Items</h2>

        <div className="mb-4">
          <ProductSearchInput
            onSelect={onAddItem}
            placeholder="Search to add products..."
            selectedProducts={items.map(item => item.product.artikelNr)}
          />
        </div>

        {/* Progress Indicator - Simplified */}
        <div className="mb-3 p-2.5 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-green-700" />
              <span className="font-medium text-green-900 text-xs sm:text-sm">
                Packing Progress
              </span>
            </div>
            <span className="font-semibold text-green-700 text-sm">
              {packedCount}/{totalCount}
            </span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-1.5">
            <div
              className="bg-green-600 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (packedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Mobile-Friendly Tabs */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm active:scale-95 ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Items ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('packed')}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm active:scale-95 ${
              activeTab === 'packed'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            To Pack ({unpackedCount})
          </button>
        </div>
      </div>

      {/* Order Items List */}
      <div className="space-y-2 px-3 sm:px-4 pb-4">
        {activeTab === 'packed' && unpackedCount > 0 && (
          <>
            {/* Unpacked Items Section */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-semibold text-orange-700 uppercase">
                  To Pack ({unpackedCount})
                </h3>
                {unpackedCount > 0 && (
                  <button
                    onClick={handlePackAll}
                    className="text-xs font-medium text-orange-600 hover:text-orange-700 active:scale-95"
                  >
                    Pack All
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {unpackedItems.map((item) => {
                  const actualIndex = items.findIndex(i => i === item);
                  return (
                    <OrderItemCard
                      key={actualIndex}
                      item={item}
                      actualIndex={actualIndex}
                      onPackToggle={handlePackToggle}
                      onUpdateItem={onUpdateItem}
                      onRemoveItem={onRemoveItem}
                    />
                  );
                })}
              </div>
            </div>

            {/* Packed Items Section - Collapsible */}
            {packedCount > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowPackedItems(!showPackedItems)}
                  className="flex items-center justify-between w-full mb-2 px-1 py-1 hover:bg-gray-50 rounded transition-colors"
                >
                  <h3 className="text-xs font-semibold text-green-700 uppercase">
                    Packed ({packedCount})
                  </h3>
                  <span className="text-xs text-gray-500">
                    {showPackedItems ? '▼' : '▶'}
                  </span>
                </button>
                {showPackedItems && (
                  <div className="space-y-2">
                    {packedItems.map((item) => {
                      const actualIndex = items.findIndex(i => i === item);
                      return (
                        <OrderItemCard
                          key={actualIndex}
                          item={item}
                          actualIndex={actualIndex}
                          onPackToggle={handlePackToggle}
                          onUpdateItem={onUpdateItem}
                          onRemoveItem={onRemoveItem}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'all' && (
          <>
            {filteredItems.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                No items in order
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item, index) => {
                  const actualIndex = items.findIndex(i => i === item);
                  return (
                    <OrderItemCard
                      key={actualIndex}
                      item={item}
                      actualIndex={actualIndex}
                      onPackToggle={handlePackToggle}
                      onUpdateItem={onUpdateItem}
                      onRemoveItem={onRemoveItem}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === 'packed' && unpackedCount === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            All items are packed!
          </div>
        )}
      </div>
    </div>
  );
}

interface OrderItemCardProps {
  item: OrderItem;
  actualIndex: number;
  onPackToggle: (index: number, currentStatus: boolean) => void;
  onUpdateItem: (index: number, updates: Partial<OrderItem>) => void;
  onRemoveItem: (index: number) => void;
}

function OrderItemCard({
  item,
  actualIndex,
  onPackToggle,
  onUpdateItem,
  onRemoveItem,
}: OrderItemCardProps) {
  return (
    <div
      className={`border rounded-lg p-3 transition-all ${
        item.isPacked
          ? 'bg-green-50 border-green-300'
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Checkbox and Product Name - Compact */}
      <div className="flex items-start gap-2 mb-3">
        <button
          onClick={() => onPackToggle(actualIndex, item.isPacked || false)}
          className="flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-all active:scale-95"
          style={{
            backgroundColor: item.isPacked ? '#22c55e' : 'white',
            borderColor: item.isPacked ? '#22c55e' : '#d1d5db',
          }}
        >
          {item.isPacked && <Check className="w-4 h-4 text-white" />}
        </button>

        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 mb-1 text-sm">{item.product.name}</div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-600">
            <span className="px-1.5 py-0.5 bg-gray-100 rounded font-medium">
              {item.product.artikelNr}
            </span>
            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
              {item.product.mwst === 'A' ? '7%' : '19%'}
            </span>
            {item.isPacked && (
              <span className="px-1.5 py-0.5 bg-green-600 text-white rounded font-medium">
                ✓
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Supplier — compact inline row */}
      <div className="flex items-center gap-2 mb-3">
        <label className="text-xs font-medium text-gray-400 w-14 flex-shrink-0">
          Supplier
        </label>
        <div className="flex-1">
          <SupplierSelect
            value={item.product.supplierId || ''}
            onChange={(supplierId) => {
              onUpdateItem(actualIndex, {
                product: { ...item.product, supplierId }
              });
            }}
          />
        </div>
      </div>

      {/* Qty · EK · VK — flex row: qty fixed-width, ek/vk share remaining space */}
      <div className="flex items-start gap-2 mb-3">
        {/* Qty — compact fixed width, big centered number */}
        <div className="w-20 flex-shrink-0">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Qty
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.quantity}
            onChange={(e) => {
              const quantity = parseFloat(e.target.value) || 0;
              onUpdateItem(actualIndex, {
                quantity,
                total: quantity * item.vkPrice,
              });
            }}
            className="w-full px-2 py-2 text-base font-semibold text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
          />
        </div>

        {/* EK — fills half the remaining space */}
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-400 mb-1">
            EK
          </label>
          <EditablePrice
            value={item.ekPrice}
            onChange={(value) => onUpdateItem(actualIndex, { ekPrice: value })}
          />
        </div>

        {/* VK — fills half the remaining space, highlighted */}
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            VK
          </label>
          <div className="ring-1 ring-yellow-300 rounded-lg">
            <EditablePrice
              value={item.vkPrice}
              onChange={(value) => onUpdateItem(actualIndex, {
                vkPrice: value,
                total: item.quantity * value,
              })}
            />
          </div>
        </div>
      </div>

      {/* Profit and Total - Compact */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <ProfitMarginDisplay
            ekPrice={item.ekPrice}
            vkPrice={item.vkPrice}
            mwst={item.product.mwst}
            showMwst={false}
          />
          <span className="text-sm font-semibold text-gray-900">
            {formatPrice(item.total || (item.quantity * item.vkPrice))}
          </span>
        </div>
        <button
          onClick={() => onRemoveItem(actualIndex)}
          className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-medium rounded-lg hover:bg-red-100 active:scale-95 transition-all border border-red-200"
        >
          Remove
        </button>
      </div>
    </div>
  );
}