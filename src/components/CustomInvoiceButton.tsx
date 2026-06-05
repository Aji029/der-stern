import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { supabase } from '../lib/supabase';
import type { Order } from '../types/order';
import type { Customer } from '../types/customer';

interface CustomInvoiceButtonProps {
  order: Order;
  className?: string;
  children?: React.ReactNode;
}

// On-click PDF generation; see InvoiceButton for rationale.
export function CustomInvoiceButton({ order, className = '', children }: CustomInvoiceButtonProps) {
  const [generatedInvoices, setGeneratedInvoices] = useLocalStorage<Record<string, string>>(
    'generated_invoices',
    {}
  );
  const [latestCustomer, setLatestCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [loading, setLoading] = useState(false);

  const isGenerated = order.id in generatedInvoices;
  const invoiceNumber = isGenerated ? generatedInvoices[order.id] : order.id;

  useEffect(() => {
    let cancelled = false;
    setIsLoadingCustomer(true);
    supabase
      .from('customers')
      .select('*')
      .eq('id', order.customer.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setLatestCustomer(order.customer);
          return;
        }
        setLatestCustomer({
          id: data.id,
          companyName: data.company_name,
          contactPerson: data.contact_person,
          email: data.email,
          phone: data.phone || '',
          address: data.address || '',
          idNumber: data.id_number || '',
          billingAddress: data.billing_address || '',
        });
      })
      .catch(() => { if (!cancelled) setLatestCustomer(order.customer); })
      .finally(() => { if (!cancelled) setIsLoadingCustomer(false); });
    return () => { cancelled = true; };
  }, [order.customer.id]);

  const handleClick = async () => {
    if (!isGenerated) {
      setGeneratedInvoices(prev => ({ ...prev, [order.id]: order.id }));
    }
    const orderWithLatestCustomer = latestCustomer
      ? { ...order, customer: latestCustomer }
      : order;
    setLoading(true);
    try {
      const [{ pdf }, { CustomInvoicePDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./pdf/CustomInvoicePDF'),
      ]);
      const blob = await pdf(<CustomInvoicePDF order={orderWithLatestCustomer} invoiceNumber={order.id} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rechnung-${invoiceNumber || order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Custom invoice PDF failed', e);
      alert('Failed to generate Rechnung. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const buttonClasses = `${className} transition-colors duration-200 ${
    isGenerated ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100 hover:border-green-300' : ''
  }`;

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading || isLoadingCustomer}
      className={buttonClasses}
      title="Rechnung"
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}
