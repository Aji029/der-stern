import React from 'react';
import { useCustomers } from '../../../../context/CustomerContext';

interface CustomerSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function CustomerSelect({ value, onChange, error }: CustomerSelectProps) {
  const { customers } = useCustomers();

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Customer
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-1 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        }`}
        required
      >
        <option value="">Select a customer</option>
        {customers.map(customer => (
          <option key={customer.id} value={customer.id}>
            {customer.companyName} - {customer.contactPerson}
          </option>
        ))}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}