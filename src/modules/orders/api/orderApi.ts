import { supabase } from '../../../lib/supabase';
import { format } from 'date-fns';
import type { Order, OrderItem } from '../types';

export async function fetchOrders() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customer:customers(*),
        items:order_items(
          *,
          product:products(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }
}

export async function createOrder(order: Omit<Order, 'id'>) {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        customer_id: order.customer.id,
        status: 'Pending',
        total_amount: order.totalAmount,
        order_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ssXXX'),
        delivery_date: order.deliveryDate ? format(order.deliveryDate, 'yyyy-MM-dd\'T\'HH:mm:ssXXX') : null,
        payment_status: 'Pending',
        shipping_address: order.shippingAddress,
        notes: order.notes
      }])
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error('Failed to create order');

    // Create order items
    const orderItems = order.items.map(item => ({
      order_id: data.id,
      product_id: item.product.artikelNr,
      quantity: item.quantity,
      ek_price: item.ekPrice,
      vk_price: item.vkPrice,
      total: item.quantity * item.vkPrice
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return data;
  } catch (error) {
    console.error('Failed to create order:', error);
    throw error;
  }
}

export async function updateOrder(id: string, order: Order) {
  try {
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: order.status,
        total_amount: order.totalAmount,
        delivery_date: order.deliveryDate ? format(order.deliveryDate, 'yyyy-MM-dd\'T\'HH:mm:ssXXX') : null,
        payment_status: order.paymentStatus,
        shipping_address: order.shippingAddress,
        notes: order.notes,
        updated_at: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ssXXX')
      })
      .eq('id', id);

    if (orderError) throw orderError;

    // Delete existing items
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id);

    if (deleteError) throw deleteError;

    // Insert new items
    const validItems = order.items
      .filter(item => item.product?.artikelNr && item.quantity > 0)
      .map(item => ({
        order_id: id,
        product_id: item.product.artikelNr,
        quantity: item.quantity,
        ek_price: item.ekPrice,
        vk_price: item.vkPrice,
        total: item.quantity * item.vkPrice
      }));

    if (validItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(validItems);

      if (itemsError) throw itemsError;
    }
  } catch (error) {
    console.error('Failed to update order:', error);
    throw error;
  }
}

export async function deleteOrder(id: string) {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Failed to delete order:', error);
    throw error;
  }
}