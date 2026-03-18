import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { BackButton } from '../../../components/navigation/BackButton';
import { OrderItems } from '../../../features/orders/components/EditOrder/OrderItems';
import { OrderDetails } from '../../../features/orders/components/EditOrder/OrderDetails';
import { useOrderEdit } from '../../../features/orders/hooks/useOrderEdit';

export function EditOrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    order,
    isLoading,
    isSubmitting,
    error,
    handleUpdateOrder,
    handleUpdateItem,
    handleAddItem,
    handleRemoveItem,
    handleUpdateDiscount,
    handleSubmit
  } = useOrderEdit(id!);

  if (isLoading || !order) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="text-sm text-gray-500">Loading order...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-3 sm:px-0">
      <div className="mb-4">
        <BackButton to="/dashboard/orders" label="Back to Orders" />
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Edit Order #{order.id}</h1>
        
        <OrderDetails
          order={order}
          onStatusChange={(status) => handleUpdateOrder({ ...order, status })}
          onPaymentStatusChange={(paymentStatus) => handleUpdateOrder({ ...order, paymentStatus })}
          onDateChange={(date) => handleUpdateOrder({ ...order, orderDate: new Date(date) })}
        />
      </div>

      <OrderItems
        items={order.items}
        discount={order.discount}
        onUpdateItem={handleUpdateItem}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onUpdateDiscount={handleUpdateDiscount}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 sm:space-x-0">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/orders')}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          isLoading={isSubmitting}
          className="w-full sm:w-auto"
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}