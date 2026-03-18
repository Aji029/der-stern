import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { formatDateForDisplay } from '../../../utils/dateFormatting';
import { formatPrice } from '../../../utils/priceCalculations';
import type { Order } from '../../../types/order';

const styles = StyleSheet.create({
  page: {
    padding: '40 30',
    fontFamily: 'Helvetica',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  companyInfo: {
    width: '45%',
  },
  customerInfo: {
    width: '45%',
    textAlign: 'right',
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  invoiceDetails: {
    marginBottom: 20,
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  invoiceDate: {
    fontSize: 10,
    marginBottom: 20,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    fontSize: 10,
    paddingVertical: 5,
    textAlign: 'center',
  },
  colNumber: { width: '8%' },
  colArticle: { width: '15%' },
  colProduct: { width: '32%', textAlign: 'left' },
  colQuantity: { width: '10%' },
  colUnit: { width: '10%' },
  colPrice: { width: '12%' },
  colTotal: { width: '8%' },
  colVat: { width: '5%' },
  summarySection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  summaryRow: {
    flexDirection: 'row',
    fontSize: 10,
    marginBottom: 5,
  },
  summaryLabel: {
    width: 100,
  },
  summaryAmount: {
    width: 80,
    textAlign: 'right',
  },
  bold: {
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    fontSize: 8,
    textAlign: 'center',
    color: '#666',
  },
});

interface InvoicePDFProps {
  order: Order;
}

export function InvoicePDF({ order }: InvoicePDFProps) {
  const calculateVatAmount = (items: Order['items'], vatType: 'A' | 'B') => {
    const rate = vatType === 'A' ? 0.07 : 0.19;
    return items
      .filter(item => item.product.mwst === vatType)
      .reduce((sum, item) => sum + (item.quantity * item.vkPrice * rate), 0);
  };

  const vatAmountA = calculateVatAmount(order.items, 'A');
  const vatAmountB = calculateVatAmount(order.items, 'B');
  const subtotal = order.items.reduce((sum, item) => 
    sum + parseFloat((item.quantity * item.vkPrice).toFixed(2)), 0
  );
  const total = parseFloat((subtotal + vatAmountA + vatAmountB).toFixed(2));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>Ganymed Berlin GmbH</Text>
            <Text style={styles.addressText}>Ganymed Brasserie</Text>
            <Text style={styles.addressText}>HGK CISBOX 401475</Text>
            <Text style={styles.addressText}>30127 Hannover</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.companyName}>{order.customer.companyName}</Text>
            <Text style={styles.addressText}>{order.customer.contactPerson}</Text>
            <Text style={styles.addressText}>{order.shippingAddress}</Text>
          </View>
        </View>

        {/* Invoice Details */}
        <View style={styles.invoiceDetails}>
          <Text style={styles.invoiceNumber}>
            Rechnung Nr.: {order.id}
          </Text>
          <Text style={styles.invoiceDate}>
            Rechnungsdatum: {formatDateForDisplay(order.orderDate)}
          </Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNumber}>Nr.</Text>
            <Text style={styles.colArticle}>Artikel</Text>
            <Text style={styles.colProduct}>Bezeichnung</Text>
            <Text style={styles.colQuantity}>Menge</Text>
            <Text style={styles.colUnit}>Einheit</Text>
            <Text style={styles.colPrice}>Einzel (EUR)</Text>
            <Text style={styles.colTotal}>Gesamt</Text>
            <Text style={styles.colVat}>MwSt.</Text>
          </View>

          {order.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colNumber}>{index + 1}</Text>
              <Text style={styles.colArticle}>{item.product.artikelNr}</Text>
              <Text style={styles.colProduct}>{item.product.name}</Text>
              <Text style={styles.colQuantity}>{item.quantity.toFixed(2)}</Text>
              <Text style={styles.colUnit}>Stk</Text>
              <Text style={styles.colPrice}>{item.vkPrice.toFixed(2)}</Text>
              <Text style={styles.colTotal}>
                {(item.quantity * item.vkPrice).toFixed(2)}
              </Text>
              <Text style={styles.colVat}>{item.product.mwst}</Text>
            </View>
          ))}
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Nettowert:</Text>
            <Text style={styles.summaryAmount}>{subtotal.toFixed(2)} €</Text>
          </View>
          {vatAmountA > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>MwSt. 7% (A):</Text>
              <Text style={styles.summaryAmount}>{vatAmountA.toFixed(2)} €</Text>
            </View>
          )}
          {vatAmountB > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>MwSt. 19% (B):</Text>
              <Text style={styles.summaryAmount}>{vatAmountB.toFixed(2)} €</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.bold]}>
            <Text style={styles.summaryLabel}>Bruttowert:</Text>
            <Text style={styles.summaryAmount}>{total.toFixed(2)} €</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Vielen Dank für Ihren Einkauf!
        </Text>
      </Page>
    </Document>
  );
}