import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function OrderFormHeader() {
  return (
    <div className="mb-6">
      <Link
        to="/dashboard/orders"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Orders
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mt-2">Create New Order</h1>
    </div>
  );
}