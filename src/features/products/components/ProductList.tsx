import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ProfitMarginDisplay } from '../../../components/ProfitMarginDisplay';
import { formatPrice } from '../../../utils/priceCalculations';
import { useProducts } from '../../../context/ProductContext';
import type { Product } from '../../../types/product';

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  const navigate = useNavigate();
  const { deleteProduct } = useProducts();

  const handleDelete = async (artikelNr: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(artikelNr);
      } catch (error) {
        console.error('Failed to delete product:', error);
        alert('Failed to delete product. Please try again.');
      }
    }
  };

  if (products.length === 0) {
    return (
      <div className="bg-white p-8 text-center rounded-lg border border-gray-200">
        <p className="text-gray-500">No products found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map(product => (
        <div
          key={product.artikelNr}
          className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
        >
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

          <div className="space-y-2">
            <h3 className="font-semibold text-lg truncate" title={product.name}>
              {product.name}
            </h3>
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
            </div>

            <ProfitMarginDisplay
              ekPrice={product.ekPrice}
              vkPrice={product.vkPrice}
              mwst={product.mwst}
            />

            <div className="flex justify-between items-center pt-2 border-t">
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(product.artikelNr)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}