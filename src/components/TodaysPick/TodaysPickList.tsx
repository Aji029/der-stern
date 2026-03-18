import React, { useCallback } from 'react';
import { Package, Loader } from 'lucide-react';
import { EditableEKPrice } from '../../ui/EditableEKPrice';
import { formatDateForDisplay } from '../../../utils/dateFormatting';
import { formatPrice } from '../../../utils/priceCalculations';
import { calculateSupplierTotals } from '../../../utils/supplierCalculations';
import { useEKPriceUpdate } from '../../../hooks/useEKPriceUpdate';
import { SupplierSummary } from './SupplierSummary';
import { PDFButton } from './PDFButton';
import type { GroupedOrders } from '../../../pages/dashboard/hooks/useTodaysPick';

interface TodaysPickListProps {
  groupedOrders: GroupedOrders[];
  selectedDate: string;
  isLoading: boolean;
  error: string | null;
}

export function TodaysPickList({ groupedOrders, selectedDate, isLoading, error }: TodaysPickListProps) {
  const { updatePriceAndOrders } = useEKPriceUpdate();

  const handlePriceUpdate = useCallback(async (artikelNr: string, newPrice: number) => {
    await updatePriceAndOrders(artikelNr, newPrice);
  }, [updatePriceAndOrders]);

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          Picking list for {formatDateForDisplay(selectedDate)}
        </p>
        <PDFButton 
          groupedOrders={groupedOrders}
          selectedDate={selectedDate}
        />
      </div>

      {groupedOrders.map((group) => {
        const totals = calculateSupplierTotals(group.items);
        
        return (
          <div key={group.supplierId} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{group.supplierName}</h2>
                <span className="text-sm text-gray-500">{group.items.length} items</span>
              </div>
              <PDFButton 
                groupedOrders={[group]}
                selectedDate={selectedDate}
                supplierName={group.supplierName}
              />
            </div>

            <div className="space-y-4">
              {group.items.map((item, index) => (
                <div
                  key={`${item.product.artikelNr}-${index}`}
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-4">
                    <Package className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-500">Art. Nr: {item.product.artikelNr}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-8">
                    <div className="text-center">
                      <p className="text-sm text-gray-500">EK Price</p>
                      <EditableEKPrice
                        value={item.ekPrice}
                        artikelNr={item.product.artikelNr}
                        onUpdate={(newPrice) => handlePriceUpdate(item.product.artikelNr, newPrice)}
                      />
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">Quantity: {item.quantity.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">Total: {formatPrice(item.ekPrice * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t">
              <SupplierSummary totals={totals} />
            </div>
          </div>
        );
      })}
    </div>
  );
}