import React from 'react';
import { SearchableSelect } from './SearchableSelect';
import { useCustomers } from '../../../../context/CustomerContext';

interface CustomerSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function CustomerSelect({ value, onChange, error }: CustomerSelectProps) {
  const { customers } = useCustomers();

  const options = customers.map(customer => ({
    value: customer.id,
    label: customer.companyName,
    description: customer.contactPerson
  }));

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Customer
      </label>
      <SearchableSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder="Select a customer"
        error={error}
      />
    </div>
  );
}