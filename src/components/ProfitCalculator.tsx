import React from 'react';
import { calculateProfitMargin } from '../utils/priceCalculations';

interface ProfitCalculatorProps {
  ekPrice: number;
  vkPrice: number;
  mwst: 'A' | 'B';
}

export function ProfitCalculator({ ekPrice, vkPrice, mwst }: ProfitCalculatorProps) {
  const margin = calculateProfitMargin(ekPrice, vkPrice, mwst);
  
  const getColorClass = (margin: number) => {
    if (margin > 20) return 'text-green-600';
    if (margin > 0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">Profit Margin:</span>
      <span className={`font-medium ${getColorClass(margin)}`}>
        {margin.toFixed(2)}%
      </span>
    </div>
  );
}