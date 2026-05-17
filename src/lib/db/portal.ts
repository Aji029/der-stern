import { supabasePortal as supabase } from '../supabasePortal';
import type { PortalProduct, PortalOrder, PortalOrderDetail, PortalCartItem } from '../../types/portal';

export async function fetchCustomerOrderedProducts(customerId: string): Promise<PortalProduct[]> {
  // Use a join through order_items so the customer_id filter is applied via the orders relationship
  const { data: rows, error: joinErr } = await supabase
    .from('order_items')
    .select('product_id, orders!inner(customer_id)')
    .eq('orders.customer_id', customerId);

  if (joinErr || !rows || rows.length === 0) {
    // Fallback: plain 2-step query
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id', customerId)
      .gte('order_date', '2020-01-01');

    if (!orders || orders.length === 0) return [];

    const orderIds = orders.map((o: any) => o.id as string);
    const { data: items } = await supabase
      .from('order_items')
      .select('product_id')
      .in('order_id', orderIds);

    if (!items || items.length === 0) return [];

    const uniqueIds = [...new Set(items.map((i: any) => i.product_id).filter(Boolean))];
    if (uniqueIds.length === 0) return [];

    const { data: products, error } = await supabase
      .from('products')
      .select('artikel_nr, name, mwst, supplier_id, ist_bestand')
      .in('artikel_nr', uniqueIds)
      .order('name');

    if (error) throw error;
    return (products || []).map(mapProduct);
  }

  const uniqueProductIds = [...new Set(rows.map((r: any) => r.product_id).filter(Boolean))];
  if (uniqueProductIds.length === 0) return [];

  const { data: products, error } = await supabase
    .from('products')
    .select('artikel_nr, name, mwst, supplier_id, ist_bestand')
    .in('artikel_nr', uniqueProductIds)
    .order('name');

  if (error) throw error;
  return (products || []).map(mapProduct);
}

function mapProduct(p: any): PortalProduct {
  return {
    artikelNr: p.artikel_nr,
    name: p.name,
    mwst: p.mwst as 'A' | 'B',
    supplierId: p.supplier_id,
    istBestand: p.ist_bestand ?? 0,
  };
}

export async function fetchPortalOrders(customerId: string, year = 2026): Promise<PortalOrder[]> {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, status, order_date, delivery_date')
    .eq('customer_id', customerId)
    .gte('order_date', `${year}-01-01`)
    .lt('order_date', `${year + 1}-01-01`)
    .order('order_date', { ascending: false });

  if (error) throw error;
  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map((o: any) => o.id as string);
  const { data: items } = await supabase
    .from('order_items')
    .select('order_id')
    .in('order_id', orderIds);

  const countMap: Record<string, number> = {};
  for (const item of items || []) {
    countMap[(item as any).order_id] = (countMap[(item as any).order_id] || 0) + 1;
  }

  return orders.map((o: any) => ({
    id: o.id,
    status: o.status as PortalOrder['status'],
    orderDate: new Date(o.order_date),
    deliveryDate: o.delivery_date ? new Date(o.delivery_date) : undefined,
    itemCount: countMap[o.id] || 0,
  }));
}

export async function fetchPortalOrderDetail(orderId: string, customerId: string): Promise<PortalOrderDetail | null> {
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, status, order_date, delivery_date, shipping_address, notes')
    .eq('id', orderId)
    .eq('customer_id', customerId)
    .single();

  if (error || !order) return null;

  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, product_name, quantity')
    .eq('order_id', orderId);

  return {
    id: order.id,
    status: order.status as PortalOrderDetail['status'],
    orderDate: new Date(order.order_date),
    deliveryDate: order.delivery_date ? new Date(order.delivery_date) : undefined,
    shippingAddress: order.shipping_address || '',
    notes: order.notes || undefined,
    itemCount: (items || []).length,
    items: (items || []).map((item: any) => ({
      artikelNr: item.product_id,
      name: item.product_name || item.product_id,
      quantity: item.quantity,
    })),
  };
}

export async function createPortalOrder(params: {
  customerId: string;
  userId: string;
  cart: PortalCartItem[];
  shippingAddress: string;
  notes?: string;
}): Promise<string> {
  const { customerId, userId, cart, shippingAddress, notes } = params;

  const resolvedItems = await Promise.all(
    cart.map(async item => {
      let vkPrice = 0;
      try {
        const { data } = await supabase.rpc('get_customer_product_price', {
          p_customer_id: customerId,
          p_product_id: item.artikelNr,
        });
        if (data !== null && data !== undefined) {
          vkPrice = data;
        } else {
          const { data: product } = await supabase
            .from('products')
            .select('vk_price')
            .eq('artikel_nr', item.artikelNr)
            .single();
          vkPrice = (product as any)?.vk_price || 0;
        }
      } catch {
        // default remains 0
      }
      return { ...item, vkPrice };
    })
  );

  const totalAmount = resolvedItems.reduce((sum, item) => sum + item.quantity * item.vkPrice, 0);

  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert([{
      customer_id: customerId,
      status: 'Pending',
      total_amount: totalAmount,
      final_amount: totalAmount,
      order_date: new Date().toISOString(),
      payment_status: 'Pending',
      shipping_address: shippingAddress,
      notes: notes || null,
      user_id: userId,
    }])
    .select('id')
    .single();

  if (orderError || !orderData) throw orderError || new Error('Failed to create order');

  const orderItems = resolvedItems.map(item => ({
    order_id: (orderData as any).id,
    product_id: item.artikelNr,
    product_name: item.name,
    quantity: item.quantity,
    ek_price: 0,
    vk_price: item.vkPrice,
    total: item.quantity * item.vkPrice,
    supplier_id: item.supplierId || null,
    user_id: userId,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw itemsError;

  return (orderData as any).id;
}
