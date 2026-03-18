import { supabase } from '../supabase';
import { calculateOrderTotal } from '../../utils/orderTotalCalculations';
import type { Order } from '../../types/order';
import { format } from 'date-fns';

export async function createOrder(order: Omit<Order, 'id'>): Promise<void> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) throw new Error('Authentication required');

    // Calculate total amount
    const totalAmount = calculateOrderTotal(order.items);
    if (!totalAmount && totalAmount !== 0) {
      throw new Error('Invalid total amount calculated');
    }

    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id: order.customer.id,
        status: order.status,
        total_amount: totalAmount,
        order_date: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm:ssXXX'),
        delivery_date: order.deliveryDate ? format(order.deliveryDate, 'yyyy-MM-dd\'T\'HH:mm:ssXXX') : null,
        payment_status: order.paymentStatus,
        shipping_address: order.shippingAddress,
        notes: order.notes,
        user_id: user.id
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = order.items.map(item => ({
      order_id: orderData.id,
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
  } catch (error) {
    console.error('Failed to create order:', error);
    throw error;
  }
}