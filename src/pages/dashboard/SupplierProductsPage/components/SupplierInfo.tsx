import React from 'react';
import type { Supplier } from '../../../../context/SupplierContext';

interface SupplierInfoProps {
  supplier: Supplier;
}

export function SupplierInfo({ supplier }: SupplierInfoProps) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Supplier Information</h2>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Address</p>
            <p className="text-sm">{supplier.address}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Payment Terms</p>
            <p className="text-sm">{supplier.paymentTerms}</p>
          </div>
        </div>
      </div>
    </div>
  );
}