import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSuppliers } from '../context/SupplierContext';
import { useProducts } from '../context/ProductContext';
import { Loader } from 'lucide-react';

interface SupplierFilterProps {
  selectedSupplierId: string;
  onSupplierChange: (supplierId: string) => void;
}

export function SupplierFilter({ selectedSupplierId, onSupplierChange }: SupplierFilterProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { products, isLoading: productsLoading } = useProducts();

  const getProductCountForSupplier = (supplierId: string) => {
    return products.filter(product => product.supplierId === supplierId).length;
  };

  const handleSupplierChange = (supplierId: string) => {
    if (supplierId) {
      navigate(`/dashboard/suppliers/${supplierId}/products`, {
        state: { from: 'orders' }
      });
    } else {
      onSupplierChange('');
    }
  };

  if (suppliersLoading || productsLoading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <Loader className="h-4 w-4 animate-spin" />
        <span>Loading suppliers...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      <label className="text-sm font-medium text-gray-700">Filter by Supplier:</label>
      <select
        value={selectedSupplierId}
        onChange={(e) => handleSupplierChange(e.target.value)}
        className="px-3 py-2 border rounded-lg shadow-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Suppliers</option>
        {suppliers.map(supplier => (
          <option key={supplier.id} value={supplier.id}>
            {supplier.companyName} ({getProductCountForSupplier(supplier.id)} products)
          </option>
        ))}
      </select>
    </div>
  );
}