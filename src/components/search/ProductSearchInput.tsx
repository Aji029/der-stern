import React, { useState, useEffect, useRef } from 'react';
import { Search, Package, Plus, Check } from 'lucide-react';
import { useProducts } from '../../context/ProductContext';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../utils/priceCalculations';

interface ProductSearchInputProps {
  onSelect: (product: any, quantity?: number) => void;
  onNoResults?: () => void;
  placeholder?: string;
  customerId?: string;
  selectedProducts?: string[];
}

export function ProductSearchInput({
  onSelect,
  onNoResults,
  placeholder = "Search products...",
  customerId,
  selectedProducts = []
}: ProductSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [frequentProducts, setFrequentProducts] = useState<any[]>([]);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const getFrequentlyOrderedProducts = async () => {
      if (!customerId) return;
      
      try {
        const { data, error } = await supabase
          .from('customer_favorites')
          .select('product_id, total_quantity')
          .eq('customer_id', customerId)
          .order('total_quantity', { ascending: false })
          .limit(5);

        if (error) throw error;
        setFrequentProducts(data || []);
      } catch (err) {
        console.error('Error fetching frequently ordered products:', err);
        setFrequentProducts([]);
      }
    };

    getFrequentlyOrderedProducts();
  }, [customerId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,artikel_nr.ilike.%${searchTerm}%`)
          .limit(20);

        if (error) throw error;

        const results = (data || []).map(p => ({
          artikelNr: p.artikel_nr,
          name: p.name,
          vkPrice: p.vk_price,
          ekPrice: p.ek_price,
          istBestand: p.ist_bestand,
          mwst: p.mwst,
          supplierId: p.supplier_id,
        }));

        const sortedResults = results.sort((a, b) => {
          const aIsFrequent = frequentProducts.some(fp => fp.product_id === a.artikelNr);
          const bIsFrequent = frequentProducts.some(fp => fp.product_id === b.artikelNr);

          if (aIsFrequent && !bIsFrequent) return -1;
          if (!aIsFrequent && bIsFrequent) return 1;
          return a.name.localeCompare(b.name);
        });

        setSearchResults(sortedResults);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, frequentProducts]);

  const handleQuantityChange = (artikelNr: string, value: string) => {
    const quantity = parseFloat(value) || 1;
    setQuantities(prev => ({
      ...prev,
      [artikelNr]: Math.max(0.01, quantity)
    }));
  };

  const handleProductSelect = (product: any) => {
    const quantity = quantities[product.artikelNr] || 1;
    onSelect(product, quantity);
    setQuantities(prev => {
      const { [product.artikelNr]: _, ...rest } = prev;
      return rest;
    });
    setSearchTerm('');
    setIsSearchFocused(false);
  };

  const isProductSelected = (artikelNr: string) => selectedProducts.includes(artikelNr);

  return (
    <div ref={searchContainerRef} className="relative">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 text-lg border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Search Results Dropdown */}
      {isSearchFocused && searchTerm && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[60vh] overflow-y-auto">
          {isSearching ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              <p className="text-sm text-gray-500">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="divide-y">
              {searchResults.map(product => {
                const isSelected = isProductSelected(product.artikelNr);
                const isFrequent = frequentProducts.some(fp => fp.product_id === product.artikelNr);
                const isHovered = hoveredProduct === product.artikelNr;
                const frequentProduct = frequentProducts.find(fp => fp.product_id === product.artikelNr);
                
                return (
                  <div
                    key={product.artikelNr}
                    className={`p-4 transition-colors ${
                      isSelected ? 'bg-green-50' : 
                      isFrequent ? 'bg-yellow-50' :
                      isHovered ? 'bg-gray-50' : ''
                    }`}
                    onMouseEnter={() => setHoveredProduct(product.artikelNr)}
                    onMouseLeave={() => setHoveredProduct(null)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{product.name}</h3>
                        <p className="text-sm text-gray-500">Art. Nr: {product.artikelNr}</p>
                        {isFrequent && frequentProduct && (
                          <div className="flex items-center mt-1 space-x-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Frequently Ordered
                            </span>
                            <span className="text-xs text-gray-500">
                              (Total: {frequentProduct.total_quantity})
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(product.vkPrice)}</p>
                          <p className="text-sm text-gray-500">Stock: {product.istBestand}</p>
                        </div>
                        {!isSelected && (
                          <div className="flex items-center space-x-3">
                            <input
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9]*[.,]?[0-9]*"
                              value={quantities[product.artikelNr] || ''}
                              onChange={(e) => handleQuantityChange(product.artikelNr, e.target.value)}
                              placeholder="1"
                              className="w-20 px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={() => handleProductSelect(product)}
                              className="flex items-center px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add
                            </button>
                          </div>
                        )}
                        {isSelected && (
                          <div className="flex items-center text-green-600">
                            <Check className="h-5 w-5 mr-1" />
                            <span className="text-sm font-medium">Added</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">
                No products found matching "{searchTerm}"
              </p>
              {onNoResults && (
                <button
                  onClick={() => {
                    setIsSearchFocused(false);
                    onNoResults();
                  }}
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create new product
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}