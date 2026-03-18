import { useEffect } from 'react';
import { useServerPagination } from './useServerPagination';
import type { Product } from '../types/product';

export function useProductsWithPagination(pageSize = 20) {
  const pagination = useServerPagination<Product>('products', { pageSize });

  useEffect(() => {
    pagination.fetchPage(1);
  }, []);

  return pagination;
}