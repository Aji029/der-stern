import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../../context/OrderContext';
import { validateOrderForm } from './validation';
import { calculateOrderTotal } from '../../../utils/orderCalculations';
import type { OrderFormData } from '../types/orderForm';

const initialFormData: OrderFormData = {
  customerId: '',
  items: [],
  deliveryDate: '',
  shippingAddress: '',
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

      const validItems = formData.items.filter(item => 
        item.product.artikelNr && 
        item.quantity > 0 && 
        item.ekPrice > 0 && 
        item.vkPrice > 0
      );

      // Calculate order totals
      const { totalAmount, finalAmount } = calculateOrderTotal(validItems);

      await addOrder({
        customer: { id: formData.customerId } as any,
        items: validItems,
        status: formData.status,
        totalAmount,
        finalAmount,
        orderDate: new Date(),
        deliveryDate: formData.deliveryDate ? new Date(formData.deliveryDate) : undefined,
        paymentStatus: formData.paymentStatus,
        shippingAddress: formData.shippingAddress,
      });

      navigate('/dashboard/orders');
    } catch (error: any) {
      console.error('Failed to create order:', error);
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
    setFormData,
    isSubmitting,
    errors,
    handleSubmit,
    handleCustomerChange,
    handleItemsChange,
    handleDetailsChange,
  };
}