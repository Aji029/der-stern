import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Supplier } from '../../../../context/SupplierContext';

interface SupplierHeaderProps {
  supplier: Supplier;
}

export function SupplierHeader({ supplier }: SupplierHeaderProps) {
  const location = useLocation();
  const fromOrders = location.state?.from === 'orders';

  return (
    <div className="flex items-center justify-between">
      <div>
        <Link
          to={fromOrders ? "/dashboard/orders" : "/dashboard/products"}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to {fromOrders ? 'Orders' : 'Products'}
        </Link>
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