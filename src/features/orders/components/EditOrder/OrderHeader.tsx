import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { formatDateForDisplay } from '../../../../utils/dateFormatting';
import type { Order } from '../../../../types/order';

interface OrderHeaderProps {
  order: Order;
}

export function OrderHeader({ order }: OrderHeaderProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-3 sm:p-4">
        <Link
          to="/dashboard/orders"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-3 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="font-medium">Back to Orders</span>
        </Link>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
              Order #{order.id}
            </h1>
            <div className="flex items-center text-xs sm:text-sm text-gray-600">
              <span>{formatDateForDisplay(order.orderDate)}</span>
              <span className="mx-2">•</span>
              <span className="font-medium truncate">{order.customer.companyName}</span>
            </div>
          </div>

          <div className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md ${
            order.status === 'Completed'
              ? 'bg-green-100 text-green-800'
              : order.status === 'Processing'
              ? 'bg-blue-100 text-blue-800'
              : order.status === 'Cancelled'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {order.status}
          </div>
        </div>
      </div>
    </div>
  );
}