import React, { useState, useMemo } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { TodaysPickList } from './components/TodaysPick/TodaysPickList';
import { useTodaysPick } from './hooks/useTodaysPick';
import { usePickedItems } from './hooks/usePickedItems';
import { useSuppliers } from '../../context/SupplierContext';
import { formatDateForInput } from '../../utils/dateFormatting';

export function TodaysPickPage() {
  const today = formatDateForInput(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const { groupedOrders, isLoading, error } = useTodaysPick(selectedDate);
  const { suppliers } = useSuppliers();
  const { pickedItems, toggleItem, markAllForSupplier, unmarkAllForSupplier, clearAll } =
    usePickedItems(selectedDate);

  const filteredOrders = useMemo(() => {
    if (selectedSuppliers.length === 0) {
      return groupedOrders;
    }
    return groupedOrders.filter(order => selectedSuppliers.includes(order.supplierId));
  }, [groupedOrders, selectedSuppliers]);

  const toggleSupplier = (supplierId: string) => {
    // Single-select: clicking a supplier shows only that one.
    // Clicking the same supplier again deselects → back to "All".
    setSelectedSuppliers(prev =>
      prev.length === 1 && prev[0] === supplierId ? [] : [supplierId]
    );
  };

  const selectAllSuppliers = () => {
    setSelectedSuppliers([]);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Today's Pick</h1>
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              const chosen = e.target.value;
              // Guard: some mobile browsers fire onChange("") while the picker is open/scrolling
              if (!chosen) return;
              setSelectedDate(chosen);
            }}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm md:text-base"
          />
        </div>
      </div>

      {groupedOrders.length > 0 && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Filter by Supplier</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={selectAllSuppliers}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedSuppliers.length === 0
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Suppliers
            </button>
            {groupedOrders.map(order => {
              const supplier = suppliers.find(s => s.id === order.supplierId);
              const isSelected = selectedSuppliers.includes(order.supplierId);
              // Show pick progress on each chip
              const pickedCount = order.items.filter(
                item => item.product?.artikelNr && pickedItems.has(item.product.artikelNr)
              ).length;
              const totalCount = order.items.length;
              const isComplete = pickedCount === totalCount && totalCount > 0;
              return (
                <button
                  key={order.supplierId}
                  onClick={() => toggleSupplier(order.supplierId)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isComplete
                      ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isComplete && <span className="mr-1">✓</span>}
                  {supplier?.companyName || order.supplierName}
                  <span className="ml-2 text-xs opacity-75">
                    {pickedCount > 0 ? `(${pickedCount}/${totalCount})` : `(${totalCount})`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <TodaysPickList
        groupedOrders={filteredOrders}
        selectedDate={selectedDate}
        isLoading={isLoading}
        error={error}
        pickedItems={pickedItems}
        onToggleItem={toggleItem}
        onMarkAllForSupplier={markAllForSupplier}
        onUnmarkAllForSupplier={unmarkAllForSupplier}
        onClearAll={clearAll}
      />
    </div>
  );
}
