import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { calculateOrderTotal } from '../utils/orderCalculations';
import type { Order } from '../types/order';

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  addOrder: (order: Omit<Order, 'id'>) => Promise<void>;
  updateOrder: (id: string, order: Order) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  getOrder: (id: string) => Order | undefined;
  refreshOrders: () => Promise<void>;
  patchEKPrice: (artikelNr: string, newPrice: number) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const transformOrder = (order: any): Order => ({
    id: order.id,
    customer: {
      id: order.customer?.id || '',
      companyName: order.customer?.company_name || '',
      contactPerson: order.customer?.contact_person || '',
      email: order.customer?.email || '',
      idNumber: order.customer?.id_number || '',
      address: order.customer?.address || '',
      billingAddress: order.customer?.billing_address || ''
    },
    items: (order.items || []).map((item: any) => ({
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
    status: order.status,
    totalAmount: parseFloat(order.total_amount),
    finalAmount: parseFloat(order.final_amount || order.total_amount),
    orderDate: new Date(order.order_date),
    deliveryDate: order.delivery_date ? new Date(order.delivery_date) : undefined,
    paymentStatus: order.payment_status,
    shippingAddress: order.shipping_address,
    notes: order.notes,
    discount: order.discount,
    created_at: order.created_at ? new Date(order.created_at) : undefined,
    updated_at: order.updated_at ? new Date(order.updated_at) : undefined
  });

  const ORDER_SELECT = `
    *,
    customer:customers(*),
    items:order_items(
      *,
      product:products(artikel_nr, name, mwst, supplier_id)
    )
  `;

  const fetchOrders = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      setIsLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setOrders([]);
        return;
      }

      // Only fetch Pending/Processing — the vast majority of completed orders
      // are not needed here (Orders page uses its own paginated hook)
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select(ORDER_SELECT)
        .in('status', ['Pending', 'Processing'])
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setOrders((data || []).map(transformOrder));
      setError(null);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchOrders();

    // Realtime subscription — debounced re-fetch when orders table changes
    const debounce = { timer: null as ReturnType<typeof setTimeout> | null };

    const subscription = supabase
      .channel('orders_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        if (debounce.timer) clearTimeout(debounce.timer);
        debounce.timer = setTimeout(fetchOrders, 800);
      })
      .subscribe();

    return () => {
      if (debounce.timer) clearTimeout(debounce.timer);
      subscription.unsubscribe();
    };
  }, []);

  const addOrder = async (order: Omit<Order, 'id'>) => {
    try {
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) throw new Error('Authentication required');

      // Calculate total amount and final amount
      const { totalAmount, finalAmount } = calculateOrderTotal(order.items, order.discount);

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_id: order.customer.id,
          status: order.status,
          total_amount: totalAmount,
          final_amount: finalAmount,
          order_date: order.orderDate.toISOString(),
          delivery_date: order.deliveryDate?.toISOString(),
          payment_status: order.paymentStatus,
          shipping_address: order.shippingAddress,
          notes: order.notes,
          discount: order.discount || null,
          user_id: user.id
        }])
        .select()
        .single();

      if (orderError) throw orderError;
      if (!orderData) throw new Error('Failed to create order');

      // Create order items
      const orderItems = order.items.map(item => ({
        order_id: orderData.id,
        product_id: item.product.artikelNr,
        quantity: item.quantity,
        ek_price: item.ekPrice,
        vk_price: item.vkPrice,
        total: item.quantity * item.vkPrice,
        mwst: item.product.mwst,
        supplier_id: item.product.supplierId,
        is_packed: item.isPacked || false,
        packed_at: item.packedAt?.toISOString(),
        packed_by: item.packedBy,
        user_id: user.id
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      await fetchOrders();
    } catch (err: any) {
      console.error('Failed to add order:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateOrder = async (id: string, order: Order) => {
    try {
      setError(null);

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (!user || userError) throw new Error('Authentication required');

      // Calculate total amount and final amount
      const { totalAmount, finalAmount } = calculateOrderTotal(order.items, order.discount);

      // Update order details
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: order.status,
          total_amount: totalAmount,
          final_amount: finalAmount,
          order_date: order.orderDate.toISOString(),
          delivery_date: order.deliveryDate?.toISOString(),
          payment_status: order.paymentStatus,
          shipping_address: order.shippingAddress,
          notes: order.notes,
          discount: order.discount || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (orderError) throw orderError;

      // Fetch existing item IDs BEFORE touching anything
      const { data: existingItems } = await supabase
        .from('order_items')
        .select('id')
        .eq('order_id', id);

      const existingIds = (existingItems ?? []).map(r => r.id);

      // INSERT new items FIRST — if this fails, old items are still intact
      const orderItems = order.items.map(item => ({
        order_id: id,
        product_id: item.product.artikelNr,
        quantity: item.quantity,
        ek_price: item.ekPrice,
        vk_price: item.vkPrice,
        total: item.quantity * item.vkPrice,
        mwst: item.product.mwst,
        supplier_id: item.product.supplierId,
        is_packed: item.isPacked || false,
        packed_at: item.packedAt?.toISOString() || null,
        packed_by: item.isPacked ? user.id : null,
        user_id: user.id
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Delete old items only AFTER the insert succeeded
      if (existingIds.length > 0) {
        await supabase
          .from('order_items')
          .delete()
          .in('id', existingIds);
      }

      await fetchOrders();
    } catch (err: any) {
      console.error('Error updating order:', err);
      setError(err.message);
      throw err;
    }
  };

  const deleteOrder = async (id: string) => {
    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      await fetchOrders();
    } catch (err: any) {
      console.error('Failed to delete order:', err);
      setError(err.message);
      throw err;
    }
  };

  const getOrder = (id: string) => {
    return orders.find(order => order.id === id);
  };

  const patchEKPrice = (artikelNr: string, newPrice: number) => {
    setOrders(prev => prev.map(order => ({
      ...order,
      items: order.items.map(item =>
        item.product?.artikelNr === artikelNr ? { ...item, ekPrice: newPrice } : item
      )
    })));
  };

  return (
    <OrderContext.Provider value={{
      orders,
      isLoading,
      error,
      addOrder,
      updateOrder,
      deleteOrder,
      getOrder,
      refreshOrders: fetchOrders,
      patchEKPrice
    }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrderProvider');
  }
  return context;
}
