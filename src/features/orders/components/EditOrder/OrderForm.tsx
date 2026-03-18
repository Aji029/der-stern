import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../components/ui/Button';
import { ToastContainer } from '../../../../components/ui/Toast';
import { MobileActionBar } from './MobileActionBar';
import { OrderHeader } from './OrderHeader';
import { OrderDetails } from './OrderDetails';
import { OrderItems } from './OrderItems';
import { useOrderEdit } from '../../hooks/useOrderEdit';
import { useToast } from '../../../../hooks/useToast';
import type { Order } from '../../../../types/order';

interface OrderFormProps {
  order: Order;
  isSubmitting: boolean;
  error: string | null;
}

export function OrderForm({ order: initialOrder }: OrderFormProps) {
  const navigate = useNavigate();
  const { toasts, removeToast, success, error: showError } = useToast();
  const {
    order,
    isSubmitting,
    error,
    handleUpdateOrder,
    handleUpdateItem,
    handleAddItem,
    handleRemoveItem,
    handleUpdateDiscount,
    handleSubmit
  } = useOrderEdit(initialOrder.id);

  useEffect(() => {
    if (error) {
      showError(error);
    }
  }, [error, showError]);

  const handleSave = async () => {
    try {
      await handleSubmit();
      success('Order saved successfully!');
    } catch (err) {
      showError('Failed to save order. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/orders');
  };

  if (!order) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 space-y-3 sm:space-y-4">
        <OrderHeader order={order} />

        <OrderDetails
          order={order}
          onStatusChange={(status) => handleUpdateOrder({ ...order, status })}
          onPaymentStatusChange={(paymentStatus) => handleUpdateOrder({ ...order, paymentStatus })}
          onDateChange={(date) => handleUpdateOrder({ ...order, orderDate: new Date(date) })}
        />

        <OrderItems
          items={order.items}
          discount={order.discount}
          onUpdateItem={handleUpdateItem}
          onAddItem={handleAddItem}
          onRemoveItem={handleRemoveItem}
          onUpdateDiscount={handleUpdateDiscount}
        />

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-800 px-3 py-2 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {/* Desktop Action Buttons */}
        <div className="hidden md:flex justify-end space-x-3 pb-4">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={isSubmitting}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Mobile Action Bar */}
      <MobileActionBar
        items={order.items}
        onSave={handleSave}
        onCancel={handleCancel}
        isSubmitting={isSubmitting}
      />
    </>
  );
}