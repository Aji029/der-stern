import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, Search } from 'lucide-react';
import { useSuppliers } from '../../context/SupplierContext';

interface SupplierQuickAccessProps {
  selectedSupplierId: string;
  onSupplierChange: (supplierId: string) => void;
}

export function SupplierQuickAccess({ selectedSupplierId, onSupplierChange }: SupplierQuickAccessProps) {
  const navigate = useNavigate();
  const { suppliers } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSupplierClick = (supplierId: string) => {
    if (supplierId) {
      navigate(`/dashboard/suppliers/${supplierId}/products`);
    } else {
      onSupplierChange('');
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center text-gray-900">
          <Factory className="h-5 w-5 mr-2 text-gray-500" />
          Quick Access by Supplier
        </h2>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <button
          onClick={() => handleSupplierClick('')}
          className={`text-left px-4 py-2 rounded-lg border transition-colors ${
            !selectedSupplierId
              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          All Suppliers
        </button>
        {filteredSuppliers.map(supplier => (
          <button
            key={supplier.id}
            onClick={() => handleSupplierClick(supplier.id)}
            className={`text-left px-4 py-2 rounded-lg border transition-colors ${
              selectedSupplierId === supplier.id
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="font-medium text-sm truncate">{supplier.companyName}</div>
            <div className="text-xs text-gray-500 truncate">{supplier.contactPerson}</div>
          </button>
        ))}
      </div>
    </div>
  );
}