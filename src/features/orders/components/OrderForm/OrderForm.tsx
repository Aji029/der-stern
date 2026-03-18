import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../components/ui/Button';
import { CustomerSelect } from './CustomerSelect';
import { OrderItems } from './OrderItems';
import { OrderDetails } from './OrderDetails';
import { useOrderForm } from '../../hooks/useOrderForm';

export function OrderForm() {
  const navigate = useNavigate();
  const {
    formData,
    setFormData,
    isSubmitting,
    errors,
    handleSubmit,
    handleCustomerChange,
    handleItemsChange,
    handleDetailsChange,
  } = useOrderForm();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <CustomerSelect
          value={formData.customerId}
          onChange={handleCustomerChange}
          error={errors.customerId}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <OrderItems
          items={formData.items}
          onChange={handleItemsChange}
          errors={errors}
          customerId={formData.customerId}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <OrderDetails
          deliveryDate={formData.deliveryDate}
          shippingAddress={formData.shippingAddress}
          onDeliveryDateChange={(date) => handleDetailsChange({ deliveryDate: date })}
          onShippingAddressChange={(address) => handleDetailsChange({ shippingAddress: address })}
          errors={errors}
        />
      </div>

      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errors.submit}
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          type="button"
          onClick={() => navigate('/dashboard/orders')}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting}
        >
          Create Order
        </Button>
      </div>
    </form>
  );
}