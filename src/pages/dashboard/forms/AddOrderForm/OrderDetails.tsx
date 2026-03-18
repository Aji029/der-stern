import React from 'react';
import type { OrderFormData } from './types';

interface OrderDetailsProps {
  data: OrderFormData;
  onChange: (updates: Partial<OrderFormData>) => void;
  errors?: Record<string, string>;
}

export function OrderDetails({ data, onChange, errors = {} }: OrderDetailsProps) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Delivery Date
        </label>
        <input
          type="date"
          value={data.deliveryDate}
          onChange={(e) => onChange({ deliveryDate: e.target.value })}
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
          value={data.shippingAddress}
          onChange={(e) => onChange({ shippingAddress: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
          placeholder="Enter shipping address"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes
        </label>
        <textarea
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
          placeholder="Add any additional notes about this order"
        />
      </div>
    </div>
  );
}