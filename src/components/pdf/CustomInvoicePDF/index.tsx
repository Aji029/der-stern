import React from 'react';
import { Document, Page, View, StyleSheet } from '@react-pdf/renderer';
import { Header } from './Header';
import { InvoiceTable } from './InvoiceTable';
import { Summary } from './Summary';
import type { Order } from '../../../types/order';

const styles = StyleSheet.create({
  page: {
    padding: 70,
    paddingTop: 70, // Consistent top padding
    paddingBottom: 100, // Consistent bottom padding
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  contentWrapper: {
    flex: 1,
    paddingTop: 40, // Additional padding for content
  }
});

interface CustomInvoicePDFProps {
  order: Order;
  invoiceNumber: string | null;
}

export function CustomInvoicePDF({ order, invoiceNumber }: CustomInvoicePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.contentWrapper}>
          <Header order={order} invoiceNumber={invoiceNumber} />
          <InvoiceTable items={order.items} />
          <Summary items={order.items} />
        </View>
      </Page>
    </Document>
  );
}