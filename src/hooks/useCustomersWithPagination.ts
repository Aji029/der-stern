import { useEffect } from 'react';
import { useServerPagination } from './useServerPagination';
import type { Customer } from '../types/customer';

export function useCustomersWithPagination(pageSize = 15) {
  const pagination = useServerPagination<Customer>('customers', { pageSize });

  useEffect(() => {
    pagination.fetchPage(1);
  }, []);

  return pagination;
}