import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useProducts } from '../../../context/ProductContext';
import { useSuppliers } from '../../../context/SupplierContext';
import { ProductList } from './components/ProductList';
import { SupplierHeader } from './components/SupplierHeader';
import { SupplierInfo } from './components/SupplierInfo';

export function SupplierProductsPage() {
  const { supplierId } = useParams();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  
  const supplier = suppliers.find(s => s.id === supplierId);
  const supplierProducts = products.filter(p => p.supplierId === supplierId);
  
  if (!supplier) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Link
            to="/dashboard/orders"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Orders
          </Link>
        </div>
        <div className="text-center text-gray-500">Supplier not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SupplierHeader supplier={supplier} />
      <SupplierInfo supplier={supplier} />

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Products ({supplierProducts.length})
        </h2>
        <ProductList products={supplierProducts} />
      </div>
    </div>
  );
}