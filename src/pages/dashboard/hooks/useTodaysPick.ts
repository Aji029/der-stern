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
  const { orders } = useOrders();
  const { suppliers } = useSuppliers();
  const [groupedOrders, setGroupedOrders] = useState<GroupedOrders[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setIsLoading(true);
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
          if (!item.product.supplierId) return;

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
      const sortedGroups = Array.from(supplierGroups.values())
        .sort((a, b) => a.supplierName.localeCompare(b.supplierName))
        .map(group => ({
          ...group,
          items: group.items.sort((a, b) => 
            a.product.name.localeCompare(b.product.name)
          ),
        }));

      setGroupedOrders(sortedGroups);
    } catch (err: any) {
      console.error('Error processing orders:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [orders, suppliers, selectedDate]);

  return {
    groupedOrders,
    isLoading,
    error,
  };
}