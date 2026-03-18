import { useMemo } from 'react';
import { useOrders } from '../../../context/OrderContext';
import { useSuppliers } from '../../../context/SupplierContext';
import { useProducts } from '../../../context/ProductContext';

export function useSupplierStats(date?: Date) {
  const { orders } = useOrders();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();

  return useMemo(() => {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Get all orders for today
    const todaysOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === targetDate.getTime();
    });

    // Get all products that need to be picked today
    const todaysProducts = todaysOrders.flatMap(order => order.items);

    // Calculate stats for each supplier
    return suppliers.map(supplier => {
      // Get all products for this supplier that need to be picked today
      const supplierProducts = todaysProducts.filter(item => 
        item.product.supplierId === supplier.id
      );

      // Calculate total amount for this supplier's products
      const totalAmount = supplierProducts.reduce((sum, item) => 
        sum + (item.quantity * item.vkPrice), 0
      );

      return {
        ...supplier,
        orderCount: supplierProducts.length,
        totalAmount,
        productsToPickup: supplierProducts.map(item => ({
          name: item.product.name,
          quantity: item.quantity
        }))
      };
    }).filter(supplier => supplier.orderCount > 0)
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [orders, suppliers, products, date]);
}