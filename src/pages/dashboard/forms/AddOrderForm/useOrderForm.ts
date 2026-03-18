import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../../../context/OrderContext';
import { validateOrderForm } from './validation';
import type { OrderFormData } from './types';

const initialFormData: OrderFormData = {
  customerId: '',
  items: [],
  deliveryDate: '',
  shippingAddress: '',
  notes: '',
  status: 'Pending',
  paymentStatus: 'Pending',
};

export function useOrderForm() {
  const navigate = useNavigate();
  const { addOrder } = useOrders();
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

      await addOrder({
        customer: { id: formData.customerId } as any,
        items: formData.items,
        status: formData.status,
        totalAmount: formData.items.reduce((sum, item) => sum + (item.quantity * item.vkPrice), 0),
        orderDate: new Date(),
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
    setFormData(prev => ({ ...prev, customerId }));
  };

  const handleItemsChange = (items: any[]) => {
    setFormData(prev => ({ ...prev, items }));
  };

  const handleDetailsChange = (details: Partial<OrderFormData>) => {
    setFormData(prev => ({ ...prev, ...details }));
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