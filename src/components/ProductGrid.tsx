import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { ProfitMarginDisplay } from './ProfitMarginDisplay';
import { formatPrice } from '../utils/priceCalculations';
import type { Product } from '../types/product';

interface ProductGridProps {
  products: Product[];
  onDelete: (artikelNr: string) => void;
  selectedProducts: Product[];
  onToggleSelect: (product: Product) => void;
}

export function ProductGrid({ 
  products, 
  onDelete, 
  selectedProducts,
  onToggleSelect 
}: ProductGridProps) {
  const navigate = useNavigate();
  const selectedProductIds = new Set(selectedProducts.map(p => p.artikelNr));

  if (products.length === 0) {
    return (
      <div className="bg-white p-8 text-center rounded-lg border border-gray-200">
        <p className="text-gray-500">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map(product => (
        <div
          key={product.artikelNr}
          className={`bg-white p-4 rounded-lg border transition-all ${
            selectedProductIds.has(product.artikelNr)
              ? 'border-blue-200 ring-2 ring-blue-100'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`}
        >
          <div className="relative">
            <input
              type="checkbox"
              checked={selectedProductIds.has(product.artikelNr)}
              onChange={() => onToggleSelect(product)}
              className="absolute top-2 right-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500 z-10"
            />
            <div className="aspect-square bg-gray-100 rounded-lg mb-4">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg truncate" title={product.name}>
                {product.name}
              </h3>
              <p className="text-sm text-gray-600">Art. Nr: {product.artikelNr}</p>
              {product.bestellnummer && (
                <p className="text-sm text-gray-500">Order Nr: {product.bestellnummer}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">EK Price</p>
                <p className="font-medium">{formatPrice(product.ekPrice)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">VK Price</p>
                <p className="font-medium">{formatPrice(product.vkPrice)}</p>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <ProfitMarginDisplay
                ekPrice={product.ekPrice}
                vkPrice={product.vkPrice}
                mwst={product.mwst}
              />
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                product.istBestand <= 0 ? 'bg-red-100 text-red-800' :
                product.istBestand <= 10 ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                Stock: {product.istBestand}
              </span>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/dashboard/products/${product.artikelNr}/edit`)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this product?')) {
                    onDelete(product.artikelNr);
                  }
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}