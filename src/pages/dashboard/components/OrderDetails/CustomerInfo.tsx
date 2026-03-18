import React from 'react';

interface CustomerInfoProps {
  customer: {
    companyName: string;
    contactPerson: string;
    email: string;
    phone?: string;
  };
}

export function CustomerInfo({ customer }: CustomerInfoProps) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-3">Customer Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-500">Company</label>
          <div className="mt-1 text-sm font-medium">{customer.companyName}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Contact</label>
          <div className="mt-1 text-sm">{customer.contactPerson}</div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Email</label>
          <div className="mt-1 text-sm">{customer.email}</div>
        </div>
        {customer.phone && (
          <div>
            <label className="block text-sm font-medium text-gray-500">Phone</label>
            <div className="mt-1 text-sm">{customer.phone}</div>
          </div>
        )}
      </div>
    </div>
  );
}