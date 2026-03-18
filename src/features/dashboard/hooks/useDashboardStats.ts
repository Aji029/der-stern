import { useMemo } from 'react';
import { useOrders } from '../../../context/OrderContext';
import { useProducts } from '../../../context/ProductContext';
import { useCustomers } from '../../../context/CustomerContext';

export function useDashboardStats() {
  const { orders } = useOrders();
  const { products } = useProducts();
  const { customers } = useCustomers();

  return useMemo(() => {
    // Get current date and previous period dates
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
    const previousPeriodStart = new Date(thirtyDaysAgo.getTime() - (30 * 24 * 60 * 60 * 1000));

    // Filter orders by period
    const recentOrders = orders.filter(order => new Date(order.orderDate) >= thirtyDaysAgo);
    const previousOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      return orderDate >= previousPeriodStart && orderDate < thirtyDaysAgo;
    });

    // Calculate revenue
    const recentRevenue = recentOrders.reduce((sum, order) => {
      // Only include completed orders in revenue calculation
      if (order.status === 'Completed') {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);

    const previousRevenue = previousOrders.reduce((sum, order) => {
      if (order.status === 'Completed') {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);

    // Calculate total revenue (all time, completed orders only)
    const totalRevenue = orders.reduce((sum, order) => {
      if (order.status === 'Completed') {
        return sum + order.totalAmount;
      }
      return sum;
    }, 0);

    // Calculate revenue change percentage
    const revenueChange = previousRevenue === 0 
      ? 100 
      : ((recentRevenue - previousRevenue) / previousRevenue) * 100;

    // Calculate active orders (pending or processing)
    const activeOrders = orders.filter(
      order => order.status === 'Pending' || order.status === 'Processing'
    ).length;

    // Calculate orders change
    const recentOrdersCount = recentOrders.length;
    const ordersChange = previousOrders.length === 0 
      ? 100 
      : ((recentOrdersCount - previousOrders.length) / previousOrders.length) * 100;

    // Calculate product stats
    const totalProducts = products.length;
    const recentProducts = products.filter(product => new Date(product.created_at) >= thirtyDaysAgo).length;
    const previousProducts = products.filter(product => {
      const createdAt = new Date(product.created_at);
      return createdAt >= previousPeriodStart && createdAt < thirtyDaysAgo;
    }).length;
    
    const productsChange = previousProducts === 0 
      ? 100 
      : ((recentProducts - previousProducts) / previousProducts) * 100;

    // Calculate customer stats
    const totalCustomers = customers.length;
    const recentCustomers = customers.filter(customer => new Date(customer.created_at) >= thirtyDaysAgo).length;
    const previousCustomers = customers.filter(customer => {
      const createdAt = new Date(customer.created_at);
      return createdAt >= previousPeriodStart && createdAt < thirtyDaysAgo;
    }).length;
    
    const customersChange = previousCustomers === 0 
      ? 100 
      : ((recentCustomers - previousCustomers) / previousCustomers) * 100;

    return {
      revenue: {
        total: totalRevenue,
        change: revenueChange,
      },
      activeOrders: {
        total: activeOrders,
        change: ordersChange,
      },
      products: {
        total: totalProducts,
        change: productsChange,
      },
      customers: {
        total: totalCustomers,
        change: customersChange,
      },
      recentOrders: orders
        .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
        .slice(0, 5),
    };
  }, [orders, products, customers]);
}