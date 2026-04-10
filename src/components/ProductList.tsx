import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import { ProfitMarginDisplay } from './ProfitMarginDisplay';
import { EditableEKPrice } from './ui/EditableEKPrice';
import { formatPrice } from '../utils/priceCalculations';
import { useEKPriceUpdate } from '../hooks/useEKPriceUpdate';
import { useVKPriceUpdate } from '../hooks/useVKPriceUpdate';
import type { Product } from '../types/product';

interface ProductListProps {
  products: Product[];
  onDelete: (artikelNr: string) => void;
  selectedProducts: Product[];
  onToggleSelect: (product: Product) => void;
}

export function ProductList({
  products,
  onDelete,
  selectedProducts,
  onToggleSelect
}: ProductListProps) {
  const navigate = useNavigate();
  const selectedProductIds = new Set(selectedProducts.map(p => p.artikelNr));
  const { updatePriceAndOrders } = useEKPriceUpdate();
  const { updateVKPriceAndOrders } = useVKPriceUpdate();

  if (products.length === 0) {
    return (
      <div className="bg-white p-8 text-center rounded-lg border border-gray-200">
        <p className="text-gray-500">No products found</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-12 px-6 py-3">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={products.length > 0 && products.every(p => selectedProductIds.has(p.artikelNr))}
                  onChange={(e) => onToggleSelect(products[0], e.target.checked)}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                EK Price
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                VK Price
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Margin
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr 
                key={product.artikelNr} 
                className={`hover:bg-gray-50 ${
                  selectedProductIds.has(product.artikelNr) ? 'bg-blue-50' : ''
                }`}
              >
                <td className="px-6 py-4">
                  <input
                    type="checkbox"
                    checked={selectedProductIds.has(product.artikelNr)}
                    onChange={() => onToggleSelect(product)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    {product.image && (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-10 w-10 rounded-full object-cover mr-3"
                      />
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">Art. Nr: {product.artikelNr}</div>
                      {product.bestellnummer && (
                        <div className="text-sm text-gray-500">Order Nr: {product.bestellnummer}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <div className="flex justify-end">
                    <EditableEKPrice
                      value={product.ekPrice}
                      artikelNr={product.artikelNr}
                      onUpdate={(newPrice) => updatePriceAndOrders(product.artikelNr, newPrice)}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                  <div className="flex justify-end">
                    <EditableEKPrice
                      value={product.vkPrice}
                      artikelNr={product.artikelNr}
                      onUpdate={(newPrice) => updateVKPriceAndOrders(product.artikelNr, newPrice)}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.istBestand <= 0
                      ? 'bg-red-100 text-red-800'
                      : product.istBestand <= 10
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {product.istBestand}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                  <ProfitMarginDisplay
                    ekPrice={product.ekPrice}
                    vkPrice={product.vkPrice}
                    mwst={product.mwst}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}