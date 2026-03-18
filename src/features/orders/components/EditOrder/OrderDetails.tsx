import React from 'react';
import { User, Clock, CreditCard, MapPin } from 'lucide-react';
import { Accordion } from '../../../../components/ui/Accordion';
import { formatDateForInput } from '../../../../utils/dateFormatting';
import type { Order } from '../../../../types/order';

interface OrderDetailsProps {
  order: Order;
  onStatusChange: (status: string) => void;
  onPaymentStatusChange: (status: string) => void;
  onDateChange: (date: string) => void;
}

export function OrderDetails({
  order,
  onStatusChange,
  onPaymentStatusChange,
  onDateChange
}: OrderDetailsProps) {
  if (!order || !order.customer) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Customer Information Accordion */}
      <Accordion title="Customer Information" defaultOpen={false} icon={<User className="w-4 h-4" />}>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase mb-1">Company Name</p>
            <p className="text-sm font-medium text-gray-900">{order.customer.companyName}</p>
          </div>
          {order.customer.idNumber && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">ID Number</p>
              <p className="text-sm text-gray-900">{order.customer.idNumber}</p>
            </div>
          )}
          {order.customer.address && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Address</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {order.customer.address}
              </p>
            </div>
          )}
        </div>
      </Accordion>

      {/* Order Status Accordion */}
      <Accordion title="Order Status & Details" defaultOpen={true} icon={<Clock className="w-4 h-4" />}>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Order Date
            </label>
            <input
              type="date"
              value={formatDateForInput(order.orderDate)}
              onChange={(e) => {
                const date = new Date(e.target.value);
                date.setHours(12, 0, 0, 0);
                onDateChange(date.toISOString());
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Order Status
            </label>
            <select
              value={order.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Payment Status
            </label>
            <select
              value={order.paymentStatus}
              onChange={(e) => onPaymentStatusChange(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
        </div>
      </Accordion>

      {/* Shipping Address Accordion */}
      {order.shippingAddress && (
        <Accordion title="Shipping Address" defaultOpen={false} icon={<MapPin className="w-4 h-4" />}>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {order.shippingAddress}
            </p>
          </div>
        </Accordion>
      )}
    </div>
  );
}