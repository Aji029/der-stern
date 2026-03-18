import React, { useState, useMemo, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useProducts } from '../../../../context/ProductContext';
import { formatPrice } from '../../../../utils/priceCalculations';

interface ProductSearchProps {
  onSelect: (product: any) => void;
  currentValue?: string;
}

export function ProductSearch({ onSelect, currentValue }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileFullscreen, setIsMobileFullscreen] = useState(false);
  const { products } = useProducts();

  const selectedProduct = products.find(p => p.artikelNr === currentValue);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.artikelNr.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 20);
  }, [products, searchTerm]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileFullscreen(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    if (isMobileFullscreen) {
      document.body.style.overflow = 'hidden';
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSearchTerm('');
    document.body.style.overflow = 'unset';
  };

  const handleSelect = (product: any) => {
    onSelect(product);
    handleClose();
  };

  return (
    <>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (!isOpen) handleOpen();
            }}
            onFocus={handleOpen}
            placeholder={selectedProduct?.name || "Search products..."}
            className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 min-h-[48px]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Desktop Dropdown */}
        {isOpen && !isMobileFullscreen && searchTerm && (
          <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-2xl border-2 border-gray-200 max-h-96 overflow-y-auto">
            {filteredProducts.map(product => (
              <button
                key={product.artikelNr}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 flex justify-between items-center border-b border-gray-100 last:border-0 active:bg-blue-100 transition-colors"
                onClick={() => handleSelect(product)}
              >
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{product.name}</div>
                  <div className="text-sm text-gray-500 mt-1">Art. Nr: {product.artikelNr}</div>
                </div>
                <div className="text-base font-bold text-gray-900 ml-4">
                  {formatPrice(product.vkPrice)}
                </div>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                No products found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile Fullscreen Overlay */}
      {isOpen && isMobileFullscreen && (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b-2 border-gray-200 bg-white shadow-sm">
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full active:scale-95 transition-transform"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  placeholder="Search products..."
                  className="w-full pl-12 pr-4 py-3 text-base border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                />
              </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
              {searchTerm ? (
                filteredProducts.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {filteredProducts.map(product => (
                      <button
                        key={product.artikelNr}
                        className="w-full px-4 py-4 text-left hover:bg-blue-50 active:bg-blue-100 transition-colors"
                        onClick={() => handleSelect(product)}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-base mb-1">
                              {product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Art. Nr: {product.artikelNr}
                            </div>
                          </div>
                          <div className="text-lg font-bold text-blue-600">
                            {formatPrice(product.vkPrice)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-lg font-medium">No products found</p>
                      <p className="text-sm mt-1">Try a different search term</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-base">Start typing to search products</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}