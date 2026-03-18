import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../../components/ui/Button';
import { CustomerSelect } from '../AddOrderForm/CustomerSelect';
import { OrderItems } from '../AddOrderForm/OrderItems';
import { OrderDetails } from '../AddOrderForm/OrderDetails';
import { useEditOrderForm } from './useEditOrderForm';
import { BackButton } from '../../../../components/navigation/BackButton';

export function EditOrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    formData,
    isSubmitting,
    errors,
    handleSubmit,
    handleCustomerChange,
    handleItemsChange,
    handleDetailsChange,
  } = useEditOrderForm(id!);

  if (!formData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <BackButton to="/dashboard/orders" label="Back to Orders" />
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Edit Order</h1>

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
          />
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <OrderDetails
            data={formData}
            onChange={handleDetailsChange}
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
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}