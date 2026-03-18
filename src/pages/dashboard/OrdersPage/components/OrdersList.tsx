import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrdersContext';

export function OrdersList() {
  const navigate = useNavigate();
  const { orders } = useOrders();

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map(order => (
                <tr
                  key={order.id}
                  onClick={() => navigate(`/dashboard/orders/${order.id}/details`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.customer.companyName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.orderDate).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.items.length} items
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.items.map(item => item.product.name).join(', ').slice(0, 50)}
                      {order.items.length > 1 && '...'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      order.profitMargin > 10
                        ? 'text-green-600'
                        : order.profitMargin > 0
                        ? 'text-yellow-600'
                        : 'text-red-600'
                    }`}>
                      €{order.totalAmount.toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {orders.map(order => (
          <div
            key={order.id}
            onClick={() => navigate(`/dashboard/orders/${order.id}/details`)}
            className="bg-white shadow rounded-lg p-4 cursor-pointer active:bg-gray-50 transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-semibold text-gray-900 truncate">
                  {order.customer.companyName}
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(order.orderDate).toLocaleDateString()}
                </div>
              </div>
              <div className={`text-sm font-semibold whitespace-nowrap ${
                order.profitMargin > 10
                  ? 'text-green-600'
                  : order.profitMargin > 0
                  ? 'text-yellow-600'
                  : 'text-red-600'
              }`}>
                €{order.totalAmount.toFixed(2)}
              </div>
            </div>
            <div className="pt-2 border-t">
              <div className="text-sm text-gray-700">
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </div>
              <div className="text-xs text-gray-500 mt-1 truncate">
                {order.items.map(item => item.product.name).join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}