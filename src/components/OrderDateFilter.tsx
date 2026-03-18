import React from 'react';
import { Calendar, X } from 'lucide-react';
import { formatDateForDisplay, formatDateForInput } from '../utils/dateFormatting';

interface OrderDateFilterProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  onClear: () => void;
}

export function OrderDateFilter({
  selectedDate,
  onDateChange,
  onClear
}: OrderDateFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">Filter by Date:</span>
      </div>
      
      <div className="flex items-center gap-4 flex-1">
        <div className="relative flex-1">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 transition-colors"
            max={formatDateForInput(new Date())}
          />
        </div>

        {selectedDate && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">
              Showing orders for: {formatDateForDisplay(selectedDate)}
            </span>
            <button
              onClick={onClear}
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
              title="Clear filter"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}