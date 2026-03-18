import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, Package } from 'lucide-react';
import { formatDateForDisplay } from '../../../utils/dateFormatting';
import { formatPrice } from '../../../utils/priceCalculations';
import { useSupplierStats } from '../hooks/useSupplierStats';

export function TodaysPicks() {
  const navigate = useNavigate();
  const today = new Date();
  const supplierStats = useSupplierStats(today);

  const handleSupplierClick = (supplierId: string) => {
    navigate(`/dashboard/suppliers/${supplierId}/products`, {
      state: { from: 'orders' }
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold flex items-center text-gray-900">
          <Factory className="h-5 w-5 mr-2 text-gray-500" />
          Today's Picks ({formatDateForDisplay(today)})
        </h2>
      </div>

      {supplierStats.length === 0 ? (
        <p className="text-center text-gray-500 py-4">No orders for today</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplierStats.map(supplier => (
            <div
              key={supplier.id}
              onClick={() => handleSupplierClick(supplier.id)}
              className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="font-medium text-lg mb-2">{supplier.companyName}</div>
              <div className="text-sm text-gray-500 space-y-2">
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  <span>Products to Pick: {supplier.orderCount}</span>
                </div>
                <div>Total Value: {formatPrice(supplier.totalAmount)}</div>
                <div className="border-t pt-2 mt-2">
                  <div className="font-medium mb-1">Products:</div>
                  {supplier.productsToPickup.map((product, index) => (
                    <div key={index} className="flex justify-between text-xs">
                      <span>{product.name}</span>
                      <span className="font-medium">×{product.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}