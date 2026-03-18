import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Order } from '../types/order';

export type OrderStatusFilter = 'pending' | 'completed' | 'all';

interface OrdersState {
  orders: Order[];
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  pendingCount: number;
  completedCount: number;
}

export function useOrdersWithPagination(pageSize: number = 10) {
  const [state, setState] = useState<OrdersState>({
    orders: [],
    totalPages: 1,
    isLoading: false,
    error: null,
    totalCount: 0,
    pendingCount: 0,
    completedCount: 0,
  });

  const fetchOrders = useCallback(async (
    page: number,
    dateFilter?: string,
    statusFilter: OrderStatusFilter = 'pending'
  ) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Calculate pagination range
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Build date filter for queries
      let startOfDay: string | undefined;
      let endOfDay: string | undefined;
      if (dateFilter) {
        const start = new Date(dateFilter);
        start.setHours(0, 0, 0, 0);
        const end = new Date(dateFilter);
        end.setHours(23, 59, 59, 999);
        startOfDay = start.toISOString();
        endOfDay = end.toISOString();
      }

      // Fetch all counts for badges
      const countsPromises = [
        // Total count
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true }),
        // Pending count (Pending + Processing)
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['Pending', 'Processing']),
        // Completed count
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'Completed'),
      ];

      const [totalResult, pendingResult, completedResult] = await Promise.all(countsPromises);

      if (totalResult.error) throw totalResult.error;
      if (pendingResult.error) throw pendingResult.error;
      if (completedResult.error) throw completedResult.error;

      // Build filtered count query for pagination
      let countQuery = supabase
        .from('orders')
        .select('id', { count: 'exact', head: true });

      // Apply status filter
      if (statusFilter === 'pending') {
        countQuery = countQuery.in('status', ['Pending', 'Processing']);
      } else if (statusFilter === 'completed') {
        countQuery = countQuery.eq('status', 'Completed');
      }

      // Apply date filter
      if (startOfDay && endOfDay) {
        countQuery = countQuery
          .gte('order_date', startOfDay)
          .lte('order_date', endOfDay);
      }

      const { count, error: countError } = await countQuery;

      if (countError) throw countError;

      // Build data query
      let dataQuery = supabase
        .from('orders')
        .select(`
          id,
          status,
          total_amount,
          final_amount,
          order_date,
          delivery_date,
          payment_status,
          shipping_address,
          notes,
          discount,
          created_at,
          updated_at,
          customer:customers(
            id,
            company_name,
            contact_person,
            email
          ),
          items:order_items(
            id,
            quantity,
            ek_price,
            vk_price,
            total,
            product:products(
              artikel_nr,
              name,
              mwst,
              supplier_id
            )
          )
        `);

      // Apply status filter
      if (statusFilter === 'pending') {
        dataQuery = dataQuery.in('status', ['Pending', 'Processing']);
      } else if (statusFilter === 'completed') {
        dataQuery = dataQuery.eq('status', 'Completed');
      }

      // Apply date filter
      if (startOfDay && endOfDay) {
        dataQuery = dataQuery
          .gte('order_date', startOfDay)
          .lte('order_date', endOfDay);
      }

      const { data, error } = await dataQuery
        .range(from, to)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data with proper type checking
      const transformedOrders: Order[] = (data || []).map(order => ({
        id: order.id,
        customer: {
          id: order.customer?.id || '',
          companyName: order.customer?.company_name || '',
          contactPerson: order.customer?.contact_person || '',
          email: order.customer?.email || '',
          idNumber: '',
          address: '',
          billingAddress: ''
        },
        items: (order.items || []).map((item: any) => ({
          id: item.id,
          quantity: Number(item.quantity) || 0,
          ekPrice: Number(item.ek_price) || 0,
          vkPrice: Number(item.vk_price) || 0,
          total: Number(item.total) || 0,
          product: {
            artikelNr: item.product?.artikel_nr || '',
            name: item.product?.name || '',
            mwst: item.product?.mwst || 'A',
            supplierId: item.product?.supplier_id
          }
        })),
        status: order.status || 'Pending',
        totalAmount: Number(order.total_amount) || 0,
        finalAmount: Number(order.final_amount || order.total_amount) || 0,
        orderDate: new Date(order.order_date),
        deliveryDate: order.delivery_date ? new Date(order.delivery_date) : undefined,
        paymentStatus: order.payment_status || 'Pending',
        shippingAddress: order.shipping_address || '',
        notes: order.notes,
        discount: order.discount,
        created_at: order.created_at ? new Date(order.created_at) : undefined,
        updated_at: order.updated_at ? new Date(order.updated_at) : undefined
      }));

      setState({
        orders: transformedOrders,
        totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)),
        isLoading: false,
        error: null,
        totalCount: totalResult.count || 0,
        pendingCount: pendingResult.count || 0,
        completedCount: completedResult.count || 0,
      });
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      setState(prev => ({
        ...prev,
        orders: [],
        isLoading: false,
        error: err.message || 'Failed to load orders'
      }));
    }
  }, [pageSize]);

  return {
    ...state,
    fetchOrders
  };
}