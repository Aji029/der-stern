import { useEffect } from 'react';
import { useServerPagination } from './useServerPagination';
import type { SammelrechnungWithDetails } from '../types/sammelrechnung';

export function useSammelrechnungenWithPagination(pageSize = 15) {
  const pagination = useServerPagination<SammelrechnungWithDetails>('sammelrechnungen', { pageSize });

  useEffect(() => {
    pagination.fetchPage(1);
  }, []);

  return pagination;
}