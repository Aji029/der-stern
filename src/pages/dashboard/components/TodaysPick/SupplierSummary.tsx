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
  const margin = totals.totalEK > 0
    ? ((totals.totalVK - totals.totalEK) / totals.totalEK * 100)
    : 0;

  return (
    <>
      {/* ── Mobile: compact single-line row ─────────────────────────────── */}
      <div className="sm:hidden flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
        <span>
          <span className="font-semibold text-gray-800">{totals.totalQuantity.toFixed(2)}</span> items
        </span>
        <span className="text-gray-300">·</span>
        <span>EK <span className="font-semibold text-gray-800">{formatPrice(totals.totalEK)}</span></span>
        <span className="text-gray-300">·</span>
        <span>VK <span className="font-semibold text-gray-800">{formatPrice(totals.totalVK)}</span></span>
        <span className="text-gray-300">·</span>
        <span className="font-semibold text-green-600">{margin.toFixed(2)}%</span>
      </div>

      {/* ── Desktop / iPad: 4-box grid (unchanged) ──────────────────────── */}
      <div className={`hidden sm:block ${className}`}>
        <p className="font-semibold text-sm md:text-base mb-3">{title}</p>
        <div className="grid grid-cols-4 gap-4">
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
            <p className="text-lg font-bold text-green-600">{margin.toFixed(2)}%</p>
          </div>
        </div>
      </div>
    </>
  );
}
