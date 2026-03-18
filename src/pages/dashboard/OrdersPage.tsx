import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Calendar, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { OrderList } from '../../components/OrderList';
import { BackButton } from '../../components/navigation/BackButton';
import { OrderDateFilter } from '../../components/OrderDateFilter';
import { MonthlyInvoiceGenerator } from '../../components/MonthlyInvoiceGenerator';
import { StatusTabs, type OrderStatusFilter } from '../../components/orders/StatusTabs';
import { useOrdersWithPagination } from '../../hooks/useOrdersWithPagination';
import { useOrderDateFilter } from '../../hooks/useOrderDateFilter';

export function OrdersPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [showMonthlyGenerator, setShowMonthlyGenerator] = useState(false);

  const statusFromUrl = (searchParams.get('status') as OrderStatusFilter) || 'pending';
  const [activeTab, setActiveTab] = useState<OrderStatusFilter>(statusFromUrl);

  const pageSize = activeTab === 'pending' ? 7 : 10;

  const {
    orders,
    totalPages,
    isLoading,
    error,
    totalCount,
    pendingCount,
    completedCount,
    fetchOrders
  } = useOrdersWithPagination(pageSize);

  const {
    selectedDate,
    setSelectedDate,
    clearDate,
    hasFilter
  } = useOrderDateFilter();

  // Memoize the fetch function to prevent unnecessary re-renders
  const loadOrders = useCallback(() => {
    fetchOrders(page, selectedDate, activeTab);
  }, [fetchOrders, page, selectedDate, activeTab]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  const handleTabChange = (tab: OrderStatusFilter) => {
    setActiveTab(tab);
    setPage(1);
    setSearchParams({ status: tab });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setPage(1);
  };

  const handleClearDate = () => {
    clearDate();
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="w-full sm:w-auto">
          <BackButton to="/dashboard" label="Back to Dashboard" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">Orders</h1>
          {hasFilter && (
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Showing filtered orders
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            className="hidden sm:flex"
            onClick={() => setShowMonthlyGenerator(!showMonthlyGenerator)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Monatsrechnungen
          </Button>
          <Button onClick={() => navigate('/dashboard/orders/new')} className="flex-1 sm:flex-none">
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Create Order</span>
          </Button>
        </div>
      </div>

      {showMonthlyGenerator && (
        <MonthlyInvoiceGenerator />
      )}

      <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
          <div className="flex-1 w-full">
            <OrderDateFilter
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
              onClear={handleClearDate}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="sm:hidden w-full"
            onClick={() => setShowMonthlyGenerator(!showMonthlyGenerator)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Monatsrechnungen
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <StatusTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          counts={{
            pending: pendingCount,
            completed: completedCount,
            all: totalCount,
          }}
        />

        <OrderList
          orders={orders}
          isLoading={isLoading}
          error={error}
          statusFilter={activeTab}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-gray-200 px-4 py-3 sm:px-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-700">
                Page <span className="font-medium">{page}</span> of{' '}
                <span className="font-medium">{totalPages}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1 || isLoading}
                  className="rounded-full w-8 h-8 p-0 flex items-center justify-center"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="hidden sm:flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                    .map((p, i, arr) => (
                      <React.Fragment key={p}>
                        {i > 0 && arr[i - 1] !== p - 1 && (
                          <span className="px-2 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(p)}
                          disabled={isLoading}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            p === page
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-500 hover:bg-gray-50'
                          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {p}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages || isLoading}
                  className="rounded-full w-8 h-8 p-0 flex items-center justify-center"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}