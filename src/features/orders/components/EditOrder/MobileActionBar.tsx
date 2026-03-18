import React from 'react';
import { Save, X } from 'lucide-react';
import { formatPrice } from '../../../../utils/priceCalculations';
import type { OrderItem } from '../../../../types/order';

interface MobileActionBarProps {
  items: OrderItem[];
  onSave: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function MobileActionBar({ items, onSave, onCancel, isSubmitting }: MobileActionBarProps) {
  const total = items.reduce((sum, item) => sum + (item.total || item.quantity * item.vkPrice), 0);
  const packedCount = items.filter(item => item.isPacked).length;
  const totalCount = items.length;
  const progress = totalCount > 0 ? (packedCount / totalCount) * 100 : 0;

  return (
    <>
      {/* Spacer to prevent content from being hidden under the fixed bar */}
      <div className="h-20 md:hidden" />

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50 safe-bottom">
        <div className="px-3 py-2.5">
          {/* Progress and Total Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium text-gray-600">
                <span className="text-green-600 font-semibold">{packedCount}/{totalCount}</span>
              </div>
              <div className="w-16 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div className="text-base font-bold text-gray-900">
              {formatPrice(total)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={isSubmitting}
              className="flex-[2] flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
