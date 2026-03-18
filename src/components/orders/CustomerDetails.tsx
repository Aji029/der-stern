import React from 'react';
import type { Order } from '../../types/order';

interface CustomerDetailsProps {
  customer: Order['customer'];
}

export function CustomerDetails({ customer }: CustomerDetailsProps) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Customer Information</h3>
      <div className="bg-gray-50 p-4 rounded-lg space-y-4">
        <div>
          <h4 className="text-xl font-bold text-gray-900">{customer.companyName}</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">ID Number</p>
            <p className="text-sm font-mono">{customer.idNumber}</p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-500">Address</p>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">{customer.address}</p>
          </div>
        </div>
      </div>
    </div>
  );
}