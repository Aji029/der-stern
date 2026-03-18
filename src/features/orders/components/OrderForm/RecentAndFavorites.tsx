import React from 'react';
import { History, Plus, Check, Search } from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { useProducts } from '../../../../context/ProductContext';
import { formatPrice } from '../../../../utils/priceCalculations';
import { supabase } from '../../../../lib/supabase';
import type { Product } from '../../../../types/product';
import type { OrderItem } from '../../../../types/order';

interface ProductWithQuantity extends Product {
  quantity: number;
}

interface RecentAndFavoritesProps {
  customerId: string;
  onAddProduct: (product: Product) => void;
  currentItems: OrderItem[];
}

export function RecentAndFavorites({ customerId, onAddProduct, currentItems }: RecentAndFavoritesProps) {
  const { products } = useProducts();
  const [frequentProducts, setFrequentProducts] = React.useState<Product[]>([]);
  const [quantities, setQuantities] = React.useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Create a Set of already added product IDs for efficient lookup
  const addedProductIds = new Set(currentItems.map(item => item.product.artikelNr));

  const handleQuantityChange = (artikelNr: string, value: string) => {
    const quantity = parseInt(value) || 1;
    setQuantities(prev => ({
      ...prev,
      [artikelNr]: Math.max(1, quantity)
    }));
  };

  const handleAddProduct = (product: Product) => {
    const quantity = quantities[product.artikelNr] || 1;
    const productWithQuantity = {
      ...product,
      quantity
    };
    onAddProduct(productWithQuantity);
    // Reset quantity after adding
    setQuantities(prev => {
      const { [product.artikelNr]: _, ...rest } = prev;
      return rest;
    });
  };

  React.useEffect(() => {
    async function fetchCustomerFavorites() {
      if (!customerId) {
        setFrequentProducts([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // First get completed orders for this customer
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            id,
            items:order_items(
              product_id,
              quantity
            )
          `)
          .eq('customer_id', customerId)
          .eq('status', 'Completed')
          .order('created_at', { ascending: false });

        if (orderError) throw orderError;

        // Calculate product frequency and total quantity
        const productStats: Record<string, { count: number; quantity: number }> = {};
        
        orderData?.forEach(order => {
          order.items?.forEach((item: any) => {
            if (!productStats[item.product_id]) {
              productStats[item.product_id] = { count: 0, quantity: 0 };
            }
            productStats[item.product_id].count += 1;
            productStats[item.product_id].quantity += item.quantity;
          });
        });

        // Sort products by frequency and get top 8
        const sortedProducts = Object.entries(productStats)
          .sort(([, a], [, b]) => b.count - a.count)
          .slice(0, 8)
          .map(([artikelNr]) => products.find(p => p.artikelNr === artikelNr))
          .filter((p): p is Product => p !== undefined);

        setFrequentProducts(sortedProducts);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching customer favorites:', err);
        setError(err.message);
        setFrequentProducts([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCustomerFavorites();
  }, [customerId, products]);

  const filteredProducts = React.useMemo(() => {
    if (!searchTerm) return frequentProducts;
    
    return frequentProducts.filter(product => 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.artikelNr.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [frequentProducts, searchTerm]);

  if (!customerId) {
    return null;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium flex items-center">
          <History className="h-5 w-5 text-gray-500 mr-2" />
          Frequently Ordered Products
        </h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          Error loading favorites: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mx-auto"></div>
          </div>
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map(product => {
            const isAdded = addedProductIds.has(product.artikelNr);
            
            return (
              <div
                key={product.artikelNr}
                className={`flex justify-between items-center p-3 bg-white rounded-lg border transition-all ${
                  isAdded 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 hover:border-yellow-500 hover:shadow-sm'
                }`}
              >
                <div>
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatPrice(product.vkPrice)}
                    {!isAdded && (
                      <div className="mt-2">
                        <input
                          type="number"
                          min="1"
                          value={quantities[product.artikelNr] || 1}
                          onChange={(e) => handleQuantityChange(product.artikelNr, e.target.value)}
                          className="w-20 px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-blue-500"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant={isAdded ? "outline" : "default"}
                  size="sm"
                  onClick={() => !isAdded && handleAddProduct(product)}
                  disabled={isAdded}
                  className={isAdded ? "text-green-600 border-green-200" : ""}
                >
                  {isAdded ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center text-gray-500 py-4">
            {searchTerm ? 'No products found' : 'No order history yet'}
          </div>
        )}
      </div>
    </div>
  );
}