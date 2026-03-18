import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface PaginationOptions {
  pageSize?: number;
  initialPage?: number;
}

interface PaginationState<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  isLoading: boolean;
  error: string | null;
}

export function useServerPagination<T>(
  table: string,
  options: PaginationOptions = {}
) {
  const { pageSize = 10, initialPage = 1 } = options;
  const [state, setState] = useState<PaginationState<T>>({
    items: [],
    currentPage: initialPage,
    totalPages: 0,
    totalItems: 0,
    isLoading: true,
    error: null,
  });

  const fetchPage = async (page: number, filters?: Record<string, any>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Calculate range for pagination
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      // Get total count first
      const { count: totalItems, error: countError } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .match(filters || {});

      if (countError) throw countError;

      // Then get paginated data
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .match(filters || {})
        .range(start, end)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const totalPages = Math.ceil((totalItems || 0) / pageSize);

      setState({
        items: data as T[],
        currentPage: page,
        totalPages,
        totalItems: totalItems || 0,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message,
      }));
    }
  };

  return {
    ...state,
    pageSize,
    fetchPage,
  };
}