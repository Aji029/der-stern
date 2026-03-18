import React from 'react';
import { Search } from 'lucide-react';
import type { OrderFilters } from '../../../features/orders/hooks/useOrderFilters';
import { formatDateForInput } from '../../../utils/dateFormatting';

interface OrderFiltersProps {
  filters: OrderFilters;
  onFilterChange: (filters: OrderFilters) => void;
}

export function OrderFilters({ filters, onFilterChange }: OrderFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order ID, customer name..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="min-w-[150px]">
          <input
            type="date"
            value={filters.date}
            onChange={(e) => onFilterChange({ ...filters, date: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}