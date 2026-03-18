import { useState, useMemo } from 'react';
import { useProducts } from '../../../context/ProductContext';

export interface ProductFilters {
  search: string;
  category: string;
  status: string;
}

export function useProductFilters() {
  const { products } = useProducts();
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: 'All',
    status: 'All',
  });

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search filter
      const searchMatch = 
        !filters.search || 
        product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.artikelNr.toLowerCase().includes(filters.search.toLowerCase());

      // Category filter
      const categoryMatch = 
        filters.category === 'All' || 
        product.produktgruppe === filters.category;

      // Status filter
      const statusMatch = filters.status === 'All' || (
        filters.status === 'In Stock' && product.istBestand > 10 ||
        filters.status === 'Low Stock' && product.istBestand <= 10 && product.istBestand > 0 ||
        filters.status === 'Out of Stock' && product.istBestand <= 0
      );

      return searchMatch && categoryMatch && statusMatch;
    });
  }, [products, filters]);

  return {
    filters,
    setFilters,
    filteredProducts,
  };
}