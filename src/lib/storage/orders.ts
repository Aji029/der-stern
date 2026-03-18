import { STORAGE_KEYS } from './constants';
import { getStorageData, setStorageData } from './utils';
import type { Order } from '../../types/order';

export const fetchOrders = async (): Promise<Order[]> => {
  return getStorageData<Order>(STORAGE_KEYS.ORDERS, []);
};

export const createOrder = async (order: Omit<Order, 'id'>): Promise<void> => {
  const orders = await fetchOrders();
  const newOrder = {
    ...order,
    id: `ORD-${String(orders.length + 1).padStart(3, '0')}`,
    orderDate: new Date(order.orderDate),
    deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : undefined,
  };
  setStorageData(STORAGE_KEYS.ORDERS, [...orders, newOrder]);
};

export const updateOrder = async (id: string, order: Order): Promise<void> => {
  const orders = await fetchOrders();
  const updatedOrders = orders.map(o => o.id === id ? {
    ...order,
    orderDate: new Date(order.orderDate),
    deliveryDate: order.deliveryDate ? new Date(order.deliveryDate) : undefined,
  } : o);
  setStorageData(STORAGE_KEYS.ORDERS, updatedOrders);
};

export const deleteOrder = async (id: string): Promise<void> => {
  const orders = await fetchOrders();
  const updatedOrders = orders.filter(o => o.id !== id);
  setStorageData(STORAGE_KEYS.ORDERS, updatedOrders);
};