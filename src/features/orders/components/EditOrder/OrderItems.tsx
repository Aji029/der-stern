import React, { useState } from 'react';
import { Check, Package, ChevronDown, ChevronRight } from 'lucide-react';
import { ProductSearchInput } from '../../../../components/search/ProductSearchInput';
import { SupplierSelect } from '../../../../components/orders/SupplierSelect';
import { EditablePrice } from '../../../../components/ui/EditablePrice';
import { ProfitMarginDisplay } from '../../../../components/ProfitMarginDisplay';
import { formatPrice } from '../../../../utils/priceCalculations';
import type { OrderItem, OrderDiscount } from '../../../../types/order';

interface OrderItemsProps {
  items: OrderItem[];
  discount?: OrderDiscount;
  customerId?: string;
  customerName?: string;
  onUpdateItem: (index: number, updates: Partial<OrderItem>) => void;
  onAddItem: (product: any) => void;
  onRemoveItem: (index: number) => void;
  onUpdateDiscount: (discount: OrderDiscount | undefined) => void;
}

export function OrderItems({
  items,
  discount,
  customerId,
  customerName,
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

  const filteredItems = activeTab === 'all' ? items : items;
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
        onUpdateItem(index, { isPacked: true, packedAt: new Date() });
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

        {/* Packing Progress — brand yellow */}
        <div className="mb-3 p-2.5 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-yellow-600" />
              <span className="font-medium text-yellow-900 text-xs sm:text-sm">
                Packing Progress
              </span>
            </div>
            <span className="font-semibold text-yellow-700 text-sm">
              {packedCount}/{totalCount}
            </span>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-1.5">
            <div
              className="bg-yellow-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${totalCount > 0 ? (packedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Tabs — brand colours */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm active:scale-95 ${
              activeTab === 'all'
                ? 'bg-yellow-400 text-gray-900'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All Items ({totalCount})
          </button>
          <button
            onClick={() => setActiveTab('packed')}
            className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all text-sm active:scale-95 ${
              activeTab === 'packed'
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2 px-1">
                <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                  To Pack ({unpackedCount})
                </h3>
                {unpackedCount > 0 && (
                  <button
                    onClick={handlePackAll}
                    className="text-xs font-medium text-yellow-600 hover:text-yellow-700 active:scale-95"
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
                      customerId={customerId}
                      customerName={customerName}
                      onPackToggle={handlePackToggle}
                      onUpdateItem={onUpdateItem}
                      onRemoveItem={onRemoveItem}
                    />
                  );
                })}
              </div>
            </div>

            {packedCount > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowPackedItems(!showPackedItems)}
                  className="flex items-center justify-between w-full mb-2 px-1 py-1 hover:bg-gray-50 rounded transition-colors"
                >
                  <h3 className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                    Packed ({packedCount})
                  </h3>
                  {showPackedItems
                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                    : <ChevronRight className="w-4 h-4 text-gray-400" />
                  }
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
                      customerId={customerId}
                      customerName={customerName}
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
  customerId?: string;
  customerName?: string;
  onPackToggle: (index: number, currentStatus: boolean) => void;
  onUpdateItem: (index: number, updates: Partial<OrderItem>) => void;
  onRemoveItem: (index: number) => void;
}

