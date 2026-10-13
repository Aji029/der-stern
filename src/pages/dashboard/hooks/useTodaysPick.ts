import { useState, useEffect, useMemo } from 'react';
import { useOrders } from '../../../context/OrderContext';
import { useSuppliers } from '../../../context/SupplierContext';
import { useProducts } from '../../../context/ProductContext';
import { isSameDay } from '../../../utils/dateFormatting';
import { comparePickOrder, isStoreWalkSupplier, STORE_WALK_BLOCK } from '../../../utils/pickOrder';
import type { OrderItem } from '../../../types/order';

export interface GroupedOrders {
  supplierId: string;
  supplierName: string;
  items: OrderItem[];
}

export function useTodaysPick(selectedDate: string) {
  const { orders, isLoading: ordersLoading, error: ordersError, refreshOrders } = useOrders();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrders[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Store-walk order: article -> pick position from the catalog.
  const productPositions = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const p of products) if (p.pickPosition != null) map.set(p.artikelNr, p.pickPosition);
    return map;
  }, [products]);

  useEffect(() => {
    try {
      setError(null);

      // Filter orders for the selected date and non-completed orders
      const dateOrders = orders.filter(order =>
        isSameDay(order.orderDate, selectedDate) &&
        order.status !== 'Completed' &&
        order.status !== 'Cancelled'
      );

      // Group items by supplier
      const supplierGroups = new Map<string, GroupedOrders>();

      dateOrders.forEach(order => {
        (order.items ?? []).forEach(item => {
          // Guard: product JOIN can return null if the product was deleted after the order was placed
          if (!item.product || !item.product.supplierId) return;

          const supplierId = item.product.supplierId;
          // Look up supplier name from context — fall back to ID if not loaded yet
          const supplier = suppliers.find(s => s.id === supplierId);
          const supplierName = supplier?.companyName || supplierId;

          const existingGroup = supplierGroups.get(supplierId);

          if (existingGroup) {
            // Update name in case supplier context just loaded
            existingGroup.supplierName = supplier?.companyName || existingGroup.supplierName;

            const existingItem = existingGroup.items.find(
              existing => existing.product.artikelNr === item.product.artikelNr
            );

            if (existingItem) {
              existingItem.quantity += item.quantity;
            } else {
              existingGroup.items.push({ ...item });
            }
          } else {
            supplierGroups.set(supplierId, {
              supplierId,
              supplierName,
              items: [{ ...item }],
            });
          }
        });
      });

      // Store-walk order applies to the Hamberger groups only. They keep their
      // alphabetical place on the page as one block; inside the block the
      // supplier's pick position decides, and inside each Hamberger group the
      // product's pick position decides. Anything without a position stays
      // alphabetical at the end. Every other supplier is plain alphabetical.
      const supplierPosition = (id: string) => suppliers.find(s => s.id === id)?.pickPosition;
      const blockKey = (g: GroupedOrders) =>
        isStoreWalkSupplier(g.supplierName) ? STORE_WALK_BLOCK : (g.supplierName ?? '');
      const byName = (a: OrderItem, b: OrderItem) =>
        (a.product?.name ?? '').localeCompare(b.product?.name ?? '');
      const byWalk = (a: OrderItem, b: OrderItem) => comparePickOrder(
        productPositions.get(a.product?.artikelNr ?? ''), a.product?.name ?? '',
        productPositions.get(b.product?.artikelNr ?? ''), b.product?.name ?? ''
      );
      const sortedGroups = Array.from(supplierGroups.values())
        .sort((a, b) => {
          const ka = blockKey(a);
          const kb = blockKey(b);
          if (ka !== kb) return ka.localeCompare(kb);
          return comparePickOrder(
            supplierPosition(a.supplierId), a.supplierName ?? '',
            supplierPosition(b.supplierId), b.supplierName ?? ''
          );
        })
        .map(group => ({
          ...group,
          items: group.items.sort(isStoreWalkSupplier(group.supplierName) ? byWalk : byName),
        }));

      setGroupedOrders(sortedGroups);
    } catch (err: any) {
      console.error('Error processing orders:', err);
      setError(err.message);
    }
  }, [orders, suppliers, selectedDate, productPositions]);

  return {
    groupedOrders,
    isLoading: ordersLoading, // Don't block on suppliersLoading — items show immediately, names resolve when suppliers load
    error: error || ordersError, // surface a failed/timed-out orders fetch, not just processing errors
    refreshOrders,
  };
}