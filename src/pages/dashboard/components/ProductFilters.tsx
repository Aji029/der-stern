import React from 'react';
import { Search } from 'lucide-react';

interface ProductFiltersProps {
  filters: {
    search: string;
    category: string;
    status: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    search: string;
    category: string;
    status: string;
  }>>;
}

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

export function ProductFilters({ filters, setFilters }: ProductFiltersProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="min-w-[150px]">
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
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