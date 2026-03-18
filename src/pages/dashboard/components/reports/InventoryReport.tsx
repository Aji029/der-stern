import React from 'react';
import { useProducts } from '../../../../context/ProductContext';
import { formatPrice } from '../../../../utils/priceCalculations';

export function InventoryReport() {
  const { products } = useProducts();

  const totalProducts = products.length;
  const totalStock = products.reduce((sum, product) => sum + product.istBestand, 0);
  const lowStockProducts = products.filter(product => product.istBestand <= 10);
  const outOfStockProducts = products.filter(product => product.istBestand <= 0);

  const inventoryValue = products.reduce(
    (sum, product) => sum + product.ekPrice * product.istBestand,
    0
  );

  const productsByGroup = products.reduce((acc, product) => {
    acc[product.produktgruppe] = (acc[product.produktgruppe] || []).concat(product);
    return acc;
  }, {} as Record<string, typeof products>);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Products</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{totalProducts}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Stock</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{totalStock}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Low Stock Items</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {lowStockProducts.length}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Inventory Value</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {formatPrice(inventoryValue)}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Stock by Product Group</h3>
        <div className="space-y-6">
          {Object.entries(productsByGroup).map(([group, products]) => (
            <div key={group}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Group {group}
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map(product => (
                    <div
                      key={product.artikelNr}
                      className="bg-white p-4 rounded shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">Art. Nr: {product.artikelNr}</p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            product.istBestand <= 0
                              ? 'bg-red-100 text-red-800'
                              : product.istBestand <= 10
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          Stock: {product.istBestand}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {outOfStockProducts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Out of Stock Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outOfStockProducts.map(product => (
              <div
                key={product.artikelNr}
                className="bg-red-50 p-4 rounded-lg"
              >
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-500">Art. Nr: {product.artikelNr}</p>
                <p className="text-sm text-red-600 mt-1">Stock: {product.istBestand}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}