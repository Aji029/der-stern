import React, { useCallback, useState } from 'react';
import { Package, Loader, FileText, ScanLine } from 'lucide-react';
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

interface TodaysPickListProps {
  groupedOrders: GroupedOrders[];
  selectedDate: string;
  isLoading: boolean;
  error: string | null;
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

export function TodaysPickList({ groupedOrders, selectedDate, isLoading, error }: TodaysPickListProps) {
  const { updatePriceAndOrders } = useEKPriceUpdate();
  const { updateSupplierAcrossOrders } = useSupplierUpdate();
  const { suppliers } = useSuppliers();
  const [activeScanSupplier, setActiveScanSupplier] = useState<{ id: string; name: string } | null>(null);

  const handlePriceUpdate = useCallback(async (artikelNr: string, newPrice: number) => {
    await updatePriceAndOrders(artikelNr, newPrice);
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
        {error}
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
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <p className="text-sm md:text-base font-medium text-gray-700">
          Picking list for {formatDateForDisplay(selectedDate)} - {groupedOrders.length} suppliers
        </p>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
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

      {groupedOrders.map((group, index) => {
        const totals = calculateSupplierTotals(group.items);
        const colorScheme = supplierColors[index % supplierColors.length];

        return (
          <div
            key={group.supplierId}
            className={`${colorScheme.bg} p-4 md:p-6 rounded-xl shadow-sm border-2 ${colorScheme.border} transition-all duration-300 hover:shadow-md`}
          >
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4 md:mb-5">
              <div className="flex items-center gap-3">
                <div className={`w-1 h-12 ${colorScheme.accent} rounded-full`}></div>
                <div>
                  <h2 className={`text-lg md:text-xl font-bold ${colorScheme.text}`}>{group.supplierName}</h2>
                  <span className="text-xs md:text-sm text-gray-600 font-medium">{group.items.length} items to pick</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => setActiveScanSupplier({ id: group.supplierId, name: group.supplierName })}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 active:scale-95 transition-all text-sm font-bold shadow-sm"
                >
                  <ScanLine className="h-4 w-4" />
                  Scan Bill
                </button>
                <button
                  onClick={() => handleSimplifiedPDF(group)}
                  className={`flex items-center justify-center gap-2 px-4 py-2 ${colorScheme.accent} text-white rounded-lg hover:opacity-90 transition-all text-sm font-medium shadow-sm`}
                >
                  <FileText className="h-4 w-4" />
                  Simple PDF
                </button>
                <PDFButton
                  groupedOrders={[group]}
                  selectedDate={selectedDate}
                  supplierName={group.supplierName}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg p-2 md:p-4 space-y-2">
              {group.items.map((item, itemIndex) => (
                <div
                  key={`${item.product.artikelNr}-${itemIndex}`}
                  className="py-3 px-2 md:py-4 md:px-3 hover:bg-gray-50 rounded-lg transition-colors border-b last:border-b-0"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg ${colorScheme.bg} flex-shrink-0`}>
                        <Package className={`h-5 w-5 ${colorScheme.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm md:text-base truncate">{item.product.name}</p>
                        <p className="text-xs md:text-sm text-gray-500">Art. Nr: {item.product.artikelNr}</p>
                        <div className="flex items-center gap-4 mt-2 lg:hidden">
                          <div>
                            <p className="text-xs font-medium text-gray-500">Qty</p>
                            <p className="font-bold text-gray-900 text-base">{item.quantity.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500">Total</p>
                            <p className="text-sm text-gray-600 font-medium">{formatPrice(item.ekPrice * item.quantity)}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-center gap-3 lg:gap-6">
                      <div className="w-full lg:w-48">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Supplier
                        </label>
                        <select
                          value={item.product.supplierId || ''}
                          onChange={(e) => handleSupplierChange(item.product.artikelNr, e.target.value)}
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
                          artikelNr={item.product.artikelNr}
                          onUpdate={(newPrice) => handlePriceUpdate(item.product.artikelNr, newPrice)}
                        />
                      </div>

                      <div className="hidden lg:block text-right min-w-[140px]">
                        <p className="font-bold text-gray-900 text-lg">Qty: {item.quantity.toFixed(2)}</p>
                        <p className="text-sm text-gray-600 font-medium">Total: {formatPrice(item.ekPrice * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`mt-5 pt-4 border-t-2 ${colorScheme.border}`}>
              <SupplierSummary totals={totals} />
            </div>
          </div>
        );
      })}

      {/* Bill scan sheet — rendered at the root so it overlays everything */}
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