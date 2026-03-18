import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useSuppliers } from '../../../../context/SupplierContext';

interface SupplierSearchProps {
  onSelect: (supplierId: string) => void;
  currentValue?: string;
}

export function SupplierSearch({ onSelect, currentValue }: SupplierSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { suppliers } = useSuppliers();

  const selectedSupplier = suppliers.find(s => s.id === currentValue);

  const filteredSuppliers = useMemo(() => {
    if (!searchTerm) return [];
    return suppliers.filter(supplier =>
      supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [suppliers, searchTerm]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={selectedSupplier?.companyName || "Search suppliers..."}
          className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
        />
      </div>

      {isOpen && searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          {filteredSuppliers.map(supplier => (
            <button
              key={supplier.id}
              className="w-full px-4 py-2 text-left hover:bg-gray-50"
              onClick={() => {
                onSelect(supplier.id);
                setSearchTerm('');
                setIsOpen(false);
              }}
            >
              <div className="font-medium text-gray-900">{supplier.companyName}</div>
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