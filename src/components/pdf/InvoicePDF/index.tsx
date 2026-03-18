import React from 'react';
import { Document, Page, StyleSheet } from '@react-pdf/renderer';
import { InvoiceHeader } from './InvoiceHeader';
import { InvoiceTable } from './InvoiceTable';
import { InvoiceSummary } from './InvoiceSummary';
import { generateInvoiceNumber } from '../../../utils/invoiceNumberGenerator';
import type { Order } from '../../../types/order';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
});

interface InvoicePDFProps {
  order: Order;
}

export function InvoicePDF({ order }: InvoicePDFProps) {
  const invoiceNumber = generateInvoiceNumber(order);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <InvoiceHeader order={order} invoiceNumber={invoiceNumber} />
        <InvoiceTable items={order.items} />
        <InvoiceSummary items={order.items} />
      </Page>
    </Document>
  );
}