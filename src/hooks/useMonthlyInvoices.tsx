import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { pdf } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { CustomInvoicePDF } from '../components/pdf/CustomInvoicePDF';
import type { Order } from '../types/order';

interface MonthlyInvoicesState {
  isGenerating: boolean;
  progress: number;
  total: number;
  error: string | null;
}

export function useMonthlyInvoices() {
  const [state, setState] = useState<MonthlyInvoicesState>({
    isGenerating: false,
    progress: 0,
    total: 0,
    error: null,
  });

  const generateMonthlyInvoices = async (year: number, month: number) => {
    try {
      setState({
        isGenerating: true,
        progress: 0,
        total: 0,
        error: null,
      });

      const startDate = new Date(year, month - 1, 1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(year, month, 0);
      endDate.setHours(23, 59, 59, 999);

      let allOrders: any[] = [];
      const pageSize = 1000;
      let currentPage = 0;
      let hasMore = true;

      while (hasMore) {
        const from = currentPage * pageSize;
        const to = from + pageSize - 1;

        const { data: pageOrders, error: fetchError } = await supabase
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
              email,
              address,
              id_number,
              billing_address
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
          `)
          .gte('order_date', startDate.toISOString())
          .lte('order_date', endDate.toISOString())
          .order('order_date', { ascending: true })
          .range(from, to);

        if (fetchError) throw fetchError;

        if (pageOrders && pageOrders.length > 0) {
          allOrders = [...allOrders, ...pageOrders];
          hasMore = pageOrders.length === pageSize;
          currentPage++;
        } else {
          hasMore = false;
        }
      }

      if (allOrders.length === 0) {
        throw new Error('No orders found for this month');
      }

      const orders = allOrders;

      const transformedOrders: Order[] = orders.map(order => ({
        id: order.id,
        customer: {
          id: order.customer?.id || '',
          companyName: order.customer?.company_name || '',
          contactPerson: order.customer?.contact_person || '',
          email: order.customer?.email || '',
          idNumber: order.customer?.id_number || '',
          address: order.customer?.address || '',
          billingAddress: order.customer?.billing_address || ''
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

      setState(prev => ({
        ...prev,
        total: transformedOrders.length,
      }));

      const zip = new JSZip();
      const monthName = new Date(year, month - 1).toLocaleString('default', { month: 'long' });

      for (let i = 0; i < transformedOrders.length; i++) {
        const order = transformedOrders[i];

        const pdfDoc = pdf(
          <CustomInvoicePDF order={order} invoiceNumber={order.id} />
        );

        const blob = await pdfDoc.toBlob();

        const orderDate = new Date(order.orderDate);
        const dateStr = orderDate.toISOString().split('T')[0];
        const fileName = `${dateStr}_Rechnung_${order.id}_${order.customer.companyName.replace(/[^a-z0-9]/gi, '_')}.pdf`;

        zip.file(fileName, blob);

        setState(prev => ({
          ...prev,
          progress: i + 1,
        }));
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `Rechnungen_${monthName}_${year}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      setState({
        isGenerating: false,
        progress: 0,
        total: 0,
        error: null,
      });

      return {
        success: true,
        count: transformedOrders.length,
      };
    } catch (err: any) {
      console.error('Error generating monthly invoices:', err);
      setState({
        isGenerating: false,
        progress: 0,
        total: 0,
        error: err.message || 'Failed to generate invoices',
      });
      throw err;
    }
  };

  return {
    ...state,
    generateMonthlyInvoices,
  };
}
