import { STORAGE_KEYS } from './constants';
import { getStorageData, setStorageData } from './utils';
import type { Product } from '../../types/product';

export const fetchProducts = async (): Promise<Product[]> => {
  return getStorageData<Product>(STORAGE_KEYS.PRODUCTS, []);
};

export const createProduct = async (product: Omit<Product, 'image'> & { image: File | null }): Promise<void> => {
  const products = await fetchProducts();
  const imageUrl = product.image ? URL.createObjectURL(product.image) : null;
  const newProduct = { ...product, image: imageUrl };
  setStorageData(STORAGE_KEYS.PRODUCTS, [...products, newProduct]);
};

export const updateProduct = async (artikelNr: string, product: Omit<Product, 'image'> & { image: File | null }): Promise<void> => {
  const products = await fetchProducts();
  const imageUrl = product.image instanceof File 
    ? URL.createObjectURL(product.image)
    : products.find(p => p.artikelNr === artikelNr)?.image || null;
  
  const updatedProducts = products.map(p => 
    p.artikelNr === artikelNr ? { ...product, image: imageUrl } : p
  );
  setStorageData(STORAGE_KEYS.PRODUCTS, updatedProducts);
};

export const deleteProduct = async (artikelNr: string): Promise<void> => {
  const products = await fetchProducts();
  const updatedProducts = products.filter(p => p.artikelNr !== artikelNr);
  setStorageData(STORAGE_KEYS.PRODUCTS, updatedProducts);
};