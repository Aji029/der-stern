import { useState, useMemo } from 'react';
import { isSameDay } from '../utils/dateFormatting';
import type { Order } from '../types/order';

export function useOrderDateFilter(orders: Order[] = []) {
  const [selectedDate, setSelectedDate] = useState('');

  const filteredOrders = useMemo(() => {
    if (!selectedDate || !orders.length) return orders;

    return orders.filter(order => {
      try {
        return isSameDay(order.orderDate, selectedDate);
      } catch (error) {
        console.error('Date filtering error:', error);
        return false;
      }
    });
  }, [orders, selectedDate]);

  const clearDate = () => {
    setSelectedDate('');
  };

  return {
    selectedDate,
    setSelectedDate,
    clearDate,
    filteredOrders,
    hasFilter: !!selectedDate
  };
}