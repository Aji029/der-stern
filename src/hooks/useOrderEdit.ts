import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrders } from '../context/OrderContext';
import { supabase } from '../lib/supabase';
import { calculateOrderTotal } from '../utils/orderCalculations';
import type { Order, OrderItem } from '../types/order';

export function useOrderEdit(orderId: string) {
  const navigate = useNavigate();
  const { updateOrder } = useOrders();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingPrice, setIsUpdatingPrice] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadOrder() {
      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select(`
            *,
            customer:customers!inner(*)
          `)
          .eq('id', orderId)
          .single();

        if (fetchError) throw fetchError;

        if (isMounted && data) {
          const orderData: Order = {
            id: data.id,
            customer: {
              id: data.customer.id,
              companyName: data.customer.company_name,
              contactPerson: data.customer.contact_person,
              email: data.customer.email,
              phone: data.customer.phone,
              address: data.customer.address,
            },
            items: data.items || [],
            orderDate: new Date(data.order_date),
            status: data.status,
            paymentStatus: data.payment_status,
            totalAmount: data.total_amount,
            finalAmount: data.final_amount,
            discount: data.discount,
            notes: data.notes,
            invoiceNumber: data.invoice_number,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          };
          setOrder(orderData);
        }
      } catch (err: any) {
        console.error('Failed to load order:', err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  const updateProductInDatabase = async (artikelNr: string, updates: {
    name?: string;
    vkPrice?: number;
    ekPrice?: number;
    mwst?: 'A' | 'B';
    supplierId?: string;
  }) => {
    try {
      setIsUpdatingPrice(true);
      const updateData: Record<string, any> = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.vkPrice !== undefined) updateData.vk_price = updates.vkPrice;
      if (updates.ekPrice !== undefined) updateData.ek_price = updates.ekPrice;
      if (updates.mwst !== undefined) updateData.mwst = updates.mwst;
      if (updates.supplierId !== undefined) updateData.supplier_id = updates.supplierId;

      // First update the product in the database
      const { error: updateError } = await supabase
        .from('products')
        .update(updateData)
        .eq('artikel_nr', artikelNr);

      if (updateError) throw updateError;

      // Update prices in related orders using RPC calls
      if (updates.vkPrice !== undefined) {
        const { error: vkError } = await supabase.rpc('update_product_price', {
          p_artikel_nr: artikelNr,
          p_price: updates.vkPrice,
          p_price_type: 'vk_price'
        });
        if (vkError) throw vkError;
      }

      if (updates.ekPrice !== undefined) {
        const { error: ekError } = await supabase.rpc('update_product_price', {
          p_artikel_nr: artikelNr,
          p_price: updates.ekPrice,
          p_price_type: 'ek_price'
        });
        if (ekError) throw ekError;
      }

      // Fetch the updated product to ensure we have the latest data
      const { data: updatedProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('artikel_nr', artikelNr)
        .single();

      if (fetchError) throw fetchError;

      return updatedProduct;
    } catch (err) {
      console.error('Failed to update product:', err);
      throw err;
    } finally {
      setIsUpdatingPrice(false);
    }
  };

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

      // Update local state immediately (optimistic update)
      setOrder(prev => ({
        ...prev!,
        items: updatedItems,
        totalAmount,
        finalAmount
      }));

      // If price changed, update the product in database
      if (updates.vkPrice !== undefined || updates.ekPrice !== undefined) {
        const priceUpdates: any = {};
        if (updates.vkPrice !== undefined) priceUpdates.vkPrice = updates.vkPrice;
        if (updates.ekPrice !== undefined) priceUpdates.ekPrice = updates.ekPrice;

        const updatedProduct = await updateProductInDatabase(
          currentItem.product.artikelNr,
          priceUpdates
        );

        // Update the item with the confirmed data from the server
        const confirmedItem = {
          ...optimisticItem,
          ekPrice: updatedProduct.ek_price,
          vkPrice: updatedProduct.vk_price,
        };
        updatedItems[index] = confirmedItem;

        // Recalculate totals with confirmed data
        const confirmedTotals = calculateOrderTotal(updatedItems, order.discount);

        // Update order with confirmed data
        const confirmedOrder = {
          ...order,
          items: updatedItems,
          totalAmount: confirmedTotals.totalAmount,
          finalAmount: confirmedTotals.finalAmount
        };

        // Update local state with confirmed data
        setOrder(confirmedOrder);

        // Update order in database
        await updateOrder(order.id, confirmedOrder);
      }
    } catch (err: any) {
      console.error('Failed to update item:', err);
      setError(err.message);
    }
  }, [order, orderId, updateOrder]);

  const handleAddItem = useCallback((product: any) => {
    if (!order) return;

    const newItem: OrderItem = {
      product: {
        artikelNr: product.artikelNr,
        name: product.name,
        mwst: product.mwst,
        supplierId: product.supplierId
      },
      quantity: 1,
      ekPrice: product.ekPrice,
      vkPrice: product.vkPrice,
      total: product.vkPrice
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
    handleSubmit,
    handleUpdateDiscount: (discount: any) => {
      if (!order) return;
      const { totalAmount, finalAmount } = calculateOrderTotal(order.items, discount);
      setOrder(prev => ({
        ...prev!,
        discount,
        totalAmount,
        finalAmount
      }));
    }
  };
}