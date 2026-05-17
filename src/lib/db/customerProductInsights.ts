import { supabase } from '../supabase';
import type { OrderItem } from '../../types/order';

export interface CustomerProductInfo {
  artikelNr: string;
  name: string;
  vkPrice: number;
  ekPrice: number;
  mwst: 'A' | 'B';
  supplierId?: string;
  istBestand: number;
  customerOrderCount: number;
  lastOrderedDate: Date | null;
}

export interface LastOrderInfo {
  orderId: string;
  orderDate: Date;
  itemCount: number;
  items: OrderItem[];
}

async function buildCustomerFreqMap(customerId: string): Promise<{
  freqMap: Record<string, number>;
  lastDateMap: Record<string, string>;
}> {
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_date')
    .eq('customer_id', customerId);

  if (!orders || orders.length === 0) return { freqMap: {}, lastDateMap: {} };

  const orderDateMap = Object.fromEntries(orders.map(o => [o.id as string, o.order_date as string]));
  const orderIds = orders.map(o => o.id as string);

  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, order_id')
    .in('order_id', orderIds);

  if (!items) return { freqMap: {}, lastDateMap: {} };

  const orderSets: Record<string, Set<string>> = {};
  const lastDateMap: Record<string, string> = {};

  for (const item of items) {
    if (!item.product_id) continue;
    if (!orderSets[item.product_id]) orderSets[item.product_id] = new Set();
    orderSets[item.product_id].add(item.order_id);

    const date = orderDateMap[item.order_id];
    if (date && (!lastDateMap[item.product_id] || date > lastDateMap[item.product_id])) {
      lastDateMap[item.product_id] = date;
    }
  }

  const freqMap: Record<string, number> = {};
  for (const [pid, set] of Object.entries(orderSets)) {
    freqMap[pid] = set.size;
  }

  return { freqMap, lastDateMap };
}

export async function fetchCustomerFrequencyMap(
  customerId: string
): Promise<Record<string, { count: number; lastDate: Date | null }>> {
  const { freqMap, lastDateMap } = await buildCustomerFreqMap(customerId);
  const result: Record<string, { count: number; lastDate: Date | null }> = {};
  for (const [pid, count] of Object.entries(freqMap)) {
    result[pid] = {
      count,
      lastDate: lastDateMap[pid] ? new Date(lastDateMap[pid]) : null,
    };
  }
  return result;
}

export async function fetchCustomerTopProducts(customerId: string): Promise<CustomerProductInfo[]> {
  const { freqMap, lastDateMap } = await buildCustomerFreqMap(customerId);

  const topIds = Object.entries(freqMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([pid]) => pid);

  if (topIds.length === 0) return [];

  const { data: products } = await supabase
    .from('products')
    .select('artikel_nr, name, vk_price, ek_price, mwst, supplier_id, ist_bestand')
    .in('artikel_nr', topIds);

  return (products || [])
    .map(p => ({
      artikelNr: p.artikel_nr,
      name: p.name,
      vkPrice: p.vk_price,
      ekPrice: p.ek_price,
      mwst: p.mwst as 'A' | 'B',
      supplierId: p.supplier_id,
      istBestand: p.ist_bestand,
      customerOrderCount: freqMap[p.artikel_nr] || 0,
      lastOrderedDate: lastDateMap[p.artikel_nr] ? new Date(lastDateMap[p.artikel_nr]) : null,
    }))
    .sort((a, b) => b.customerOrderCount - a.customerOrderCount);
}

export async function fetchLastOrderItems(customerId: string): Promise<LastOrderInfo | null> {
  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_date')
    .eq('customer_id', customerId)
    .order('order_date', { ascending: false })
    .limit(1);

  if (!orders || orders.length === 0) return null;

  const lastOrder = orders[0];

  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, product_name, quantity, ek_price, vk_price')
    .eq('order_id', lastOrder.id);

  if (!items || items.length === 0) return null;

  const productIds = items.map(i => i.product_id).filter(Boolean);
  const { data: products } = await supabase
    .from('products')
    .select('artikel_nr, mwst, supplier_id')
    .in('artikel_nr', productIds);

  const productMeta = Object.fromEntries(
    (products || []).map(p => [p.artikel_nr, { mwst: p.mwst as 'A' | 'B', supplierId: p.supplier_id as string | undefined }])
  );

  return {
    orderId: lastOrder.id,
    orderDate: new Date(lastOrder.order_date),
    itemCount: items.length,
    items: items.map(item => ({
      product: {
        artikelNr: item.product_id,
        name: item.product_name || item.product_id,
        mwst: productMeta[item.product_id]?.mwst || 'A',
        supplierId: productMeta[item.product_id]?.supplierId,
      },
      quantity: item.quantity,
      ekPrice: item.ek_price,
      vkPrice: item.vk_price,
      total: item.quantity * item.vk_price,
    })),
  };
}
