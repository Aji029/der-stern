import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../../../utils/priceCalculations';
import type { Supplier } from '../../../context/SupplierContext';

interface SupplierCardProps {
  supplier: Supplier & {
    orderCount: number;
    totalAmount: number;
  };
  fromOrders?: boolean;
}

export function SupplierCard({ supplier, fromOrders = true }: SupplierCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/dashboard/suppliers/${supplier.id}/products`, {
      state: { from: 'orders' } // Always set to 'orders' for consistent navigation
    });
  };

  return (
    <div
      onClick={handleClick}
      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="font-medium text-lg mb-2">{supplier.companyName}</div>
      <div className="text-sm text-gray-500 space-y-1">
        {supplier.orderCount > 0 && (
          <>
            <div>Orders Today: {supplier.orderCount}</div>
            <div>Total Amount: {formatPrice(supplier.totalAmount)}</div>
          </>
        )}
        <div>Contact: {supplier.contactPerson}</div>
      </div>
    </div>
  );
}