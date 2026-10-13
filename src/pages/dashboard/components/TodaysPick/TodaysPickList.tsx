import React, { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { Package, Loader, FileText, ScanLine, CheckCircle2, X, ChevronDown, ChevronUp, ArrowUpDown } from 'lucide-react';
const BillScanSheet = lazy(() =>
  import('../../../../features/supplierBills/components/BillScanSheet').then(m => ({ default: m.BillScanSheet }))
);
import { EditableEKPrice } from '../../../../components/ui/EditableEKPrice';
import { formatDateForDisplay } from '../../../../utils/dateFormatting';
import { formatPrice } from '../../../../utils/priceCalculations';
import { calculateSupplierTotals } from '../../../../utils/supplierCalculations';
import { useEKPriceUpdate } from '../../../../hooks/useEKPriceUpdate';
import { useSupplierUpdate } from '../../../../hooks/useSupplierUpdate';
import { useSuppliers } from '../../../../context/SupplierContext';
import { useProducts } from '../../../../context/ProductContext';
import { usePickOrder } from '../../hooks/usePickOrder';
import { parsePosition } from '../../../../utils/pickOrder';
import { SupplierSummary } from './SupplierSummary';
import { PDFButton } from './PDFButton';
import type { GroupedOrders } from '../../hooks/useTodaysPick';
import type { OrderItem } from '../../../../types/order';

// ── Position field (Arrange mode) ─────────────────────────────────────────────
// Where the article sits on the walk through the market. Commits on blur or
// Enter; empty clears the position. Invalid input flashes red and resets.
function PositionInput({
  value,
  onCommit,
}: {
  value: number | null;
  onCommit: (next: number | null) => void;
}) {
  const asText = (v: number | null) => (v == null ? '' : String(v));
  const [text, setText] = useState(asText(value));
  const [invalid, setInvalid] = useState(false);

  useEffect(() => { setText(asText(value)); }, [value]);

  const commit = () => {
    const parsed = parsePosition(text);
    if (parsed === undefined) {
      setInvalid(true);
      setText(asText(value));
      setTimeout(() => setInvalid(false), 1200);
      return;
    }
    if (parsed === value || (parsed === null && value == null)) return;
    onCommit(parsed);
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={text}
      placeholder="Pos."
      onChange={e => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      onClick={e => e.stopPropagation()}
      title="Position on the walk through the market (lower = picked first)"
      className={`w-14 px-2 py-1.5 text-sm font-semibold text-center rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-amber-400 ${
        invalid ? 'border-red-400 bg-red-50' : 'border-amber-300'
      }`}
    />
  );
}

interface TodaysPickListProps {
  groupedOrders: GroupedOrders[];
  selectedDate: string;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
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

// ── Inline supplier selector ───────────────────────────────────────────────────
// Shows a compact chip by default. Tap → native <select> with autoFocus opens.
// Only one <select> with options is ever in the DOM at a time (no bulk render).
function InlineSupplierSelect({
  supplierId,
  artikelNr,
  suppliers,
  onChange,
}: {
  supplierId: string;
  artikelNr: string;
  suppliers: { id: string; companyName: string }[];
  onChange: (artikelNr: string, supplierId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const name = suppliers.find(s => s.id === supplierId)?.companyName ?? 'Assign supplier';

  if (!open) {
    return (
      <button
        onClick={e => { e.stopPropagation(); setOpen(true); }}
        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white border border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors max-w-[130px] group"
        title={name}
      >
        <span className="truncate">{name}</span>
        <ChevronDown className="h-3 w-3 flex-shrink-0 opacity-50 group-hover:opacity-100" />
      </button>
    );
  }

  return (
    <select
      autoFocus
      value={supplierId}
      onChange={e => { onChange(artikelNr, e.target.value); setOpen(false); }}
      onBlur={() => setOpen(false)}
      onClick={e => e.stopPropagation()}
      className="text-xs px-2 py-1 rounded-lg border border-blue-400 bg-white shadow-lg max-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-400"
      style={{ backgroundImage: 'none', paddingRight: '0.5rem' }}
    >
      <option value="">— No supplier —</option>
      {suppliers.map(s => (
        <option key={s.id} value={s.id}>{s.companyName}</option>
      ))}
    </select>
  );
}

export function TodaysPickList({
  groupedOrders,
  selectedDate,
  isLoading,
  error,
  onRetry,
  pickedItems,
  onToggleItem,
  onMarkAllForSupplier,
  onUnmarkAllForSupplier,
  onClearAll,
}: TodaysPickListProps) {
  const { updatePriceAndOrders } = useEKPriceUpdate();
  const { updateSupplierAcrossOrders } = useSupplierUpdate();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  const { setArticlePosition, moveSupplierGroup, isSaving: isSavingOrder } = usePickOrder();
  const [activeScanSupplier, setActiveScanSupplier] = useState<{ id: string; name: string } | null>(null);
  const [arrangeMode, setArrangeMode] = useState(false);

  // Store-walk order: current position of each article, from the catalog.
  const positionByArtikel = useMemo(
    () => new Map(products.map(p => [p.artikelNr, p.pickPosition ?? null])),
    [products]
  );

  const handlePositionCommit = useCallback(async (artikelNr: string, position: number | null) => {
    try {
      await setArticlePosition(artikelNr, position);
    } catch (err: any) {
      alert(err?.message || 'Could not save the position. Please try again.');
    }
  }, [setArticlePosition]);

  const handleMoveGroup = useCallback(async (index: number, dir: -1 | 1) => {
    try {
      await moveSupplierGroup(groupedOrders.map(g => g.supplierId), index, dir);
    } catch (err: any) {
      alert(err?.message || 'Could not save the supplier order. Please try again.');
    }
  }, [moveSupplierGroup, groupedOrders]);

  const handlePriceUpdate = useCallback(async (artikelNr: string, newPrice: number) => {
    await updatePriceAndOrders(artikelNr, newPrice);
  }, [updatePriceAndOrders]);

  const handleSupplierChange = useCallback(async (artikelNr: string, supplierId: string) => {
    try {
      await updateSupplierAcrossOrders(artikelNr, supplierId);
    } catch {
      alert('Failed to update supplier. Please try again.');
    }
  }, [updateSupplierAcrossOrders]);

  const handleSimplifiedPDF = async (group: GroupedOrders) => {
    try {
      const [{ pdf }, { SimplifiedPickPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./SimplifiedPickPDF'),
      ]);
      const blob = await pdf(
        <SimplifiedPickPDF
          groupedOrders={[group]}
          selectedDate={selectedDate}
          singleSupplier={true}
        />
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
      const [{ pdf }, { SimplifiedPickPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./SimplifiedPickPDF'),
      ]);
      const blob = await pdf(
        <SimplifiedPickPDF
          groupedOrders={groupedOrders}
          selectedDate={selectedDate}
          singleSupplier={false}
        />
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

  // ── Pick progress calculations ──────────────────────────────────────────────
  const totalItems = groupedOrders.reduce((sum, g) => sum + g.items.length, 0);
  const totalPicked = groupedOrders.reduce(
    (sum, g) =>
      sum +
      g.items.filter(item => item.product?.artikelNr && pickedItems.has(item.product.artikelNr))
        .length,
    0
  );
  const allDone = totalItems > 0 && totalPicked === totalItems;
  const pickPct = totalItems > 0 ? Math.round((totalPicked / totalItems) * 100) : 0;

  // ── Early return states ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        <p className="mb-3">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    );
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
        {/* Title row */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
          <p className="text-sm md:text-base font-medium text-gray-700">
            Picking list for {formatDateForDisplay(selectedDate)} — {groupedOrders.length} supplier{groupedOrders.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setArrangeMode(m => !m)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium border ${
                arrangeMode
                  ? 'bg-amber-500 border-amber-500 text-white hover:bg-amber-600'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <ArrowUpDown className="h-4 w-4" />
              {arrangeMode ? 'Done arranging' : 'Arrange order'}
            </button>
            <button
              onClick={handleSimplifiedAllPDF}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <FileText className="h-4 w-4" />
              Simple PDF (All)
            </button>
            <PDFButton
              groupedOrders={groupedOrders}
              selectedDate={selectedDate}
            />
          </div>
        </div>

        {/* Progress bar / all-done state */}
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

        {arrangeMode && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
            <span className="font-semibold">Store-walk order.</span> Give each article a number in the order you reach it in the market;
            lower numbers are picked first and articles without a number stay alphabetical at the end of their group.
            Use the arrows on a supplier to move the whole group. The order is saved for every device and used in the PDFs.
          </p>
        )}
      </div>

      {/* ── Supplier groups ───────────────────────────────────────────────── */}
      {groupedOrders.map((group, index) => {
        const totals = calculateSupplierTotals(group.items);
        const colorScheme = supplierColors[index % supplierColors.length];

        const supplierPickedCount = group.items.filter(
          item => item.product?.artikelNr && pickedItems.has(item.product.artikelNr)
        ).length;
        const supplierTotal = group.items.length;
        const isSupplierComplete = supplierPickedCount === supplierTotal && supplierTotal > 0;
        const allMarked = supplierPickedCount === supplierTotal;

        return (
          <div
            key={group.supplierId}
            className={`p-4 md:p-6 rounded-xl shadow-sm border-2 transition-all duration-300 hover:shadow-md ${
              isSupplierComplete
                ? 'bg-green-50 border-green-300'
                : `${colorScheme.bg} ${colorScheme.border}`
            }`}
          >
            {/* Supplier header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-1 h-12 rounded-full flex-shrink-0 ${isSupplierComplete ? 'bg-green-500' : colorScheme.accent}`} />
                {arrangeMode && (
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleMoveGroup(index, -1)}
                      disabled={index === 0 || isSavingOrder}
                      title="Move this supplier up"
                      className="p-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 active:scale-95 disabled:opacity-30 disabled:active:scale-100"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMoveGroup(index, 1)}
                      disabled={index === groupedOrders.length - 1 || isSavingOrder}
                      title="Move this supplier down"
                      className="p-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 active:scale-95 disabled:opacity-30 disabled:active:scale-100"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className={`text-lg md:text-xl font-bold ${isSupplierComplete ? 'text-green-700' : colorScheme.text}`}>
                      {group.supplierName}
                    </h2>
                    {isSupplierComplete && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-300">
                        <CheckCircle2 className="h-3 w-3" />
                        Done
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs md:text-sm text-gray-600 font-medium">
                      {group.items.length} items to pick
                    </span>
                    {supplierPickedCount > 0 && (
                      <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                        isSupplierComplete
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {supplierPickedCount}/{supplierTotal} picked
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    allMarked
                      ? onUnmarkAllForSupplier(group.items)
                      : onMarkAllForSupplier(group.items)
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm ${
                    allMarked
                      ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'bg-green-500 text-white hover:bg-green-600'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {allMarked ? 'Unmark All' : 'Mark All'}
                </button>
                <button
                  onClick={() => setActiveScanSupplier({ id: group.supplierId, name: group.supplierName })}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white rounded-lg hover:bg-brand-600 active:scale-95 transition-all text-xs font-bold shadow-sm"
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
                <PDFButton
                  groupedOrders={[group]}
                  selectedDate={selectedDate}
                  supplierName={group.supplierName}
                />
              </div>
            </div>

            {/* ── EK / VK totals at the top ─────────────────────────────── */}
            <div className={`mb-3 pb-3 border-b ${isSupplierComplete ? 'border-green-200' : 'border-gray-200'}`}>
              <SupplierSummary totals={totals} />
            </div>

            {/* Item list */}
            <div className="bg-white rounded-lg divide-y divide-gray-100">
              {group.items.map((item, itemIndex) => {
                const isPicked = !!(item.product?.artikelNr && pickedItems.has(item.product.artikelNr));
                return (
                  <div
                    key={`${item.product?.artikelNr}-${itemIndex}`}
                    onClick={() => !arrangeMode && item.product?.artikelNr && onToggleItem(item.product.artikelNr)}
                    className={`py-2.5 px-2 md:px-3 transition-all duration-200 select-none ${
                      arrangeMode ? 'cursor-default' : 'cursor-pointer'
                    } ${isPicked ? 'bg-green-50' : arrangeMode ? '' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Arrange mode: position on the walk. Normal mode: pick checkbox. */}
                      <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                        {arrangeMode ? (
                          <PositionInput
                            value={positionByArtikel.get(item.product?.artikelNr ?? '') ?? null}
                            onCommit={next => item.product?.artikelNr && handlePositionCommit(item.product.artikelNr, next)}
                          />
                        ) : (
                          <input
                            type="checkbox"
                            checked={isPicked}
                            onChange={() => item.product?.artikelNr && onToggleItem(item.product.artikelNr)}
                            className="h-4 w-4 rounded border-gray-300 text-green-500 focus:ring-green-400 cursor-pointer"
                          />
                        )}
                      </div>

                      {/* Product info */}
                      <div className={`flex-1 min-w-0 ${isPicked ? 'opacity-60' : ''}`}>
                        <p className={`font-medium text-sm truncate ${
                          isPicked ? 'line-through text-gray-400' : 'text-gray-900'
                        }`}>
                          {item.product?.name}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{item.product?.artikelNr}</span>
                          {/* Inline supplier chip — stops propagation so row click doesn't toggle pick */}
                          <div onClick={e => e.stopPropagation()}>
                            <InlineSupplierSelect
                              supplierId={item.product?.supplierId || ''}
                              artikelNr={item.product?.artikelNr || ''}
                              suppliers={suppliers}
                              onChange={handleSupplierChange}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Right: EK price + qty */}
                      <div
                        className="flex items-center gap-3 flex-shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        {!arrangeMode && (
                          <div className="text-right">
                            <p className="text-xs text-gray-500">EK</p>
                            <EditableEKPrice
                              value={item.ekPrice}
                              artikelNr={item.product?.artikelNr || ''}
                              onUpdate={(newPrice) => handlePriceUpdate(item.product?.artikelNr || '', newPrice)}
                            />
                          </div>
                        )}
                        <div className="text-right">
                          <p className={`font-bold text-sm ${isPicked ? 'text-gray-400' : 'text-gray-900'}`}>
                            {item.quantity % 1 === 0
                              ? item.quantity.toFixed(0)
                              : item.quantity.toFixed(2)}
                          </p>
                          <p className={`text-xs ${isPicked ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatPrice(item.ekPrice * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Bill scan sheet — lazy loaded so it never blocks the pick list */}
      {activeScanSupplier && (
        <Suspense fallback={null}>
          <BillScanSheet
            supplierId={activeScanSupplier.id}
            supplierName={activeScanSupplier.name}
            onClose={() => setActiveScanSupplier(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
