import { useState, useMemo } from 'react';

interface PaginationOptions {
  pageSize?: number;
  initialPage?: number;
}

export function usePagination<T>(items: T[], options: PaginationOptions = {}) {
  const { pageSize = 10, initialPage = 1 } = options;
  const [currentPage, setCurrentPage] = useState(initialPage);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  // Ensure current page is valid when data changes
  const validatedCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  if (validatedCurrentPage !== currentPage) {
    setCurrentPage(validatedCurrentPage);
  }

  const paginatedItems = useMemo(() => {
    const start = (validatedCurrentPage - 1) * pageSize;
    const end = start + pageSize;
    return items.slice(start, end);
  }, [items, validatedCurrentPage, pageSize]);

  const setPage = (page: number) => {
    const newPage = Math.min(Math.max(1, page), totalPages);
    setCurrentPage(newPage);
  };

  return {
    currentPage: validatedCurrentPage,
    setCurrentPage: setPage,
    totalPages,
    pageSize,
    paginatedItems,
    totalItems: items.length
  };
}