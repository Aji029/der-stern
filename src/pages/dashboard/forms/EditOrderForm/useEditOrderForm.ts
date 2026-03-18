import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../../../context/OrderContext';
import { validateOrderForm } from '../AddOrderForm/validation';
import type { OrderFormData } from '../AddOrderForm/types';

export function useEditOrderForm(orderId: string) {
  const navigate = useNavigate();
  const { getOrder, updateOrder } = useOrders();
  const [formData, setFormData] = useState<OrderFormData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const order = getOrder(orderId);
    if (order) {
      setFormData({
        customerId: order.customer.id,
        items: order.items,
        deliveryDate: order.deliveryDate ? new Date(order.deliveryDate).toISOString().split('T')[0] : '',
        shippingAddress: order.shippingAddress,
        notes: order.notes || '',
        status: order.status,
        paymentStatus: order.paymentStatus,
      });
    } else {
      navigate('/dashboard/orders');
    }
  }, [orderId, getOrder, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    const validationErrors = validateOrderForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      const order = getOrder(orderId);
      if (!order) throw new Error('Order not found');

      await updateOrder(orderId, {
        ...order,
        customer: { ...order.customer, id: formData.customerId },
        items: formData.items,
        status: formData.status,
        deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : undefined,
        paymentStatus: formData.paymentStatus,
        shippingAddress: formData.shippingAddress,
        notes: formData.notes,
      });

      navigate('/dashboard/orders');
    } catch (error: any) {
      setErrors({ submit: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomerChange = (customerId: string) => {
    if (!formData) return;
    setFormData(prev => prev ? { ...prev, customerId } : null);
  };

  const handleItemsChange = (items: any[]) => {
    if (!formData) return;
    setFormData(prev => prev ? { ...prev, items } : null);
  };

  const handleDetailsChange = (details: Partial<OrderFormData>) => {
    if (!formData) return;
    setFormData(prev => prev ? { ...prev, ...details } : null);
  };

  return {
    formData,
    isSubmitting,
    errors,
    handleSubmit,
    handleCustomerChange,
    handleItemsChange,
    handleDetailsChange,
  };
}