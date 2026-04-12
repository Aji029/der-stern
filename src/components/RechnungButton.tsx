import React, { useState, useEffect } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from './ui/Button';
import { RechnungPDF } from './pdf/RechnungPDF';
import { supabase } from '../lib/supabase';
import type { Order } from '../types/order';
import type { Customer } from '../types/customer';

interface RechnungButtonProps {
  order: Order;
  className?: string;
  children?: React.ReactNode;
}

export function RechnungButton({ order, className = '', children }: RechnungButtonProps) {
  const [latestCustomer, setLatestCustomer] = useState<Customer | null>(null);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);

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

  const orderWithCustomer = latestCustomer
    ? { ...order, customer: latestCustomer }
    : order;

  return (
    <PDFDownloadLink
      document={<RechnungPDF order={orderWithCustomer} invoiceNumber={order.id} />}
      fileName={`rechnung-${order.id}.pdf`}
    >
      {({ loading }) => (
        <Button
          variant="outline"
          size="sm"
          disabled={loading || isLoadingCustomer}
          className={className}
          title="Rechnung PDF"
        >
          {children}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
