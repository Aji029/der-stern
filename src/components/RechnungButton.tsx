import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';
import type { Order } from '../types/order';
import type { Customer } from '../types/customer';

interface RechnungButtonProps {
  order: Order;
  className?: string;
  children?: React.ReactNode;
}

// On-click PDF generation; see InvoiceButton for rationale.
export function RechnungButton({ order, className = '', children }: RechnungButtonProps) {
  const [latestCustomer, setLatestCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoadingCustomer(true);
    supabase
      .from('customers')
      .select('*')
      .eq('id', order.customer.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data) return;
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
      .catch(() => setLatestCustomer(order.customer as Customer))
      .finally(() => { if (!cancelled) setIsLoadingCustomer(false); });
    return () => { cancelled = true; };
  }, [order.customer.id]);

  const handleClick = async () => {
    const orderWithCustomer = latestCustomer ? { ...order, customer: latestCustomer } : order;
    setLoading(true);
    try {
      const [{ pdf }, { RechnungPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./pdf/RechnungPDF'),
      ]);
      const blob = await pdf(<RechnungPDF order={orderWithCustomer} invoiceNumber={order.id} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rechnung-${order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Rechnung PDF failed', e);
      alert('Failed to generate Rechnung. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading || isLoadingCustomer}
      className={className}
      title="Rechnung PDF"
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}
