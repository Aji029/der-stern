import React, { useCallback, useState, useEffect } from 'react';
import { Package, Loader, FileText, ScanLine, CheckCircle2, X, ChevronDown, ChevronRight } from 'lucide-react';
import { BillScanSheet } from '../../../../features/supplierBills/components/BillScanSheet';
import { pdf } from '@react-pdf/renderer';
import { EditableEKPrice } from '../../../../components/ui/EditableEKPrice';
import { formatDateForDisplay } from '../../../../utils/dateFormatting';
import { formatPrice } from '../../../../utils/priceCalculations';
import { calculateSupplierTotals } from '../../../../utils/supplierCalculations';
import { useEKPriceUpdate } from '../../../../hooks/useEKPriceUpdate';
import { useSupplierUpdate } from '../../../../hooks/useSupplierUpdate';
import { useSuppliers } from '../../../../context/SupplierContext';
import { SupplierSummary } from './SupplierSummary';
import { PDFButton } from './PDFButton';
import { SimplifiedPickPDF } from './SimplifiedPickPDF';
import type { GroupedOrders } from '../../hooks/useTodaysPick';
import type { OrderItem } from '../../../../types/order';

interface TodaysPickListProps {
  groupedOrders: GroupedOrders[];
  selectedDate: string;
  isLoading: boolean;
  error: string | null;
  pickedItems: Set<string>;
  onToggleItem: (artikelNr: string) => void;
  onMarkAllForSupplier: (items: OrderItem[]) => void;
  onUnmarkAllForSupplier: (items: OrderItem[]) => void;
  onClearAll: () => void;
}

const supplierColors = [
  { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'bg-blue-500', text: 'text-blue-700' },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-500', text: 'text-emerald-700' },
  { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'bg-amber-500', text: 'text-amber-700' },
  { bg: 'bg-purple-50', border: 'border-purple-200', accent: 'bg-purple-500', text: 'text-purple-700' },
  { bg: 'bg-rose-50', border: 'border-rose-200', accent: 'bg-rose-500', text: 'text-rose-700' },
  { bg: 'bg-cyan-50', border: 'border-cyan-200', accent: 'bg-cyan-500', text: 'text-cyan-700' },
  { bg: 'bg-orange-50', border: 'border-orange-200', accent: 'bg-orange-500', text: 'text-orange-700' },
  { bg: 'bg-teal-50', border: 'border-teal-200', accent: 'bg-teal-500', text: 'text-teal-700' },
];

