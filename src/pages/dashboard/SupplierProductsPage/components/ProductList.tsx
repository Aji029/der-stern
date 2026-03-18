import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { ProfitMarginDisplay } from '../../../../components/ProfitMarginDisplay';
import { formatPrice } from '../../../../utils/priceCalculations';
import type { Product } from '../../../../context/ProductContext';

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {products.map(product => (
        <div
          key={product.artikelNr}
          className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-gray-400">No image</div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{product.name}</h3>
            <p className="text-sm text-gray-600">Art. Nr: {product.artikelNr}</p>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">EK Price</p>
                <p className="font-medium">{formatPrice(product.ekPrice)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">VK Price</p>
                <p className="font-medium">{formatPrice(product.vkPrice)}</p>
              </div>
              <ProfitMarginDisplay
                ekPrice={product.ekPrice}
                vkPrice={product.vkPrice}
                mwst={product.mwst}
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className={`text-sm ${
                product.istBestand <= 0 ? 'text-red-600' :
                product.istBestand <= 10 ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                Stock: {product.istBestand}
              </span>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/dashboard/products/${product.artikelNr}/edit`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}