import React from 'react';
import { useOrders } from '../../../../context/OrderContext';
import { formatPrice } from '../../../../utils/priceCalculations';

export function SalesReport() {
  const { orders } = useOrders();

  const totalSales = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const completedOrders = orders.filter(order => order.status === 'Completed');
  const averageOrderValue = totalSales / (orders.length || 1);

  const monthlySales = orders.reduce((acc, order) => {
    const month = new Date(order.orderDate).toLocaleString('default', { month: 'long' });
    acc[month] = (acc[month] || 0) + order.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatPrice(totalSales)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Completed Orders</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {completedOrders.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Average Order Value</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatPrice(averageOrderValue)}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Sales</h3>
        <div className="space-y-4">
          {Object.entries(monthlySales).map(([month, amount]) => (
            <div key={month} className="flex items-center">
              <div className="w-32 text-sm text-gray-500">{month}</div>
              <div className="flex-1">
                <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute top-0 left-0 h-full bg-yellow-500"
                    style={{
                      width: `${(amount / totalSales) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="w-32 text-right text-sm font-medium text-gray-900">
                {formatPrice(amount)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}