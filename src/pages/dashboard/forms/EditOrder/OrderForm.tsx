import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../components/ui/Button';
import { OrderHeader } from '../../../../features/orders/components/EditOrder/OrderHeader';
import { OrderDetails } from '../../../../features/orders/components/EditOrder/OrderDetails';
import { OrderItems } from './OrderItems';
import { OrderNotes } from '../../../../features/orders/components/EditOrder/OrderNotes';
import type { Order } from '../../../../types/order';

interface OrderFormProps {
  order: Order;
  products: any[];
  suppliers: any[];
  isSubmitting: boolean;
  error: string | null;
  onUpdateOrder: (updates: Partial<Order>) => void;
  onUpdateItem: (index: number, updates: Partial<any>) => void;
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onSubmit: () => void;
}

export function OrderForm({
  order,
  products,
  suppliers,
  isSubmitting,
  error,
  onUpdateOrder,
  onUpdateItem,
  onAddItem,
  onRemoveItem,
  onSubmit,
}: OrderFormProps) {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto py-6 space-y-6">
      <OrderHeader order={order} />
      
      <OrderDetails
        order={order}
        onStatusChange={(status) => onUpdateOrder({ status })}
        onPaymentStatusChange={(paymentStatus) => onUpdateOrder({ paymentStatus })}
        onDateChange={(date) => onUpdateOrder({ orderDate: new Date(date) })}
      />

      <OrderItems
        items={order.items}
        products={products}
        suppliers={suppliers}
        onUpdateItem={onUpdateItem}
        onAddItem={onAddItem}
        onRemoveItem={onRemoveItem}
      />

      <OrderNotes
        notes={order.notes || ''}
        onChange={(notes) => onUpdateOrder({ notes })}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/orders')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={onSubmit}
          isLoading={isSubmitting}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}