function OrderItemCard({
  item,
  actualIndex,
  customerId,
  customerName,
  onPackToggle,
  onUpdateItem,
  onRemoveItem,
}: OrderItemCardProps) {
  return (
    <div
      className={`border rounded-lg p-4 transition-all ${
        item.isPacked
          ? 'bg-green-50 border-green-300'
          : 'bg-white border-gray-200'
      }`}
    >
      {/* Header: pack checkbox + product info + supplier (responsive) */}
      <div className="flex items-start gap-2 mb-3">
        {/* 44px touch target pack button */}
        <button
          onClick={() => onPackToggle(actualIndex, item.isPacked || false)}
          className="flex-shrink-0 w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all active:scale-95"
          style={{
            backgroundColor: item.isPacked ? '#22c55e' : 'white',
            borderColor: item.isPacked ? '#22c55e' : '#d1d5db',
          }}
        >
          {item.isPacked && <Check className="w-5 h-5 text-white" />}
        </button>

        {/* Product info + supplier — stacked on mobile, side-by-side on sm+ */}
        <div className="flex-1 min-w-0">
          {/* Top sub-row: product name + badges | supplier (desktop only, pushed right) */}
          <div className="flex items-start justify-between gap-2">
            <div className="pt-1 min-w-0 flex-1">
              <div className="font-medium text-gray-900 text-sm leading-tight">
                {item.product.name}
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500 mt-1">
                <span className="px-1.5 py-0.5 bg-gray-100 rounded font-medium">
                  {item.product.artikelNr}
                </span>
                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">
                  {item.product.mwst === 'A' ? '7%' : '19%'}
                </span>
                {item.isPacked && (
                  <span className="px-1.5 py-0.5 bg-green-600 text-white rounded font-medium text-[10px]">
                    ✓ Packed
                  </span>
                )}
              </div>
            </div>
            {/* Supplier — desktop/tablet only (≥640px), stays top-right */}
            <div className="hidden sm:flex flex-shrink-0 items-center gap-1.5 pt-1">
              <span className="text-[11px] font-medium text-gray-400">Supplier</span>
              <SupplierSelect
                value={item.product.supplierId || ''}
                onChange={(supplierId) =>
                  onUpdateItem(actualIndex, { product: { ...item.product, supplierId } })
                }
                className="text-xs py-1 px-2"
              />
            </div>
          </div>

          {/* Supplier — mobile only (<640px), own row below product info */}
          <div className="sm:hidden mt-2 flex items-center gap-2">
            <span className="text-[11px] font-medium text-gray-400 flex-shrink-0">Supplier</span>
            <SupplierSelect
              value={item.product.supplierId || ''}
              onChange={(supplierId) =>
                onUpdateItem(actualIndex, { product: { ...item.product, supplierId } })
              }
              className="text-xs py-1 px-2 w-full"
            />
          </div>
        </div>
      </div>

      {/* 4-column field row: Quantity | EK Price | VK Price | Total */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        {/* Quantity */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.quantity}
            onChange={(e) => {
              const quantity = parseFloat(e.target.value) || 0;
              onUpdateItem(actualIndex, { quantity, total: quantity * item.vkPrice });
            }}
            className="w-full px-3 py-2.5 text-base font-semibold text-gray-900 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-center min-h-[48px]"
          />
        </div>

        {/* EK Price — de-emphasised */}
        <div>
          <label className="block text-[11px] font-medium text-gray-400 mb-1">EK Price</label>
          <EditablePrice
            value={item.ekPrice}
            onChange={(value) => onUpdateItem(actualIndex, { ekPrice: value })}
          />
        </div>

        {/* VK Price — primary, yellow ring */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">VK Price</label>
          <div className="ring-1 ring-yellow-300 rounded-xl">
            <EditablePrice
              value={item.vkPrice}
              onChange={(value) =>
                onUpdateItem(actualIndex, { vkPrice: value, total: item.quantity * value })
              }
              isVK={true}
              productId={item.product.artikelNr}
              customerId={customerId}
              customerName={customerName}
            />
          </div>
        </div>

        {/* Total — read-only */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Total</label>
          <div className="px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-50 text-sm font-semibold text-gray-800 min-h-[48px] flex items-center">
            {formatPrice(item.total || item.quantity * item.vkPrice)}
          </div>
        </div>
      </div>

      {/* Footer: margin % on left, Remove on right */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <ProfitMarginDisplay
          ekPrice={item.ekPrice}
          vkPrice={item.vkPrice}
          mwst={item.product.mwst}
          showMwst={false}
        />
        <button
          onClick={() => onRemoveItem(actualIndex)}
          className="px-2.5 py-1 bg-red-50 text-red-500 text-xs font-medium rounded-lg hover:bg-red-100 active:scale-95 transition-all border border-red-100"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
