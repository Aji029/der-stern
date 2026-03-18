import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory } from 'lucide-react';
import { formatDateForDisplay } from '../../../utils/dateFormatting';
import { useOrders } from '../../../context/OrderContext';
import { useSuppliers } from '../../../context/SupplierContext';
import { formatPrice } from '../../../utils/priceCalculations';

export function TodaysPicks() {
  const navigate = useNavigate();
  const { orders } = useOrders();
  const { suppliers } = useSuppliers();

  // Get today's orders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todaysOrders = orders.filter(order => {
    const orderDate = new Date(order.orderDate);
    orderDate.setHours(0, 0, 0, 0);
    return orderDate.getTime() === today.getTime();
  });

  // Calculate supplier stats for today
  const supplierStats = suppliers.map(supplier => {
    const supplierOrders = todaysOrders.filter(order =>
      order.items.some(item => item.product.supplierId === supplier.id)
    );

    const totalAmount = supplierOrders.reduce((sum, order) => {
      const supplierItems = order.items.filter(item => 
        item.product.supplierId === supplier.id
      );
      return sum + supplierItems.reduce((itemSum, item) => 
        itemSum + (item.quantity * item.vkPrice), 0
      );
    }, 0);

    return {
      ...supplier,
      orderCount: supplierOrders.length,
      totalAmount,
    };
  }).filter(supplier => supplier.orderCount > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount);

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
              <div className="text-sm text-gray-500 space-y-1">
                <div>Orders Today: {supplier.orderCount}</div>
                <div>Total Amount: {formatPrice(supplier.totalAmount)}</div>
                <div>Contact: {supplier.contactPerson}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}