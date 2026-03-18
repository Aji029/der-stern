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
  isLoading: boolean;
  error: string | null;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching products from Supabase...');

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

        // Update state progressively as we receive data
        const mappedProducts = mapProductsFromDB(allProducts);
        setProducts(mappedProducts);

        console.log(`Fetched ${count} products so far...`);
      }

      console.log(`Successfully fetched all ${allProducts.length} products`);
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
    loadProducts();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('products_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'products' 
      }, (payload) => {
        console.log('Received realtime update:', payload);
        loadProducts();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

// Helper function to map database fields to frontend model
function mapProductsFromDB(data: any[]): Product[] {
  return data.map(item => ({
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
    bestellnummer: item.bestellnummer
  }));
}