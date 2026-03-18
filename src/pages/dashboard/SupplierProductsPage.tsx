import React from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import { useSuppliers } from '../../context/SupplierContext';
import { ProductList } from './components/ProductList';

export function SupplierProductsPage() {
  const { supplierId } = useParams();
  const location = useLocation();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  
  const supplier = suppliers.find(s => s.id === supplierId);
  const supplierProducts = products.filter(p => p.supplierId === supplierId);
  const fromOrders = location.state?.from === 'orders';
  
  if (!supplier) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Link
            to={fromOrders ? "/dashboard/orders" : "/dashboard/products"}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to {fromOrders ? 'Orders' : 'Products'}
          </Link>
        </div>
        <div className="text-center text-gray-500">Supplier not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Products ({supplierProducts.length})
        </h2>
        <ProductList 
          filters={{
            search: '',
            category: 'All',
            status: 'All'
          }}
          supplierFilter={supplierId}
        />
      </div>
    </div>
  );
}