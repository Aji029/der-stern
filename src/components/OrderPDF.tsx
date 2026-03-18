import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { formatPrice } from '../utils/priceCalculations';
import { formatDateForDisplay } from '../utils/dateFormatting';
import type { Order } from '../context/OrderContext';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  text: {
    fontSize: 10,
    marginBottom: 3,
  },
  bold: {
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  table: {
    display: 'table',
    width: '100%',
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    borderBottomStyle: 'solid',
    alignItems: 'center',
    minHeight: 24,
    paddingVertical: 8,
  },
  tableHeader: {
    backgroundColor: '#f0f0f0',
  },
  tableCell: {
    flex: 1,
    padding: 5,
    fontSize: 10,
  },
  priceCell: {
    flex: 0.75,
    padding: 5,
    textAlign: 'right',
    fontSize: 10,
  },
  total: {
    marginTop: 20,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: 'bold',
  },
  status: {
    marginTop: 10,
    padding: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  margins: {
    marginTop: 10,
    padding: 6,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  }
});

interface OrderPDFProps {
  order: Order;
}

export function OrderPDF({ order }: OrderPDFProps) {
  if (!order || !order.items || !order.customer) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <Text>Invalid order data</Text>
        </Page>
      </Document>
    );
  }

  const calculateTotalMargin = () => {
    const totalEK = order.items.reduce((sum, item) => sum + (item.ekPrice * item.quantity), 0);
    const totalVK = order.items.reduce((sum, item) => sum + (item.vkPrice * item.quantity), 0);
    return ((totalVK - totalEK) / totalEK) * 100;
  };

  const totalEKAmount = order.items.reduce((sum, item) => sum + (item.ekPrice * item.quantity), 0);
  const totalVKAmount = order.items.reduce((sum, item) => sum + (item.vkPrice * item.quantity), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Order Invoice</Text>
          <Text style={styles.text}>Order Number: {order.id}</Text>
          <Text style={styles.text}>Date: {formatDateForDisplay(order.orderDate)}</Text>
          <View style={styles.status}>
            <Text style={styles.text}>Status: {order.status}</Text>
            <Text style={styles.text}>Payment Status: {order.paymentStatus}</Text>
          </View>
        </View>

        {/* Customer Information */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>Customer Information:</Text>
          <Text style={styles.text}>Company: {order.customer.companyName}</Text>
          <Text style={styles.text}>Contact: {order.customer.contactPerson}</Text>
          <Text style={styles.text}>Email: {order.customer.email}</Text>
          <Text style={styles.text}>Phone: {order.customer.phone}</Text>
          <Text style={styles.text}>Customer ID: {order.customer.id}</Text>
        </View>

        {/* Shipping Information */}
        <View style={styles.section}>
          <Text style={styles.subtitle}>Shipping Address:</Text>
          <Text style={styles.text}>{order.shippingAddress}</Text>
        </View>

        {/* Order Items */}
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCell}>Product</Text>
            <Text style={styles.tableCell}>Article Nr.</Text>
            <Text style={styles.tableCell}>Quantity</Text>
            <Text style={styles.priceCell}>EK Price</Text>
            <Text style={styles.priceCell}>VK Price</Text>
            <Text style={styles.priceCell}>Total</Text>
          </View>

          {order.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCell}>{item.product.name}</Text>
              <Text style={styles.tableCell}>{item.product.artikelNr}</Text>
              <Text style={styles.tableCell}>{item.quantity}</Text>
              <Text style={styles.priceCell}>{formatPrice(item.ekPrice)}</Text>
              <Text style={styles.priceCell}>{formatPrice(item.vkPrice)}</Text>
              <Text style={styles.priceCell}>
                {formatPrice(item.quantity * item.vkPrice)}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals and Margins */}
        <View style={styles.margins}>
          <Text style={styles.text}>
            Total Items: {order.items.reduce((sum, item) => sum + item.quantity, 0)}
          </Text>
          <Text style={styles.text}>
            Total EK Amount: {formatPrice(totalEKAmount)}
          </Text>
          <Text style={styles.text}>
            Total VK Amount: {formatPrice(totalVKAmount)}
          </Text>
          <Text style={styles.text}>
            Margin: {calculateTotalMargin().toFixed(2)}%
          </Text>
        </View>

        <View style={styles.total}>
          <Text>Total Amount: {formatPrice(order.totalAmount)}</Text>
        </View>

        {/* Notes */}
        {order.notes && (
          <View style={[styles.section, { marginTop: 20 }]}>
            <Text style={styles.subtitle}>Notes:</Text>
            <Text style={styles.text}>{order.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={[styles.section, { marginTop: 'auto' }]}>
          <Text style={[styles.text, { textAlign: 'center', color: '#666' }]}>
            Generated on {formatDateForDisplay(new Date())}
          </Text>
        </View>
      </Page>
    </Document>
  );
}