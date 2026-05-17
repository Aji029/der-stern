import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Banknote } from 'lucide-react';
import { Button } from '../ui/Button';
import { InvoiceButton } from '../InvoiceButton';
import { CustomInvoiceButton } from '../CustomInvoiceButton';
import { DeliveryNoteButton } from '../DeliveryNoteButton';
import { Pagination } from '../ui/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { formatPrice } from '../../utils/priceCalculations';
import { formatDateForDisplay } from '../../utils/dateFormatting';
import type { Order } from '../../types/order';

interface OrderListProps {
  orders: Order[];
}

export function OrderList({ orders }: OrderListProps) {
  const navigate = useNavigate();
  const {
    paginatedItems: paginatedOrders,
    currentPage,
    setCurrentPage,
    totalPages
  } = usePagination(orders, { pageSize: 15 });

  if (orders.length === 0) {
    return (
      <div className="bg-white p-8 text-center rounded-lg border border-gray-200">
        <p className="text-gray-500">No orders found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.customer.companyName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.customer.contactPerson}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateForDisplay(order.orderDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    {order.items.length}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                    {formatPrice(order.totalAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      order.status === 'Completed'
                        ? 'bg-green-100 text-green-800'
                        : order.status === 'Processing'
                        ? 'bg-blue-100 text-blue-800'
                        : order.status === 'Cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/dashboard/orders/${order.id}/edit`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <DeliveryNoteButton order={order} />
                      <CustomInvoiceButton 
                        order={order} 
                        className="text-brand-600 hover:text-brand-700"
                      >
                        <Banknote className="h-4 w-4" />
                      </CustomInvoiceButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}