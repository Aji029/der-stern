import React from 'react';
import { useCustomers } from '../../../../context/CustomerContext';

interface CustomerListProps {
  selectedCustomerId: string | null;
  onSelectCustomer: (customerId: string) => void;
}

export function CustomerList({ selectedCustomerId, onSelectCustomer }: CustomerListProps) {
  const { customers, isLoading } = useCustomers();

  if (isLoading) {
    return <div>Loading customers...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Select Customer</h2>
      </div>
      <div className="divide-y">
        {customers.map(customer => (
          <button
            key={customer.id}
            onClick={() => onSelectCustomer(customer.id)}
            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
              selectedCustomerId === customer.id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="font-medium">{customer.companyName}</div>
            <div className="text-sm text-gray-500">{customer.contactPerson}</div>
          </button>
        ))}
      </div>
    </div>
  );
}