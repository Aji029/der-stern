import { supabase } from '../supabase';
import { format } from 'date-fns';
import type { Order } from '../types/order';

export async function updateOrderInDB(id: string, order: Order): Promise<void> {
  try {
    // Format dates for database
    const formattedOrderDate = format(order.orderDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
    const formattedDeliveryDate = order.deliveryDate 
      ? format(order.deliveryDate, "yyyy-MM-dd'T'HH:mm:ssXXX")
      : null;

    // Update order details
    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: order.status,
        total_amount: parseFloat(order.totalAmount.toFixed(2)),
        order_date: formattedOrderDate,
        delivery_date: formattedDeliveryDate,
        payment_status: order.paymentStatus,
        shipping_address: order.shippingAddress,
        notes: order.notes,
        updated_at: format(new Date(), "yyyy-MM-dd'T'HH:mm:ssXXX")
      })
      .eq('id', id);

    if (orderError) throw orderError;

    // Delete existing items
    const { error: deleteError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id);

    if (deleteError) throw deleteError;

    // Insert new items with supplier_id and packing status
    const orderItems = order.items.map(item => ({
      order_id: id,
      product_id: item.product.artikelNr,
      quantity: parseFloat(item.quantity.toString()),
      ek_price: parseFloat(item.ekPrice.toFixed(2)),
      vk_price: parseFloat(item.vkPrice.toFixed(2)),
      total: parseFloat((item.quantity * item.vkPrice).toFixed(2)),
      supplier_id: item.product.supplierId || null,
      mwst: item.product.mwst,
      is_packed: item.isPacked || false,
      packed_at: item.packedAt ? format(item.packedAt, "yyyy-MM-dd'T'HH:mm:ssXXX") : null,
      packed_by: item.packedBy || null
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

  } catch (error) {
    console.error('Failed to update order:', error);
    throw error;
  }
}