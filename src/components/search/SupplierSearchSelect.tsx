import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useSuppliers } from '../../context/SupplierContext';

interface SupplierSearchSelectProps {
  value: string;
  onChange: (supplierId: string) => void;
  className?: string;
}

export function SupplierSearchSelect({ value, onChange, className = '' }: SupplierSearchSelectProps) {
  const { suppliers } = useSuppliers();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedSupplier = suppliers.find(s => s.id === value);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedSupplier?.companyName || "Search suppliers..."}
          className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 ${className}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          {filteredSuppliers.map(supplier => (
            <button
              key={supplier.id}
              type="button"
              onClick={() => {
                onChange(supplier.id);
                setSearchTerm('');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50"
            >
              <div className="font-medium">{supplier.companyName}</div>
              <div className="text-sm text-gray-500">{supplier.contactPerson}</div>
            </button>
          ))}
          {filteredSuppliers.length === 0 && (
            <div className="px-4 py-2 text-sm text-gray-500">
              No suppliers found
            </div>
          )}
        </div>
      )}
    </div>
  );
}