import React, { useState, useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { TodaysPickList } from './components/TodaysPick/TodaysPickList';
import { useTodaysPick } from './hooks/useTodaysPick';
import { usePickedItems } from './hooks/usePickedItems';
import { useSuppliers } from '../../context/SupplierContext';
import { formatDateForInput } from '../../utils/dateFormatting';

export function TodaysPickPage() {
  const today = formatDateForInput(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const { groupedOrders, isLoading, error } = useTodaysPick(selectedDate);
  const { suppliers } = useSuppliers();
  const { pickedItems, toggleItem, markAllForSupplier, unmarkAllForSupplier, clearAll } =
    usePickedItems(selectedDate);

  const filteredOrders = useMemo(() => {
    if (!selectedSupplierId) return groupedOrders;
    return groupedOrders.filter(order => order.supplierId === selectedSupplierId);
  }, [groupedOrders, selectedSupplierId]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ── Header row: title + date + supplier filter ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex-1">Today's Pick</h1>

        {/* Date picker */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
          <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              const chosen = e.target.value;
              if (!chosen) return;
              setSelectedDate(chosen);
              setSelectedSupplierId('');
            }}
            className="text-sm border-0 outline-none bg-transparent"
          />
        </div>

        {/* Supplier filter dropdown — only shown when there are groups */}
        {groupedOrders.length > 0 && (
          <div className="relative flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm gap-2 min-w-[180px]">
            <select
              value={selectedSupplierId}
              onChange={e => setSelectedSupplierId(e.target.value)}
              className="flex-1 text-sm bg-transparent border-0 outline-none text-gray-700 cursor-pointer pr-5"
              style={{ backgroundImage: 'none' }}
            >
              <option value="">All Suppliers ({groupedOrders.length})</option>
              {groupedOrders.map(order => {
                const supplier = suppliers.find(s => s.id === order.supplierId);
                const name = supplier?.companyName || order.supplierName;
                const pickedCount = order.items.filter(
                  item => item.product?.artikelNr && pickedItems.has(item.product.artikelNr)
                ).length;
                const totalCount = order.items.length;
                const isComplete = pickedCount === totalCount && totalCount > 0;
                return (
                  <option key={order.supplierId} value={order.supplierId}>
                    {isComplete ? '✓ ' : ''}{name} ({pickedCount > 0 ? `${pickedCount}/${totalCount}` : totalCount})
                  </option>
                );
              })}
            </select>
            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0 pointer-events-none" />
          </div>
        )}
      </div>

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
