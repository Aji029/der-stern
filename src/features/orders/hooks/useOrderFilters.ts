import { useState, useMemo } from 'react';
import { useOrders } from '../../../context/OrderContext';
import { isSameDay } from '../../../utils/dateFormatting';

export interface OrderFilters {
  search: string;
  date: string;
}

export function useOrderFilters() {
  const { orders } = useOrders();
  const [filters, setFilters] = useState<OrderFilters>({
    search: '',
    date: '',
  });

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter
      const searchTerm = filters.search.toLowerCase();
      const searchMatch = !searchTerm || 
        order.id.toLowerCase().includes(searchTerm) ||
        order.customer.companyName.toLowerCase().includes(searchTerm) ||
        order.customer.contactPerson.toLowerCase().includes(searchTerm);

      // Date filter
      const dateMatch = !filters.date || 
        isSameDay(order.orderDate, filters.date);

      return searchMatch && dateMatch;
    });
  }, [orders, filters]);

  return {
    filters,
    setFilters,
    filteredOrders,
  };
}