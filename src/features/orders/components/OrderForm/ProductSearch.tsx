import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useProducts } from '../../../../context/ProductContext';
import { formatPrice } from '../../../../utils/priceCalculations';

interface ProductSearchProps {
  onSelect: (product: any) => void;
  currentValue?: string;
}

export function ProductSearch({ onSelect, currentValue }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { products } = useProducts();

  const selectedProduct = products.find(p => p.artikelNr === currentValue);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.artikelNr.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [products, searchTerm]);

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
          placeholder={selectedProduct?.name || "Search products..."}
          className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
        />
      </div>

      {isOpen && searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-60 overflow-y-auto">
          {filteredProducts.map(product => (
            <button
              key={product.artikelNr}
              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex justify-between items-center"
              onClick={() => {
                onSelect(product);
                setSearchTerm('');
                setIsOpen(false);
              }}
            >
              <div>
                <div className="font-medium text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-500">Art. Nr: {product.artikelNr}</div>
              </div>
              <div className="text-sm font-medium text-gray-900">
                {formatPrice(product.vkPrice)}
              </div>
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