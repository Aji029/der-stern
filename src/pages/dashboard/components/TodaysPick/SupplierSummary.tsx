import React from 'react';
import { formatPrice } from '../../../../utils/priceCalculations';

interface SupplierTotals {
  totalEK: number;
  totalVK: number;
  totalQuantity: number;
}

interface SupplierSummaryProps {
  totals: SupplierTotals;
  title?: string;
  className?: string;
}

export function SupplierSummary({ totals, title = "Supplier Summary:", className = "" }: SupplierSummaryProps) {
  // Guard against division by zero when totalEK is 0 (e.g. products with no EK price)
  const margin = totals.totalEK > 0
    ? ((totals.totalVK - totals.totalEK) / totals.totalEK * 100).toFixed(2)
    : '0.00';

  return (
    <div className={`${className}`}>
      <p className="font-semibold text-sm md:text-base mb-3">{title}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Total Items</p>
          <p className="text-lg font-bold text-gray-900">{totals.totalQuantity.toFixed(2)}</p>
        </div>
        <div className="bg-white p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Total EK</p>
          <p className="text-lg font-bold text-gray-900">{formatPrice(totals.totalEK)}</p>
        </div>
        <div className="bg-white p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Total VK</p>
          <p className="text-lg font-bold text-gray-900">{formatPrice(totals.totalVK)}</p>
        </div>
        <div className="bg-white p-3 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Margin</p>
          <p className="text-lg font-bold text-green-600">{margin}%</p>
        </div>
      </div>
    </div>
  );
}