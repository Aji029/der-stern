import { sternDb } from './supabase';

/**
 * Today's Pick, read live from der Stern.
 *
 * Mirrors der Stern's own useTodaysPick: take the day's orders that are still
 * open, group their items by the supplier the ARTICLE belongs to, and sum
 * quantities per article. Read-only — this never writes to public.
 */

export interface PickItem {
  artikel_nr: string;
  name: string;
  quantity: number;
  ek_price: number;
}

export interface SupplierPick {
  /** der Stern's supplier id, as stored on products.supplier_id (TEXT). */
  stern_supplier_id: string;
  supplier_name: string;
  items: PickItem[];
  total_quantity: number;
}

interface ProductRef {
  artikel_nr: string;
  name: string;
  ek_price: number;
  supplier_id: string | null;
}

interface OrderRow {
  id: string;
  status: string;
  order_items: Array<{
    product_id: string;
    quantity: number;
    // PostgREST returns a single object for this to-one embed, but supabase-js
    // types every embed as an array. Accept both rather than trust either.
    products: ProductRef | ProductRef[] | null;
  }> | null;
}

const one = (v: ProductRef | ProductRef[] | null): ProductRef | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

/** Local-day bounds as ISO instants, so "today" means the shop's today. */
export function dayBounds(date: string): { from: string; to: string } {
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { from: start.toISOString(), to: end.toISOString() };
}

export async function loadTodaysPick(date: string): Promise<SupplierPick[]> {
  const { from, to } = dayBounds(date);

  const { data, error } = await sternDb()
    .from('orders')
    .select(
      'id, status, order_items ( product_id, quantity, products ( artikel_nr, name, ek_price, supplier_id ) )',
    )
    .gte('order_date', from)
    .lt('order_date', to);

  if (error) throw new Error(error.message);

  const groups = new Map<string, SupplierPick>();

  for (const order of (data ?? []) as unknown as OrderRow[]) {
    // Same rule as der Stern: a picked order is one still to be fulfilled.
    if (order.status === 'Completed' || order.status === 'Cancelled') continue;

    for (const item of order.order_items ?? []) {
      // The product JOIN returns null if the article was deleted after ordering.
      const product = one(item.products);
      if (!product?.supplier_id) continue;

      const key = product.supplier_id;
      let group = groups.get(key);
      if (!group) {
        group = { stern_supplier_id: key, supplier_name: key, items: [], total_quantity: 0 };
        groups.set(key, group);
      }

      const existing = group.items.find(i => i.artikel_nr === product.artikel_nr);
      if (existing) existing.quantity += item.quantity;
      else {
        group.items.push({
          artikel_nr: product.artikel_nr,
          name: product.name,
          quantity: item.quantity,
          ek_price: Number(product.ek_price),
        });
      }
      group.total_quantity += item.quantity;
    }
  }

  // Resolve supplier names in one go; fall back to the id when a supplier row
  // is missing so a group is never silently dropped.
  const ids = [...groups.keys()];
  if (ids.length > 0) {
    const { data: suppliers } = await sternDb()
      .from('suppliers')
      .select('id, company_name')
      .in('id', ids);

    for (const s of (suppliers ?? []) as { id: string; company_name: string }[]) {
      const group = groups.get(s.id);
      if (group) group.supplier_name = s.company_name;
    }
  }

  for (const group of groups.values()) {
    group.items.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  }

  return [...groups.values()].sort((a, b) =>
    a.supplier_name.localeCompare(b.supplier_name, 'de'),
  );
}
