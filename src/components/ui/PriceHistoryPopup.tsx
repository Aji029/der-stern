import React from 'react';
import { formatDateForDisplay } from '../../utils/dateFormatting';
import { formatPrice } from '../../utils/priceCalculations';
import { History } from 'lucide-react';

interface PriceHistory {
  vk_price: number;
  order_date: string;
}

interface PriceHistoryPopupProps {
  history: PriceHistory[];
  isOpen: boolean;
  onClose: () => void;
}

export function PriceHistoryPopup({ history, isOpen, onClose }: PriceHistoryPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute z-50 mt-2 -right-2 bg-white rounded-lg shadow-lg border border-gray-200 p-4 min-w-[250px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-gray-700">
          <History className="h-4 w-4 mr-2" />
          <span className="font-medium">Price History</span>
        </div>
      </div>
      
      {history.length > 0 ? (
        <div className="space-y-2">
          {history.map((item, index) => (
            <div 
              key={index}
              className="flex justify-between items-center text-sm"
            >
              <span className="text-gray-600">
                {formatDateForDisplay(item.order_date)}
              </span>
              <span className="font-medium">
                {formatPrice(item.vk_price)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500 text-center py-2">
          No price history available
        </div>
      )}
    </div>
  );
}