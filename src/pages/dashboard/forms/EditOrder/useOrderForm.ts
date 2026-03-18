import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../../../context/OrderContext';
import { calculateOrderTotals } from '../../../../utils/orderCalculations';
import type { Order } from '../../../../types/order';

export function useOrderForm(orderId: string) {
  const navigate = useNavigate();
  const { orders, updateOrder } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orderData = orders.find(o => o.id === orderId);
    if (orderData) {
      setOrder(orderData);
    } else {
      navigate('/dashboard/orders');
    }
  }, [orderId, orders, navigate]);

  const handleUpdateOrder = (updates: Partial<Order>) => {
    if (!order) return;
    setOrder({ ...order, ...updates });
  };

  const handleUpdateItem = (index: number, updates: Partial<any>) => {
    if (!order) return;
    const updatedItems = [...order.items];
    updatedItems[index] = { ...updatedItems[index], ...updates };
    setOrder({ ...order, items: updatedItems });
  };

  const handleSubmit = async () => {
    if (!order) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const { totalAmount } = calculateOrderTotals(order.items);
      if (typeof totalAmount !== 'number' || isNaN(totalAmount)) {
        throw new Error('Invalid order total');
      }

      await updateOrder(orderId, {
        ...order,
        totalAmount,
        updated_at: new Date(),
      });

      navigate('/dashboard/orders');
    } catch (err: any) {
      setError(err.message);
      console.error('Error updating order:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    order,
    isSubmitting,
    error,
    handleUpdateOrder,
    handleUpdateItem,
    handleSubmit,
  };
}