import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { useProducts } from '../../context/ProductContext';
import { Button } from '../../components/ui/Button';
import { InvoiceButton } from '../../components/InvoiceButton';
import { CustomerInfo } from './components/OrderDetails/CustomerInfo';
import { OrderItems } from './components/OrderDetails/OrderItems';
import { calculateOrderTotal } from '../../utils/orderTotalCalculations';
import type { Order, OrderItem } from '../../types/order';

export function OrderDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrder, updateOrder } = useOrders();
  const { products } = useProducts();
  const [order, setOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const orderData = getOrder(id);
      if (orderData) {
        setOrder(orderData);
      } else {
        navigate('/dashboard/orders');
      }
    }
  }, [id, getOrder, navigate]);

  if (!order) return null;

  const handleUpdateItem = (index: number, updates: Partial<OrderItem>) => {
    const updatedItems = [...order.items];
    updatedItems[index] = { ...updatedItems[index], ...updates };
    
    const totalAmount = calculateOrderTotal(updatedItems);
    setOrder({ ...order, items: updatedItems, totalAmount });
  };

  const handleAddItem = () => {
    if (!products.length) return;
    
    const firstProduct = products[0];
    const newItem: OrderItem = {
      product: {
        artikelNr: firstProduct.artikelNr,
        name: firstProduct.name,
        mwst: firstProduct.mwst,
        supplierId: firstProduct.supplierId
      },
      quantity: 1,
      ekPrice: firstProduct.ekPrice,
      vkPrice: firstProduct.vkPrice,
      total: firstProduct.vkPrice
    };

    const updatedItems = [...order.items, newItem];
    const totalAmount = calculateOrderTotal(updatedItems);
    setOrder({ ...order, items: updatedItems, totalAmount });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = order.items.filter((_, i) => i !== index);
    const totalAmount = calculateOrderTotal(updatedItems);
    setOrder({ ...order, items: updatedItems, totalAmount });
  };

  const handleSave = async () => {
    try {
      setError(null);
      await updateOrder(order.id, order);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update order');
      console.error('Error updating order:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/dashboard/orders"
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Orders
        </Link>
        <div className="flex items-center space-x-3">
          <InvoiceButton order={order} />
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              Edit Order
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-6">Order Details</h2>
        
        <div className="space-y-6">
          <CustomerInfo customer={order.customer} />

          <OrderItems
            items={order.items}
            isEditing={isEditing}
            onAddItem={handleAddItem}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />

          <div>
            <h3 className="text-lg font-medium mb-3">Order Summary</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Amount:</span>
                <span className="text-xl font-semibold">
                  €{order.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}