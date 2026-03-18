import React from 'react';
import { Search } from 'lucide-react';
import type { ProductFilters } from '../hooks/useProductFilters';

const categories = [
  'All',
  'Backwaren',
  'Getränke',
  'Konserven',
  'Süßwaren',
  'Tiefkühlkost',
];

const stockStatus = [
  'All',
  'In Stock',
  'Low Stock',
  'Out of Stock',
];

interface ProductFiltersProps {
  filters: ProductFilters;
  onFilterChange: (filters: ProductFilters) => void;
}

export function ProductFilters({ filters, onFilterChange }: ProductFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="min-w-[150px]">
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[150px]">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
          >
            {stockStatus.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}