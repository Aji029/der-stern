import { supabase } from '../supabase';
import { format } from 'date-fns';
import type { Order } from '../types/order';

export async function fetchOrders(): Promise<Order[]> {
  try {
    let allOrders: any[] = [];
    const pageSize = 1000;
    let currentPage = 0;
    let hasMore = true;

    while (hasMore) {
      const from = currentPage * pageSize;
      const to = from + pageSize - 1;

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
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data && data.length > 0) {
        allOrders = [...allOrders, ...data];
        hasMore = data.length === pageSize;
        currentPage++;
      } else {
        hasMore = false;
      }
    }

    return mapOrdersFromDB(allOrders);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    throw error;
  }
}

function mapOrdersFromDB(data: any[]): Order[] {
  return data.map(order => ({
    ...order,
    customer: order.customer ? {
      id: order.customer.id,
      companyName: order.customer.company_name,
      contactPerson: order.customer.contact_person,
      email: order.customer.email,
      idNumber: order.customer.id_number || '',
      address: order.customer.address || '',
      billingAddress: order.customer.billing_address || ''
    } : order.customer,
    items: order.items ? order.items.map((item: any) => ({
      id: item.id,
      product: {
        artikelNr: item.product_id,
        name: item.product?.name || '',
        mwst: item.mwst,
        supplierId: item.supplier_id
      },
      quantity: item.quantity,
      ekPrice: item.ek_price,
      vkPrice: item.vk_price,
      total: item.total,
      isPacked: item.is_packed || false,
      packedAt: item.packed_at ? new Date(item.packed_at) : undefined,
      packedBy: item.packed_by || undefined
    })) : []
  }));
}

export async function createOrder(order: Omit<Order, 'id'>) {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (!user || userError) throw new Error('Authentication required');

    // Format dates for database
    const formattedOrderDate = format(order.orderDate, "yyyy-MM-dd'T'HH:mm:ssXXX");
    const formattedDeliveryDate = order.deliveryDate 
      ? format(order.deliveryDate, "yyyy-MM-dd'T'HH:mm:ssXXX")
      : null;

    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id: order.customer.id,
        status: order.status,
        total_amount: order.totalAmount,
        order_date: formattedOrderDate,
        delivery_date: formattedDeliveryDate,
        payment_status: order.paymentStatus,
        shipping_address: order.shippingAddress,
        notes: order.notes,
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
      packed_at: item.packedAt ? format(item.packedAt, "yyyy-MM-dd'T'HH:mm:ssXXX") : null,
      packed_by: item.packedBy || null
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    return orderData;
  } catch (error) {
    console.error('Failed to create order:', error);
    throw error;
  }
}