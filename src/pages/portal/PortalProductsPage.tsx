import React, { useState, useEffect } from 'react';
import { Search, Package, Plus, Check } from 'lucide-react';
import { usePortal } from '../../features/portal/context/PortalContext';
import { fetchCustomerOrderedProducts } from '../../lib/db/portal';
import type { PortalProduct } from '../../types/portal';

export function PortalProductsPage() {
  const { addToCart, cart, profileError, profile } = usePortal();
  const [products, setProducts] = useState<PortalProduct[]>([]);
  const [filtered, setFiltered] = useState<PortalProduct[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!profile?.customerId) return;
    setIsLoading(true);
    fetchCustomerOrderedProducts(profile.customerId)
      .then(data => {
        setProducts(data);
        setFiltered(data);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [profile?.customerId]);

  useEffect(() => {
    const q = search.toLowerCase().trim();
    if (!q) {
      setFiltered(products);
    } else {
      setFiltered(
        products.filter(p =>
          p.name.toLowerCase().includes(q) || p.artikelNr.toLowerCase().includes(q)
        )
      );
    }
  }, [search, products]);

  const inCart = (artikelNr: string) => cart.some(i => i.artikelNr === artikelNr);

  const handleAdd = (product: PortalProduct) => {
    const qty = quantities[product.artikelNr] || 1;
    addToCart({
      artikelNr: product.artikelNr,
      name: product.name,
      mwst: product.mwst,
      supplierId: product.supplierId,
    }, qty);
    setAddedItems(prev => new Set(prev).add(product.artikelNr));
    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev);
        next.delete(product.artikelNr);
        return next;
      });
    }, 2000);
    setQuantities(prev => {
      const { [product.artikelNr]: _, ...rest } = prev;
      return rest;
    });
  };

  if (profileError) {
    return (
      <div className="text-center py-16 text-red-500">{profileError}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-500 mt-1">Your previously ordered products</p>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or article number..."
          className="w-full pl-12 pr-4 py-3 border rounded-lg shadow-sm focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brand-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">
            {search ? `No products found matching "${search}"` : 'No previously ordered products found.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(product => {
            const alreadyInCart = inCart(product.artikelNr);
            const justAdded = addedItems.has(product.artikelNr);

            return (
              <div
                key={product.artikelNr}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-brand-300 hover:shadow-md transition-all flex flex-col"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-sm text-gray-400">Art. Nr: {product.artikelNr}</p>
                  {product.istBestand <= 0 && (
                    <span className="inline-block mt-2 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      Out of stock
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={quantities[product.artikelNr] || ''}
                    onChange={e => setQuantities(prev => ({ ...prev, [product.artikelNr]: parseFloat(e.target.value) || 1 }))}
                    placeholder="1"
                    className="w-20 px-2 py-1.5 border rounded-lg text-sm focus:ring-1 focus:ring-brand-400 focus:border-brand-400"
                  />
                  <button
                    onClick={() => handleAdd(product)}
                    disabled={justAdded}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg text-sm font-medium transition-colors ${
                      justAdded
                        ? 'bg-green-100 text-green-700'
                        : alreadyInCart
                        ? 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-300'
                        : 'bg-brand-500 text-white hover:bg-brand-600'
                    }`}
                  >
                    {justAdded ? (
                      <><Check className="h-4 w-4" /> Added</>
                    ) : alreadyInCart ? (
                      <><Plus className="h-4 w-4" /> Add more</>
                    ) : (
                      <><Plus className="h-4 w-4" /> Add to cart</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
