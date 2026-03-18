import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';

interface ProductSearchSelectProps {
  value: string;
  onChange: (artikelNr: string) => void;
  className?: string;
}

export function ProductSearchSelect({ value, onChange, className = '' }: ProductSearchSelectProps) {
  const { products } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedProduct = products.find(p => p.artikelNr === value);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.artikelNr.toLowerCase().includes(searchTerm.toLowerCase())
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
          placeholder={selectedProduct?.name || "Search products..."}
          className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 ${className}`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          {filteredProducts.map(product => (
            <button
              key={product.artikelNr}
              type="button"
              onClick={() => {
                onChange(product.artikelNr);
                setSearchTerm('');
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left hover:bg-gray-50"
            >
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-gray-500">Art. Nr: {product.artikelNr}</div>
            </button>
          ))}
          {filteredProducts.length === 0 && (
            <div className="px-4 py-2 text-sm text-gray-500">
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  );
}