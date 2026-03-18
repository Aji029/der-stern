import React, { useState } from 'react';
import { Factory, Search } from 'lucide-react';
import { useSuppliers } from '../../../../context/SupplierContext';
import { useOrders } from '../context/OrdersContext';

export function SupplierQuickAccess() {
  const { suppliers } = useSuppliers();
  const { filters, setFilters } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-semibold flex items-center text-gray-900">
          <Factory className="h-5 w-5 mr-2 text-gray-500 flex-shrink-0" />
          <span className="truncate">Quick Access by Supplier</span>
        </h2>
        <div className="relative w-full sm:w-64">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
        <button
          onClick={() => setFilters(prev => ({ ...prev, supplierId: '' }))}
          className={`text-left px-3 py-2 rounded-lg border transition-colors ${
            !filters.supplierId
              ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="font-medium text-xs sm:text-sm truncate">All Suppliers</div>
        </button>
        {filteredSuppliers.map(supplier => (
          <button
            key={supplier.id}
            onClick={() => setFilters(prev => ({ ...prev, supplierId: supplier.id }))}
            className={`text-left px-3 py-2 rounded-lg border transition-colors ${
              filters.supplierId === supplier.id
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="font-medium text-xs sm:text-sm truncate">{supplier.companyName}</div>
            <div className="text-xs text-gray-500 truncate hidden sm:block">{supplier.contactPerson}</div>
          </button>
        ))}
      </div>
    </div>
  );
}