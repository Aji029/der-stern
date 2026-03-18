import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../api/orderApi';
import { validateOrderForm } from '../utils/validation';
import type { OrderFormData, OrderItem } from '../types';

const initialFormData: OrderFormData = {
  customerId: '',
  items: [],
  deliveryDate: '',
  shippingAddress: '',
  notes: '',
};

export function useOrderForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<OrderFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateOrderForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});

      const validItems = formData.items.filter(item => 
        item.product.artikelNr && 
        item.quantity > 0 && 
        item.ekPrice > 0 && 
        item.vkPrice > 0
      );

      await createOrder({
        customer: { id: formData.customerId } as any,
        items: validItems,
        status: 'Pending',
        totalAmount: validItems.reduce((sum, item) => sum + (item.quantity * item.vkPrice), 0),
        orderDate: new Date(),
        deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : undefined,
        paymentStatus: 'Pending',
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

  const handleUpdateItem = useCallback((index: number, updates: Partial<OrderItem>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, ...updates } : item
      ),
    }));
  }, []);

  return {
    formData,
    setFormData,
    isSubmitting,
    errors,
    handleSubmit,
    handleUpdateItem,
  };
}