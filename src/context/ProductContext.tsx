import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, retryRequest } from '../lib/supabase';
import type { Product } from '../types/product';

interface ProductContextType {
  products: Product[];
  getProduct: (artikelNr: string) => Product | undefined;
  addProduct: (product: Omit<Product, 'image'> & { image: File | null }) => Promise<void>;
  updateProduct: (artikelNr: string, product: Omit<Product, 'image'> & { image: File | null }) => Promise<void>;
  deleteProduct: (artikelNr: string) => Promise<void>;
  patchEKPrice: (artikelNr: string, newPrice: number) => void;
  patchVKPrice: (artikelNr: string, newPrice: number) => void;
  patchSupplier: (artikelNr: string, supplierId: string) => void;
  isLoading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

// Per-session cache so a browser refresh shows products instantly instead of
// waiting on a full re-download of every product. Cleared when the tab closes.
const PRODUCTS_CACHE_KEY = 'der-stern-products-cache';

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      setError(null);

      let allProducts: any[] = [];
      let count = 0;
      let hasMore = true;
      const PAGE_SIZE = 1000; // Fetch in chunks of 1000

      // Fetch products in chunks until we have them all
      while (hasMore) {
        const { data, error: fetchError, count: totalCount } = await retryRequest(() =>
          supabase
            .from('products')
            .select('*', { count: 'exact' })
            .range(count, count + PAGE_SIZE - 1)
            .order('created_at', { ascending: false })
        );

        if (fetchError) {
          console.error('Error fetching products:', fetchError);
          throw fetchError;
        }

        if (!data) {
          throw new Error('No products data received');
        }

        allProducts = [...allProducts, ...data];
        count += data.length;

        // Check if we have all products
        if (totalCount && count >= totalCount) {
          hasMore = false;
        }

        // Show progress only on a cold load. When revalidating silently (cache
        // already on screen) we set once at the end to avoid a 2101->1000->2101 flicker.
        if (!silent) setProducts(mapProductsFromDB(allProducts));
      }

      setProducts(mapProductsFromDB(allProducts));
      setError(null);
    } catch (err: any) {
      const handledError = supabase.handleError(err);
      console.error('Failed to fetch products:', handledError);
      setError(handledError.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Hydrate instantly from the per-session cache, then revalidate in the
    // background so a refresh doesn't block on a full product re-download.
    let hadCache = false;
    try {
      const raw = sessionStorage.getItem(PRODUCTS_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        // Cache holds already-mapped Product[] (kept in sync below), so use it directly.
        if (Array.isArray(cached) && cached.length > 0) {
          setProducts(cached);
          setIsLoading(false);
          hadCache = true;
        }
      }
    } catch { /* ignore corrupt cache */ }

    loadProducts(hadCache);

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('products_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
        // Incremental update — apply payload.new directly to avoid race with optimistic updates
        const updated = payload.new as any;
        setProducts(prev =>
          prev.map(p => p.artikelNr === updated.artikel_nr ? mapProductFromDB(updated) : p)
        );
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, () => {
        loadProducts();
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'products' }, () => {
        loadProducts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Keep the session cache in step with what's on screen — including optimistic
  // price edits and realtime patches — so a refresh never flashes a stale price.
  useEffect(() => {
    if (products.length === 0) return;
    try {
      sessionStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products));
    } catch { /* quota exceeded / unavailable — cache is best-effort */ }
  }, [products]);

  const getProduct = (artikelNr: string) => {
    return products.find(p => p.artikelNr === artikelNr);
  };

  const addProduct = async (newProduct: Omit<Product, 'image'> & { image: File | null }) => {
    try {
      setIsLoading(true);
      await retryRequest(() => supabase
        .from('products')
        .insert([{
          artikel_nr: newProduct.artikelNr.trim().toUpperCase(),
          name: newProduct.name,
          vk_price: newProduct.vkPrice,
          ek_price: newProduct.ekPrice,
          mwst: newProduct.mwst,
          packung_art: newProduct.packungArt,
          herkunftsland: newProduct.herkunftsland,
          produktgruppe: newProduct.produktgruppe,
          supplier_id: newProduct.supplierId,
          ist_bestand: newProduct.istBestand,
          bestellnummer: newProduct.bestellnummer
        }]));
      await loadProducts();
    } catch (err: any) {
      const handledError = supabase.handleError(err);
      console.error('Failed to add product:', handledError);
      setError(handledError.message);
      throw handledError;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProduct = async (artikelNr: string, updatedProduct: Omit<Product, 'image'> & { image: File | null }) => {
    try {
      setIsLoading(true);
      await retryRequest(() => supabase
        .from('products')
        .update({
          name: updatedProduct.name,
          vk_price: updatedProduct.vkPrice,
          ek_price: updatedProduct.ekPrice,
          mwst: updatedProduct.mwst,
          packung_art: updatedProduct.packungArt,
          herkunftsland: updatedProduct.herkunftsland,
          produktgruppe: updatedProduct.produktgruppe,
          supplier_id: updatedProduct.supplierId,
          ist_bestand: updatedProduct.istBestand,
          bestellnummer: updatedProduct.bestellnummer
        })
        .eq('artikel_nr', artikelNr));
      await loadProducts();
    } catch (err: any) {
      const handledError = supabase.handleError(err);
      console.error('Failed to update product:', handledError);
      setError(handledError.message);
      throw handledError;
    } finally {
      setIsLoading(false);
    }
  };

  const patchEKPrice = (artikelNr: string, newPrice: number) => {
    setProducts(prev => prev.map(p =>
      p.artikelNr === artikelNr ? { ...p, ekPrice: newPrice } : p
    ));
  };

  const patchVKPrice = (artikelNr: string, newPrice: number) => {
    setProducts(prev => prev.map(p =>
      p.artikelNr === artikelNr ? { ...p, vkPrice: newPrice } : p
    ));
  };

  const patchSupplier = (artikelNr: string, supplierId: string) => {
    setProducts(prev => prev.map(p =>
      p.artikelNr === artikelNr ? { ...p, supplierId } : p
    ));
  };

  const deleteProduct = async (artikelNr: string) => {
    try {
      setIsLoading(true);
      await retryRequest(() => supabase
        .from('products')
        .delete()
        .eq('artikel_nr', artikelNr));
      await loadProducts();
    } catch (err: any) {
      const handledError = supabase.handleError(err);
      console.error('Failed to delete product:', handledError);
      setError(handledError.message);
      throw handledError;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ProductContext.Provider value={{
      products,
      getProduct,
      addProduct,
      updateProduct,
      deleteProduct,
      patchEKPrice,
      patchVKPrice,
      patchSupplier,
      isLoading,
      error,
      refreshProducts: loadProducts
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}

// Helper function to map a single database row to the frontend model
function mapProductFromDB(item: any): Product {
  return {
    artikelNr: item.artikel_nr,
    name: item.name,
    vkPrice: parseFloat(item.vk_price),
    ekPrice: parseFloat(item.ek_price),
    mwst: item.mwst,
    packungArt: item.packung_art,
    herkunftsland: item.herkunftsland,
    produktgruppe: item.produktgruppe,
    supplierId: item.supplier_id,
    image: item.image_url,
    istBestand: item.ist_bestand || 0,
    bestellnummer: item.bestellnummer,
  };
}

// Helper function to map database fields to frontend model
function mapProductsFromDB(data: any[]): Product[] {
  return data.map(mapProductFromDB);
}