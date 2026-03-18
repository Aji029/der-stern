import React from 'react';
import { BackButton } from '../../../components/navigation/BackButton';
import type { Supplier } from '../../../context/SupplierContext';

interface SupplierHeaderProps {
  supplier: Supplier;
}

export function SupplierHeader({ supplier }: SupplierHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="mb-2">
          <BackButton defaultPath="/dashboard/products" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Products from {supplier.companyName}
        </h1>
      </div>
      <div className="text-sm text-gray-500">
        <div>Contact: {supplier.contactPerson}</div>
        <div>Email: {supplier.email}</div>
        <div>Phone: {supplier.phone}</div>
      </div>
    </div>
  );
}