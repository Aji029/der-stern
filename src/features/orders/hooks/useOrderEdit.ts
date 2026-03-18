import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../../../context/OrderContext';
import { useProducts } from '../../../context/ProductContext';
import { supabase } from '../../../lib/supabase';
import { calculateOrderTotal } from '../../../utils/orderCalculations';
import type { Order, OrderItem, OrderDiscount } from '../../../types/order';

export function useOrderEdit(orderId: string) {
  const navigate = useNavigate();
  const { orders, updateOrder } = useOrders();
  const { products } = useProducts();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check context first (fast path — works for all Pending/Processing orders)
    const fromContext = orders.find(o => o.id === orderId);
    if (fromContext) {
      setOrder(fromContext);
      setIsLoading(false);
      return;
    }

    // Not in context (e.g. Completed order accessed via URL) — fetch from DB
    if (!isLoading) return; // already fetched

    supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_items(
          *,
          product:products(artikel_nr, name, mwst, supplier_id)
        )
      `)
      .eq('id', orderId)
      .single()
      .then(({ data, error: fetchError }) => {
        if (fetchError || !data) {
          setError(fetchError?.message || 'Order not found');
        } else {
          setOrder({
            id: data.id,
            customer: {
              id: data.customer?.id || '',
              companyName: data.customer?.company_name || '',
              contactPerson: data.customer?.contact_person || '',
              email: data.customer?.email || '',
              idNumber: data.customer?.id_number || '',
              address: data.customer?.address || '',
              billingAddress: data.customer?.billing_address || ''
            },
            items: (data.items || []).map((item: any) => ({
              id: item.id,
              quantity: parseFloat(item.quantity),
              ekPrice: parseFloat(item.ek_price),
              vkPrice: parseFloat(item.vk_price),
              total: parseFloat((item.quantity * item.vk_price).toFixed(2)),
              isPacked: item.is_packed || false,
              packedAt: item.packed_at ? new Date(item.packed_at) : undefined,
              packedBy: item.packed_by || undefined,
              product: {
                artikelNr: item.product?.artikel_nr || '',
                name: item.product?.name || '',
                mwst: item.mwst || item.product?.mwst,
                supplierId: item.supplier_id || item.product?.supplier_id
              }
            })),
            status: data.status,
            totalAmount: parseFloat(data.total_amount),
            finalAmount: parseFloat(data.final_amount || data.total_amount),
            orderDate: new Date(data.order_date),
            deliveryDate: data.delivery_date ? new Date(data.delivery_date) : undefined,
            paymentStatus: data.payment_status,
            shippingAddress: data.shipping_address,
            notes: data.notes,
            discount: data.discount
          });
        }
        setIsLoading(false);
      });
  }, [orderId, orders.length]); // re-run if context loads more orders

  const handleUpdateItem = useCallback(async (index: number, updates: Partial<OrderItem>) => {
    if (!order) return;

    try {
      const currentItem = order.items[index];
      const updatedItems = [...order.items];

      // Create optimistic update
      const optimisticItem = { ...currentItem, ...updates };
      updatedItems[index] = optimisticItem;

      // Calculate new totals
      const { totalAmount, finalAmount } = calculateOrderTotal(updatedItems, order.discount);

      // Create updated order object
      const updatedOrder = {
        ...order,
        items: updatedItems,
        totalAmount,
        finalAmount
      };

      // Update local state immediately (optimistic update)
      setOrder(updatedOrder);

      // If this is a packing status change, update only is_packed on the specific
      // order_item row — avoids triggering fetchOrders() which resets local state
      // and causes the packed status to revert.
      if ('isPacked' in updates) {
        if (currentItem.id) {
          const { data: { user } } = await supabase.auth.getUser();
          await supabase
            .from('order_items')
            .update({
              is_packed: updates.isPacked ?? false,
              packed_at: updates.packedAt ? updates.packedAt.toISOString() : null,
              packed_by: updates.isPacked ? (user?.id ?? null) : null,
            })
            .eq('id', currentItem.id);
        } else {
          // No DB id yet (newly added item) — fall back to full save
          await updateOrder(order.id, updatedOrder);
        }
      }

    } catch (err: any) {
      console.error('Failed to update item:', err);
      setError(err.message);

      // Revert to original state on error
      setOrder(orders.find(o => o.id === orderId) || null);
    }
  }, [order, orders, orderId, updateOrder]);

  const handleAddItem = useCallback((product: any, quantity: number = 1) => {
    if (!order) return;

    const newItem: OrderItem = {
      product: {
        artikelNr: product.artikelNr,
        name: product.name,
        mwst: product.mwst,
        supplierId: product.supplierId,
      },
      quantity,
      ekPrice: product.ekPrice,
      vkPrice: product.vkPrice,
      total: quantity * product.vkPrice
    };

    const updatedItems = [...order.items, newItem];
    const { totalAmount, finalAmount } = calculateOrderTotal(updatedItems, order.discount);

    setOrder(prev => ({
      ...prev!,
      items: updatedItems,
      totalAmount,
      finalAmount
    }));
  }, [order]);

  const handleRemoveItem = useCallback((index: number) => {
    if (!order) return;

    const updatedItems = order.items.filter((_, i) => i !== index);
    const { totalAmount, finalAmount } = calculateOrderTotal(updatedItems, order.discount);

    setOrder(prev => ({
      ...prev!,
      items: updatedItems,
      totalAmount,
      finalAmount
    }));
  }, [order]);

  const handleUpdateDiscount = useCallback((discount: OrderDiscount | undefined) => {
    if (!order) return;

    const { totalAmount, finalAmount } = calculateOrderTotal(order.items, discount);

    setOrder(prev => ({
      ...prev!,
      discount,
      totalAmount,
      finalAmount
    }));
  }, [order]);

  const handleSubmit = async () => {
    if (!order) return;

    try {
      setIsSubmitting(true);
      setError(null);

      await updateOrder(order.id, order);
      navigate('/dashboard/orders');
    } catch (err: any) {
      console.error('Error updating order:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    order,
    isLoading,
    isSubmitting,
    isUpdatingPrice,
    error,
    handleUpdateOrder: setOrder,
    handleUpdateItem,
    handleAddItem,
    handleRemoveItem,
    handleUpdateDiscount,
    handleSubmit
  };
}