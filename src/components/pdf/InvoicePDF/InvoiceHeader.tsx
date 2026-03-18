import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatDateForDisplay } from '../../../utils/dateFormatting';
import { generateInvoiceNumber } from '../../../utils/invoiceNumberGenerator';
import type { Order } from '../../../types/order';

const styles = StyleSheet.create({
  header: {
    marginBottom: 20,
  },
  companies: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  company: {
    fontSize: 10,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    fontSize: 10,
  },
});

interface InvoiceHeaderProps {
  order: Order;
  invoiceNumber: string;
}

export function InvoiceHeader({ order, invoiceNumber }: InvoiceHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.companies}>
        <View>
          <Text style={styles.companyName}>{order.customer.companyName}</Text>
          <Text style={styles.company}>{order.customer.contactPerson}</Text>
          <Text style={styles.company}>{order.customer.billingAddress || order.customer.address}</Text>
        </View>
        <View>
          <Text style={styles.companyName}>Der Stern</Text>
          <Text style={styles.company}>Sabrina Kretschmar</Text>
          <Text style={styles.company}>Stubnitzstraße 28</Text>
          <Text style={styles.company}>13189 Berlin</Text>
        </View>
      </View>
      <View style={styles.orderInfo}>
        <Text>Kunden Nr.: {order.customer.idNumber}</Text>
        <Text>Rechnung Nr.: {invoiceNumber}</Text>
        <Text>Datum: {formatDateForDisplay(order.orderDate)}</Text>
      </View>
    </View>
  );
}