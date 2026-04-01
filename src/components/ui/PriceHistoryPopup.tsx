import React from 'react';
import { formatDateForDisplay } from '../../utils/dateFormatting';
import { formatPrice } from '../../utils/priceCalculations';
import { History, User, Tag, Check, Loader2 } from 'lucide-react';

interface PriceHistory {
  vk_price: number;
  order_date: string;
}

interface PriceHistoryPopupProps {
  history: PriceHistory[];
  isOpen: boolean;
  onClose: () => void;
  /** Customer's saved default VK for this product (null = not set yet) */
  customerVK?: number | null;
  /** Whether the customer VK is currently being loaded */
  isCustomerVKLoading?: boolean;
  /** Whether a save operation is in progress */
  isSaving?: boolean;
  /** Product's global default VK */
  productVK?: number;
  /** Customer name shown in the "Customer Default" label */
  customerName?: string;
  /** Called when user clicks "Apply" next to the customer default VK */
  onApplyCustomerVK?: () => void;
  /** Called when user clicks "Save current as default" for this customer */
  onSaveAsCustomerVK?: () => void;
}

export function PriceHistoryPopup({
  history,
  isOpen,
  onClose,
  customerVK,
  isCustomerVKLoading = false,
  isSaving = false,
  productVK,
  customerName,
  onApplyCustomerVK,
  onSaveAsCustomerVK,
}: PriceHistoryPopupProps) {
  if (!isOpen) return null;

  const hasCustomerSection = !!(onApplyCustomerVK || onSaveAsCustomerVK);
  const hasProductVK = productVK !== undefined;

  return (
    <div className="absolute z-50 mt-2 -right-2 bg-white rounded-xl shadow-xl border border-gray-200 p-0 min-w-[260px] overflow-hidden">

      {/* ── Customer Default VK ── */}
      {hasCustomerSection && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-1.5 mb-2">
            <User className="h-3.5 w-3.5 text-blue-500" />
            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
              {customerName ? `${customerName} Default` : 'Customer Default'}
            </span>
          </div>

          {isCustomerVKLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading…
            </div>
          ) : customerVK !== null && customerVK !== undefined ? (
            /* Custom VK is set — show it with Apply button */
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-blue-900 text-base">{formatPrice(customerVK)}</span>
              <div className="flex items-center gap-1.5">
                {onApplyCustomerVK && (
                  <button
                    onClick={onApplyCustomerVK}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg active:scale-95 transition-all"
                  >
                    Apply
                  </button>
                )}
                {onSaveAsCustomerVK && (
                  <button
                    onClick={onSaveAsCustomerVK}
                    disabled={isSaving}
                    className="px-2.5 py-1 text-xs font-semibold text-blue-600 bg-white border border-blue-300 hover:bg-blue-50 rounded-lg active:scale-95 transition-all disabled:opacity-50"
                    title="Save current price as new default for this customer"
                  >
                    {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Update'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* No custom VK yet — show "Save as default" button */
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-blue-500 italic">No custom price set</span>
              {onSaveAsCustomerVK && (
                <button
                  onClick={onSaveAsCustomerVK}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-white border border-blue-300 hover:bg-blue-50 rounded-lg active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSaving
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <><Check className="h-3 w-3" /> Save current</>
                  }
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Product Global Default ── */}
      {hasProductVK && (
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Product Default</span>
          </div>
          <span className="text-sm font-semibold text-gray-700">{formatPrice(productVK!)}</span>
        </div>
      )}

      {/* ── Price History ── */}
      <div className="px-4 py-3">
        <div className="flex items-center text-gray-700 mb-2.5">
          <History className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Order History</span>
        </div>

        {history.length > 0 ? (
          <div className="space-y-1.5">
            {history.map((item, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-gray-500 text-xs">
                  {formatDateForDisplay(item.order_date)}
                </span>
                <span className="font-medium text-gray-800">
                  {formatPrice(item.vk_price)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 text-center py-1">
            No order history yet
          </div>
        )}
      </div>
    </div>
  );
}
