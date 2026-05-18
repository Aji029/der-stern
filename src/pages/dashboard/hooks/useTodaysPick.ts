import { useState, useEffect } from 'react';
import { useOrders } from '../../../context/OrderContext';
import { useSuppliers } from '../../../context/SupplierContext';
import { isSameDay } from '../../../utils/dateFormatting';
import type { OrderItem } from '../../../types/order';

export interface GroupedOrders {
  supplierId: string;
  supplierName: string;
  items: OrderItem[];
}

export function useTodaysPick(selectedDate: string) {
  const { orders, isLoading: ordersLoading } = useOrders();
  const { suppliers } = useSuppliers();
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrders[]>([]);
  const [error, setError] = useState<string | null>(null);

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

      const sortedGroups = Array.from(supplierGroups.values())
        .sort((a, b) => (a.supplierName ?? '').localeCompare(b.supplierName ?? ''))
        .map(group => ({
          ...group,
          items: group.items.sort((a, b) =>
            (a.product?.name ?? '').localeCompare(b.product?.name ?? '')
          ),
        }));

      setGroupedOrders(sortedGroups);
    } catch (err: any) {
      console.error('Error processing orders:', err);
      setError(err.message);
    }
  }, [orders, suppliers, selectedDate]);

  return {
    groupedOrders,
    isLoading: ordersLoading, // Don't block on suppliersLoading — items show immediately, names resolve when suppliers load
    error,
  };
}