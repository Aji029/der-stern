import React from 'react';
import { Document, Page, StyleSheet } from '@react-pdf/renderer';
import { Header } from './Header';
import { ItemsTable } from './ItemsTable';
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

interface DeliveryNotePDFProps {
  order: Order;
}

export function DeliveryNotePDF({ order }: DeliveryNotePDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header order={order} />
        <ItemsTable items={order.items} />
        <Summary items={order.items} />
      </Page>
    </Document>
  );
}