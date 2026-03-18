import React from 'react';
import { formatDateForInput } from '../../../../utils/dateFormatting';

interface OrderDetailsProps {
  deliveryDate: string;
  shippingAddress: string;
  onDeliveryDateChange: (date: string) => void;
  onShippingAddressChange: (address: string) => void;
  errors?: Record<string, string>;
}

export function OrderDetails({
  deliveryDate,
  shippingAddress,
  onDeliveryDateChange,
  onShippingAddressChange,
  errors = {},
}: OrderDetailsProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Date
        </label>
        <input
          type="date"
          value={deliveryDate}
          onChange={(e) => onDeliveryDateChange(e.target.value)}
          min={formatDateForInput(new Date())}
          className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
        />
        {errors.deliveryDate && (
          <p className="mt-1 text-sm text-red-600">{errors.deliveryDate}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Shipping Address
        </label>
        <textarea
          value={shippingAddress}
          onChange={(e) => onShippingAddressChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
          placeholder="Enter shipping address"
        />
        {errors.shippingAddress && (
          <p className="mt-1 text-sm text-red-600">{errors.shippingAddress}</p>
        )}
      </div>
    </div>
  );
}