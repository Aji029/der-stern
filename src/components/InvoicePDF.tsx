import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { formatDateForDisplay } from '../utils/dateFormatting';
import { formatPrice } from '../utils/priceCalculations';
import type { Order } from '../types/order';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
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
  orderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  table: {
    marginTop: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 8,
  },
  col: {
    flexGrow: 1,
  },
  colPos: {
    width: 30,
  },
  colArtNr: {
    width: 60,
  },
  colDesc: {
    flex: 2,
  },
  colQty: {
    width: 50,
    textAlign: 'right',
  },
  colUnit: {
    width: 80,
    textAlign: 'center',
  },
  colPrice: {
    width: 60,
    textAlign: 'right',
  },
  colTotal: {
    width: 60,
    textAlign: 'right',
  },
  colVat: {
    width: 30,
    textAlign: 'center',
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  totals: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 5,
  },
  totalLabel: {
    width: 100,
  },
  totalAmount: {
    width: 80,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
  },
});

interface InvoicePDFProps {
  order: Order;
}

export function InvoicePDF({ order }: InvoicePDFProps) {
  const calculateVatAmount = (items: any[], vatType: 'A' | 'B') => {
    const rate = vatType === 'A' ? 0.07 : 0.19;
    return items
      .filter(item => item.product.mwst === vatType)
      .reduce((sum, item) => sum + (item.quantity * item.vkPrice * rate), 0);
  };

  const vatAmountA = calculateVatAmount(order.items, 'A');
  const vatAmountB = calculateVatAmount(order.items, 'B');
  const subtotal = order.items.reduce((sum, item) => sum + (item.quantity * item.vkPrice), 0);
  const total = subtotal + vatAmountA + vatAmountB;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.bold}>Ganymed Berlin GmbH</Text>
            <Text>Ganymed Brasserie</Text>
            <Text>HGK CISBOX 401475</Text>
            <Text>30127 Hannover</Text>
          </View>
          <View style={styles.customerInfo}>
            <Text style={styles.bold}>Der Stern</Text>
            <Text>{order.customer.companyName}</Text>
            <Text>{order.shippingAddress}</Text>
          </View>
        </View>

        {/* Order Info */}
        <View style={styles.orderInfo}>
          <Text>Kunden Nr.: {order.customer.idNumber}</Text>
          <Text>Rechnung Nr.: {order.id}</Text>
          <Text>Datum: {formatDateForDisplay(order.orderDate)}</Text>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colPos}>Pos.</Text>
            <Text style={styles.colArtNr}>Artikel Nr.</Text>
            <Text style={styles.colDesc}>Bezeichnung</Text>
            <Text style={styles.colQty}>Menge</Text>
            <Text style={styles.colUnit}>Verpackung Einheit</Text>
            <Text style={styles.colPrice}>Einzel €</Text>
            <Text style={styles.colTotal}>Gesamt €</Text>
            <Text style={styles.colVat}>%</Text>
          </View>

          {order.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colPos}>{index + 1}</Text>
              <Text style={styles.colArtNr}>{item.product.artikelNr}</Text>
              <Text style={styles.colDesc}>{item.product.name}</Text>
              <Text style={styles.colQty}>{item.quantity.toFixed(2)}</Text>
              <Text style={styles.colUnit}>{item.product.packungArt}</Text>
              <Text style={styles.colPrice}>{item.vkPrice.toFixed(2)}</Text>
              <Text style={styles.colTotal}>{(item.quantity * item.vkPrice).toFixed(2)}</Text>
              <Text style={styles.colVat}>{item.product.mwst}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Netto:</Text>
            <Text style={styles.totalAmount}>{subtotal.toFixed(2)} €</Text>
          </View>
          {vatAmountA > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>MwSt. 7%:</Text>
              <Text style={styles.totalAmount}>{vatAmountA.toFixed(2)} €</Text>
            </View>
          )}
          {vatAmountB > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>MwSt. 19%:</Text>
              <Text style={styles.totalAmount}>{vatAmountB.toFixed(2)} €</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.bold]}>
            <Text style={styles.totalLabel}>Summe:</Text>
            <Text style={styles.totalAmount}>{total.toFixed(2)} €</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Vielen Dank für Ihren Einkauf!
        </Text>
      </Page>
    </Document>
  );
}