import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../../components/ui/Button';
import { CustomerSelect } from './CustomerSelect';
import { OrderItems } from './OrderItems';
import { OrderDetails } from './OrderDetails';
import { useOrderForm } from '../../hooks/useOrderForm';
import type { OrderItem } from '../../types';

export function OrderForm() {
  const navigate = useNavigate();
  const {
    formData,
    setFormData,
    isSubmitting,
    errors,
    handleSubmit,
    handleUpdateItem,
  } = useOrderForm();

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product: { artikelNr: '', name: '', mwst: 'A' },
          quantity: 1,
          ekPrice: 0,
          vkPrice: 0,
          total: 0,
        },
      ],
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <CustomerSelect
          value={formData.customerId}
          onChange={(value) => setFormData(prev => ({ ...prev, customerId: value }))}
          error={errors.customerId}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <OrderItems
          items={formData.items}
          onAddItem={handleAddItem}
          onUpdateItem={handleUpdateItem}
          onRemoveItem={handleRemoveItem}
          errors={errors}
        />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <OrderDetails
          deliveryDate={formData.deliveryDate}
          shippingAddress={formData.shippingAddress}
          notes={formData.notes}
          onDeliveryDateChange={(date) => setFormData(prev => ({ ...prev, deliveryDate: date }))}
          onShippingAddressChange={(address) => setFormData(prev => ({ ...prev, shippingAddress: address }))}
          onNotesChange={(notes) => setFormData(prev => ({ ...prev, notes }))}
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