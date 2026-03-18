import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from './ui/Button';
import { CustomInvoicePDF } from './pdf/CustomInvoicePDF';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { supabase } from '../lib/supabase';
import type { Order } from '../types/order';
import type { Customer } from '../types/customer';

interface CustomInvoiceButtonProps {
  order: Order;
  className?: string;
  children?: React.ReactNode;
}

const INVOICE_SEQUENCE_KEY = 'invoice_sequence';

export function CustomInvoiceButton({ order, className = "", children }: CustomInvoiceButtonProps) {
  const [generatedInvoices, setGeneratedInvoices] = useLocalStorage<Record<string, string>>(
    'generated_invoices',
    {}
  );
  const [latestCustomer, setLatestCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);

  const isGenerated = order.id in generatedInvoices;
  const invoiceNumber = isGenerated ? generatedInvoices[order.id] : order.id;

  useEffect(() => {
    fetchLatestCustomerData();
  }, [order.customer.id]);

  const fetchLatestCustomerData = async () => {
    setIsLoadingCustomer(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', order.customer.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        const mappedCustomer: Customer = {
          id: data.id,
          companyName: data.company_name,
          contactPerson: data.contact_person,
          email: data.email,
          phone: data.phone || '',
          address: data.address || '',
          idNumber: data.id_number || '',
          billingAddress: data.billing_address || ''
        };
        setLatestCustomer(mappedCustomer);
      }
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
      setLatestCustomer(order.customer);
    } finally {
      setIsLoadingCustomer(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!isGenerated) {
      try {
        // Use order ID directly as invoice number
        const number = order.id;
        setGeneratedInvoices(prev => ({
          ...prev,
          [order.id]: number
        }));
      } catch (error) {
        console.error('Failed to generate invoice number:', error);
      }
    }
  };

  const buttonClasses = `${className} transition-colors duration-200 ${
    isGenerated ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300' : ''
  }`;

  const orderWithLatestCustomer = latestCustomer
    ? { ...order, customer: latestCustomer }
    : order;

  return (
    <PDFDownloadLink
      document={<CustomInvoicePDF order={orderWithLatestCustomer} invoiceNumber={order.id} />}
      fileName={`rechnung-${invoiceNumber || order.id}.pdf`}
      onClick={handleGenerateInvoice}
    >
      {({ loading }) => (
        <Button
          variant="outline"
          size="sm"
          disabled={loading || isLoadingCustomer}
          className={buttonClasses}
          title="Rechnung"
        >
          {children}
        </Button>
      )}
    </PDFDownloadLink>
  );
}