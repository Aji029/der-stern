import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useSuppliers } from '../../context/SupplierContext';

interface SupplierSelectProps {
  value: string;
  onChange: (supplierId: string) => void;
  className?: string;
  disabled?: boolean;
  error?: string;
  required?: boolean;
}

export function SupplierSelect({ 
  value, 
  onChange, 
  className = '',
  disabled = false,
  error,
  required = false
}: SupplierSelectProps) {
  const { suppliers } = useSuppliers();

  return (
    <div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 pr-8 border rounded-lg focus:ring-1 focus:ring-blue-500 transition-colors duration-200 appearance-none bg-white ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          } ${error ? 'border-red-500' : 'border-gray-300'} ${className}`}
          disabled={disabled}
          required={required}
        >
          <option value="">Select supplier</option>
          {suppliers.map(supplier => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.companyName}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}