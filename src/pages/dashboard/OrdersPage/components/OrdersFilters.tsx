import React from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import { useOrders } from '../context/OrdersContext';
import { SupplierQuickAccess } from './SupplierQuickAccess';

export function OrdersFilters() {
  const { filters, setFilters } = useOrders();

  return (
    <div className="space-y-4">
      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col gap-3">
          <div className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <div className="relative">
              <Calendar className="hidden sm:block absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                placeholder="From date"
                className="w-full sm:pl-9 pl-3 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>

            <div className="relative">
              <Calendar className="hidden sm:block absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                placeholder="To date"
                className="w-full sm:pl-9 pl-3 pr-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 text-sm"
              />
            </div>

            <button
              onClick={() => setFilters({ search: '', status: '', dateFrom: '', dateTo: '', supplierId: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <SupplierQuickAccess />
    </div>
  );
}