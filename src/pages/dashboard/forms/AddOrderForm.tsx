import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { BackButton } from '../../../components/navigation/BackButton';
import { OrderForm } from '../../../features/orders/components/OrderForm/OrderForm';

export function AddOrderForm() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <BackButton to="/dashboard/orders" label="Back to Orders" />
      </div>

      <OrderForm />
    </div>
  );
}