import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Download, Calendar } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { useOrders } from '../context/OrdersContext';

export function OrdersHeader() {
  const navigate = useNavigate();
  const { selectedOrders, filters, setFilters } = useOrders();
  const [showDatePicker, setShowDatePicker] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Orders</h1>
          {selectedOrders.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {selectedOrders.length} orders selected
            </p>
          )}
        </div>
        <Button
          onClick={() => navigate('/dashboard/orders/new')}
          className="whitespace-nowrap"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 sm:mr-2" />
          <span className="hidden sm:inline">Add Order</span>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {selectedOrders.length > 0 && (
          <Button variant="outline" onClick={() => {}} size="sm" className="flex-1 sm:flex-none">
            <Download className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Export Selected</span>
            <span className="sm:hidden">Export</span>
          </Button>
        )}

        <div className="relative flex-1 sm:flex-none">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="w-full"
          >
            <Calendar className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Filter by Date</span>
            <span className="sm:hidden">Date</span>
          </Button>

          {showDatePicker && (
            <div className="absolute right-0 mt-2 p-4 bg-white rounded-lg shadow-lg border border-gray-200 z-10 w-64">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowDatePicker(false)}
                  className="w-full"
                >
                  Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}