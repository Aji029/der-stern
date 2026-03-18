import React from 'react';
import { useCustomers } from '../../../../context/CustomerContext';
import { useOrders } from '../../../../context/OrderContext';
import { formatPrice } from '../../../../utils/priceCalculations';

export function CustomerReport() {
  const { customers } = useCustomers();
  const { orders } = useOrders();

  const customerStats = customers.map(customer => {
    const customerOrders = orders.filter(order => order.customer.id === customer.id);
    const totalSpent = customerOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    const averageOrderValue = totalSpent / (customerOrders.length || 1);

    return {
      ...customer,
      orderCount: customerOrders.length,
      totalSpent,
      averageOrderValue,
      lastOrder: customerOrders.length > 0 
        ? new Date(Math.max(...customerOrders.map(o => o.orderDate.getTime())))
        : null,
    };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  const totalCustomers = customers.length;
  const activeCustomers = customerStats.filter(c => c.orderCount > 0).length;
  const totalRevenue = customerStats.reduce((sum, c) => sum + c.totalSpent, 0);
  const averageCustomerValue = totalRevenue / (totalCustomers || 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Customers</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{totalCustomers}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Active Customers</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{activeCustomers}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatPrice(totalRevenue)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Avg. Customer Value</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatPrice(averageCustomerValue)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Overview</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Order Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Order
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customerStats.map(customer => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {customer.companyName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {customer.contactPerson}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.orderCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(customer.totalSpent)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPrice(customer.averageOrderValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.lastOrder
                        ? customer.lastOrder.toLocaleDateString()
                        : 'No orders'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}