import React, { useState } from 'react';
import { useOrders } from '../../../../context/OrderContext';
import { Button } from '../../../../components/ui/Button';
import { formatDateForDisplay } from '../../../../utils/dateFormatting';
import { formatPrice } from '../../../../utils/priceCalculations';

interface OrderSelectionProps {
  customerId: string;
  onCreateSammelrechnung: (data: any) => Promise<void>;
}

export function OrderSelection({ customerId, onCreateSammelrechnung }: OrderSelectionProps) {
  const { orders } = useOrders();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter orders for this customer that aren't already in a Sammelrechnung
  const customerOrders = orders.filter(order => 
    order.customer.id === customerId && 
    !order.sammelrechnung_id &&
    order.status === 'Completed' // Only include completed orders
  );

  const handleCreateSammelrechnung = async () => {
    if (selectedOrders.length === 0) {
      setError('Please select at least one order');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Calculate totals
      const selectedOrdersData = orders.filter(order => selectedOrders.includes(order.id));
      const totalNetto = selectedOrdersData.reduce((sum, order) => {
        return sum + order.items.reduce((orderSum, item) => {
          const total = item.quantity * item.vkPrice;
          return orderSum + (item.product.mwst === 'A' ? total / 1.07 : total / 1.19);
        }, 0);
      }, 0);

      const totalVat = selectedOrdersData.reduce((sum, order) => {
        return sum + order.items.reduce((orderSum, item) => {
          const total = item.quantity * item.vkPrice;
          const netto = item.product.mwst === 'A' ? total / 1.07 : total / 1.19;
          return orderSum + (total - netto);
        }, 0);
      }, 0);

      const totalBrutto = selectedOrdersData.reduce((sum, order) => 
        sum + order.totalAmount, 0
      );

      await onCreateSammelrechnung({
        customer_id: customerId,
        orders: selectedOrders,
        total_netto: totalNetto,
        total_vat: totalVat,
        total_brutto: totalBrutto,
        status: 'draft',
        payment_status: 'pending'
      });

      // Clear selection after successful creation
      setSelectedOrders([]);
    } catch (err: any) {
      console.error('Failed to create Sammelrechnung:', err);
      setError(err.message || 'Failed to create Sammelrechnung');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (customerOrders.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <p className="text-gray-500 text-center">No available orders for this customer</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Select Orders</h2>
        <Button
          onClick={handleCreateSammelrechnung}
          disabled={selectedOrders.length === 0 || isSubmitting}
          isLoading={isSubmitting}
        >
          Create Sammelrechnung
        </Button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-100 text-red-600 text-sm">
          {error}
        </div>
      )}

      <div className="divide-y">
        {customerOrders.map(order => (
          <div
            key={order.id}
            className="p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <input
                type="checkbox"
                checked={selectedOrders.includes(order.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedOrders(prev => [...prev, order.id]);
                  } else {
                    setSelectedOrders(prev => prev.filter(id => id !== order.id));
                  }
                }}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Order #{order.id}</div>
                    <div className="text-sm text-gray-500">
                      {formatDateForDisplay(order.orderDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatPrice(order.totalAmount)}</div>
                    <div className="text-sm text-gray-500">{order.items.length} items</div>
                  </div>
                </div>
                
                {/* Show order items */}
                <div className="mt-2 pl-4 border-l-2 border-gray-200">
                  {order.items.map((item, index) => (
                    <div key={index} className="text-sm text-gray-600 flex justify-between">
                      <span>
                        {item.quantity}x {item.product.name}
                      </span>
                      <span className="text-gray-500">
                        {formatPrice(item.total)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}