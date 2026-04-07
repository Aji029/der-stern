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
  // Derive loading state from the data source — avoids the "empty flash" before
  // OrderContext finishes its Supabase fetch when orders is still []
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
        order.items.forEach(item => {
          // Guard: product JOIN can return null if the product was deleted after the order was placed
          if (!item.product || !item.product.supplierId) return;

          const supplier = suppliers.find(s => s.id === item.product.supplierId);
          if (!supplier) return;

          const existingGroup = supplierGroups.get(supplier.id);
          
          if (existingGroup) {
            // Check if product already exists in group
            const existingItem = existingGroup.items.find(
              existing => existing.product.artikelNr === item.product.artikelNr
            );

            if (existingItem) {
              // Add quantities if product exists
              existingItem.quantity += item.quantity;
            } else {
              // Add new product if it doesn't exist
              existingGroup.items.push({ ...item });
            }
          } else {
            // Create new group if supplier doesn't exist
            supplierGroups.set(supplier.id, {
              supplierId: supplier.id,
              supplierName: supplier.companyName,
              items: [{ ...item }],
            });
          }
        });
      });

      // Sort suppliers by name and sort items within each supplier by name
      // Use nullish coalescing to guard against null/undefined names (e.g. deleted supplier or product)
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
    isLoading: ordersLoading,
    error,
  };
}