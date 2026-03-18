import React, { createContext, useContext, useState, useEffect } from 'react';
import { useOrders as useOrdersData } from '../../../../context/OrderContext';

interface OrdersContextType {
  orders: any[];
  selectedOrders: string[];
  toggleOrderSelection: (ids: string[]) => void;
  filters: {
    search: string;
    status: string;
    dateFrom: string;
    dateTo: string;
    supplierId: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    search: string;
    status: string;
    dateFrom: string;
    dateTo: string;
    supplierId: string;
  }>>;
  notifications: Array<{
    type: 'warning' | 'success' | 'error';
    message: string;
  }>;
  updateOrder: (id: string, data: any) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { orders: allOrders, updateOrder, deleteOrder } = useOrdersData();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    supplierId: '',
  });
  const [notifications, setNotifications] = useState<Array<{
    type: 'warning' | 'success' | 'error';
    message: string;
  }>>([]);

  // Filter orders based on current filters
  const filteredOrders = React.useMemo(() => {
    return allOrders.filter(order => {
      if (filters.search && !order.id.toLowerCase().includes(filters.search.toLowerCase()) &&
          !order.customer.companyName.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.status && order.status !== filters.status) {
        return false;
      }
      if (filters.supplierId && !order.items.some(item => item.product.supplierId === filters.supplierId)) {
        return false;
      }
      if (filters.dateFrom && new Date(order.orderDate) < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && new Date(order.orderDate) > new Date(filters.dateTo)) {
        return false;
      }
      return true;
    });
  }, [allOrders, filters]);

  const toggleOrderSelection = (ids: string[]) => {
    setSelectedOrders(ids);
  };

  return (
    <OrdersContext.Provider value={{
      orders: filteredOrders,
      selectedOrders,
      toggleOrderSelection,
      filters,
      setFilters,
      notifications,
      updateOrder,
      deleteOrder,
    }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}