export function TodaysPickList({
  groupedOrders,
  selectedDate,
  isLoading,
  error,
  pickedItems,
  onToggleItem,
  onMarkAllForSupplier,
  onUnmarkAllForSupplier,
  onClearAll,
}: TodaysPickListProps) {
  const { updatePriceAndOrders } = useEKPriceUpdate();
  const { updateSupplierAcrossOrders } = useSupplierUpdate();
  const { suppliers } = useSuppliers();
  const [activeScanSupplier, setActiveScanSupplier] = useState<{ id: string; name: string } | null>(null);

  // ── Collapsible groups ──────────────────────────────────────────────────────
  // All groups start expanded; user can collapse individually.
  // When new supplier groups appear, auto-expand them too.
  const [expandedSuppliers, setExpandedSuppliers] = useState<Set<string>>(new Set());

  useEffect(() => {
    setExpandedSuppliers(prev => {
      const next = new Set(prev);
      groupedOrders.forEach(g => next.add(g.supplierId));
      return next;
    });
  }, [groupedOrders]);

  const toggleExpanded = (supplierId: string) => {
    setExpandedSuppliers(prev => {
      const next = new Set(prev);
      if (next.has(supplierId)) next.delete(supplierId);
      else next.add(supplierId);
      return next;
    });
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handlePriceUpdate = useCallback(async (artikelNr: string, newPrice: number) => {
    if (!artikelNr) return;
    try {
      await updatePriceAndOrders(artikelNr, newPrice);
    } catch (err) {
      console.error('Failed to update EK price:', err);
      alert('Failed to update price. Please try again.');
    }
  }, [updatePriceAndOrders]);

  const handleSupplierChange = async (artikelNr: string, newSupplierId: string) => {
    try {
      await updateSupplierAcrossOrders(artikelNr, newSupplierId);
    } catch (error) {
      console.error('Failed to update supplier:', error);
      alert('Failed to update supplier. Please try again.');
    }
  };

  const handleSimplifiedPDF = async (group: GroupedOrders) => {
    try {
      const blob = await pdf(
        <SimplifiedPickPDF groupedOrders={[group]} selectedDate={selectedDate} singleSupplier={true} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${group.supplierName}_simplified_${selectedDate}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleSimplifiedAllPDF = async () => {
    try {
      const blob = await pdf(
        <SimplifiedPickPDF groupedOrders={groupedOrders} selectedDate={selectedDate} singleSupplier={false} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `all_suppliers_simplified_${selectedDate}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // ── Progress totals ─────────────────────────────────────────────────────────
  const totalItems = groupedOrders.reduce((sum, g) => sum + g.items.length, 0);
  const totalPicked = groupedOrders.reduce(
    (sum, g) => sum + g.items.filter(item => item.product?.artikelNr && pickedItems.has(item.product.artikelNr)).length,
    0
  );
  const allDone = totalItems > 0 && totalPicked === totalItems;
  const pickPct = totalItems > 0 ? Math.round((totalPicked / totalItems) * 100) : 0;

  // ── Early returns ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>;
  }

  if (groupedOrders.length === 0) {
    return (
      <div className="bg-white p-8 text-center rounded-lg border border-gray-200">
        <p className="text-gray-500">No orders to pick for today ({formatDateForDisplay(selectedDate)}).</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* ── Top summary bar ──────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-3">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <p className="text-sm md:text-base font-medium text-gray-700">
            Picking list for {formatDateForDisplay(selectedDate)} — {groupedOrders.length} supplier{groupedOrders.length !== 1 ? 's' : ''}
            <span className="ml-2 text-xs text-gray-400">(click a supplier to expand)</span>
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={handleSimplifiedAllPDF}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <FileText className="h-4 w-4" />
              Simple PDF (All)
            </button>
            <PDFButton groupedOrders={groupedOrders} selectedDate={selectedDate} />
          </div>
        </div>

        {allDone ? (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-green-700">
              🎉 All {totalItems} items picked! Great work today.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                {totalPicked} / {totalItems} items picked
                {totalPicked > 0 && ` (${pickPct}%)`}
              </span>
              {pickedItems.size > 0 && (
                <button
                  onClick={onClearAll}
                  className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
                >
                  <X className="h-3 w-3" />
                  Clear all picks
                </button>
              )}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 bg-green-500 rounded-full transition-all duration-300"
                style={{ width: `${pickPct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Supplier groups — collapsible ─────────────────────────────────── */}
      {groupedOrders.map((group, index) => {
        const totals = calculateSupplierTotals(group.items);
        const colorScheme = supplierColors[index % supplierColors.length];
        const isExpanded = expandedSuppliers.has(group.supplierId);

        const supplierPickedCount = group.items.filter(
          item => item.product?.artikelNr && pickedItems.has(item.product.artikelNr)
        ).length;
        const supplierTotal = group.items.length;
        const isSupplierComplete = supplierPickedCount === supplierTotal && supplierTotal > 0;
        const allMarked = supplierPickedCount === supplierTotal;

        return (
          <div
            key={group.supplierId}
            className={`rounded-xl shadow-sm border-2 overflow-hidden transition-all duration-200 ${
              isSupplierComplete ? 'border-green-300' : colorScheme.border
            }`}
          >
            {/* ── Clickable supplier header ─────────────────────────────── */}
            <div
              onClick={() => toggleExpanded(group.supplierId)}
              className={`flex flex-col md:flex-row md:justify-between md:items-center gap-3 p-4 md:p-5 cursor-pointer select-none transition-colors ${
                isSupplierComplete
                  ? 'bg-green-50 hover:bg-green-100'
                  : `${colorScheme.bg} hover:brightness-95`
              }`}
            >
              {/* Left: name + progress */}
              <div className="flex items-center gap-3 min-w-0">
                {isExpanded
                  ? <ChevronDown className={`h-5 w-5 flex-shrink-0 ${isSupplierComplete ? 'text-green-600' : colorScheme.text}`} />
                  : <ChevronRight className={`h-5 w-5 flex-shrink-0 ${isSupplierComplete ? 'text-green-600' : colorScheme.text}`} />
                }
                <div className={`w-1 h-10 rounded-full flex-shrink-0 ${isSupplierComplete ? 'bg-green-500' : colorScheme.accent}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className={`text-base md:text-lg font-bold ${isSupplierComplete ? 'text-green-700' : colorScheme.text}`}>
                      {group.supplierName}
                    </h2>
                    {isSupplierComplete && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-300">
                        <CheckCircle2 className="h-3 w-3" /> Done
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-600 font-medium">
                      {supplierTotal} item{supplierTotal !== 1 ? 's' : ''}
                    </span>
                    {supplierPickedCount > 0 && (
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                        isSupplierComplete ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {supplierPickedCount}/{supplierTotal} picked
                      </span>
                    )}
                    {/* Mini progress bar */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-300"
                          style={{
                            width: supplierTotal > 0 ? `${Math.round((supplierPickedCount / supplierTotal) * 100)}%` : '0%',
                            background: isSupplierComplete ? '#16a34a' : '#8cb918',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: action buttons — stop propagation so they don't toggle collapse */}
              <div
                className="flex flex-wrap gap-2"
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => allMarked ? onUnmarkAllForSupplier(group.items) : onMarkAllForSupplier(group.items)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                    allMarked ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {allMarked ? 'Unmark All' : 'Mark All'}
                </button>
                <button
                  onClick={() => setActiveScanSupplier({ id: group.supplierId, name: group.supplierName })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-400 text-gray-900 rounded-lg hover:bg-brand-500 active:scale-95 transition-all text-xs font-bold shadow-sm"
                >
                  <ScanLine className="h-3.5 w-3.5" />
                  Scan Bill
                </button>
                <button
                  onClick={() => handleSimplifiedPDF(group)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 ${colorScheme.accent} text-white rounded-lg hover:opacity-90 transition-all text-xs font-medium shadow-sm`}
                >
                  <FileText className="h-3.5 w-3.5" />
                  PDF
                </button>
                <PDFButton groupedOrders={[group]} selectedDate={selectedDate} supplierName={group.supplierName} />
              </div>
            </div>

            {/* ── Item list — only rendered when expanded ───────────────── */}
            {isExpanded && (
              <div className="bg-white">
                <div className="divide-y divide-gray-50">
                  {group.items.map((item, itemIndex) => {
                    const isPicked = !!(item.product?.artikelNr && pickedItems.has(item.product.artikelNr));
                    return (
                      <div
                        key={`${item.product?.artikelNr}-${itemIndex}`}
                        onClick={() => item.product?.artikelNr && onToggleItem(item.product.artikelNr)}
                        className={`py-3 px-3 md:py-4 md:px-4 transition-all duration-200 cursor-pointer select-none ${
                          isPicked ? 'bg-green-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                          <div className={`flex items-start space-x-3 flex-1 min-w-0 ${isPicked ? 'opacity-75' : ''}`}>
                            <div className="flex-shrink-0 pt-0.5" onClick={e => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isPicked}
                                onChange={() => item.product?.artikelNr && onToggleItem(item.product.artikelNr)}
                                className="h-5 w-5 rounded border-gray-300 text-green-500 focus:ring-green-400 cursor-pointer"
                              />
                            </div>

                            <div className={`p-2 rounded-lg flex-shrink-0 ${isPicked ? 'bg-green-100' : colorScheme.bg}`}>
                              <Package className={`h-5 w-5 ${isPicked ? 'text-green-600' : colorScheme.text}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm md:text-base truncate transition-all ${
                                isPicked ? 'line-through text-gray-400' : 'text-gray-900'
                              }`}>
                                {item.product?.name}
                              </p>
                              <p className="text-xs md:text-sm text-gray-500">Art. Nr: {item.product?.artikelNr}</p>
                              {/* Mobile qty/total */}
                              <div className="flex items-center gap-4 mt-2 lg:hidden">
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Qty</p>
                                  <p className={`font-bold text-base ${isPicked ? 'text-gray-400' : 'text-gray-900'}`}>
                                    {item.quantity.toFixed(2)}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Total</p>
                                  <p className={`text-sm font-medium ${isPicked ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {formatPrice(item.ekPrice * item.quantity)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right-side controls */}
                          <div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-3 lg:gap-6"
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="w-full lg:w-48">
                              <label className="block text-xs font-medium text-gray-500 mb-1">Supplier</label>
                              <select
                                value={item.product?.supplierId || ''}
                                onChange={(e) => item.product?.artikelNr && handleSupplierChange(item.product.artikelNr, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                              >
                                <option value="">Select supplier</option>
                                {suppliers.map(supplier => (
                                  <option key={supplier.id} value={supplier.id}>
                                    {supplier.companyName}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="w-full sm:w-auto">
                              <p className="text-xs font-medium text-gray-500 mb-1">EK Price</p>
                              <EditableEKPrice
                                value={item.ekPrice}
                                artikelNr={item.product?.artikelNr ?? ''}
                                onUpdate={(newPrice) => { if (item.product?.artikelNr) handlePriceUpdate(item.product.artikelNr, newPrice); }}
                              />
                            </div>

                            <div className="hidden lg:block text-right min-w-[140px]">
                              <p className={`font-bold text-lg ${isPicked ? 'text-gray-400' : 'text-gray-900'}`}>
                                Qty: {item.quantity.toFixed(2)}
                              </p>
                              <p className={`text-sm font-medium ${isPicked ? 'text-gray-400' : 'text-gray-600'}`}>
                                Total: {formatPrice(item.ekPrice * item.quantity)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className={`mx-4 mb-4 mt-2 pt-4 border-t-2 ${isSupplierComplete ? 'border-green-300' : colorScheme.border}`}>
                  <SupplierSummary totals={totals} />
                </div>
              </div>
            )}
          </div>
        );
      })}

      {activeScanSupplier && (
        <BillScanSheet
          supplierId={activeScanSupplier.id}
          supplierName={activeScanSupplier.name}
          onClose={() => setActiveScanSupplier(null)}
        />
      )}
    </div>
  );
}
