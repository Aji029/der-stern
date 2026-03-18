import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { formatDateForDisplay } from '../../utils/dateFormatting';
import { formatPrice } from '../../utils/priceCalculations';
import type { Order } from '../../types/order';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
  },
  companies: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  company: {
    width: '45%',
  },
  companyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  invoiceNumber: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  date: {
    fontSize: 10,
    marginBottom: 20,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
    fontSize: 10,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    padding: 8,
    minHeight: 40,
    alignItems: 'center',
  },
  colNumber: { width: '8%', textAlign: 'center' },
  colArticle: { width: '15%', textAlign: 'center' },
  colProduct: { width: '32%', textAlign: 'left' },
  colQuantity: { width: '10%', textAlign: 'center' },
  colUnit: { width: '10%', textAlign: 'center' },
  colPrice: { width: '12%', textAlign: 'right' },
  colTotal: { width: '8%', textAlign: 'right' },
  colVat: { width: '5%', textAlign: 'center' },
  quantityBox: {
    backgroundColor: '#f3f4f6',
    padding: '4 8',
    borderRadius: 4,
    marginHorizontal: 'auto',
    width: '60%',
  },
  quantityText: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
  },
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
    fontFamily: 'Helvetica-Bold',
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

interface DeliveryNotePDFProps {
  order: Order;
}

export function DeliveryNotePDF({ order }: DeliveryNotePDFProps) {
  const calculateVatAmount = (items: Order['items'], vatType: 'A' | 'B') => {
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
        {/* Header Section */}
        <View style={styles.companies}>
          <View style={styles.company}>
            <Text style={styles.companyName}>{order.customer.companyName}</Text>
            <Text style={styles.text}>{order.customer.contactPerson}</Text>
            <Text style={styles.text}>{order.customer.address}</Text>
            <Text style={styles.text}>{order.customer.idNumber}</Text>
          </View>
          <View style={styles.company}>
            <Text style={styles.companyName}>Der Stern</Text>
            <Text style={styles.text}>Sabrina Kretschmar</Text>
            <Text style={styles.text}>Stubnitzstraße 28</Text>
            <Text style={styles.text}>13189 Berlin</Text>
            <Text style={styles.text}>Steuer-Nr.: 35/398/01172</Text>
          </View>
        </View>

        {/* Invoice Details */}
        <View style={styles.header}>
          <Text style={styles.invoiceNumber}>
            Lieferschein Nr.: {order.id}
          </Text>
          <Text style={styles.date}>
            Datum: {formatDateForDisplay(order.orderDate)}
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
              <View style={styles.colQuantity}>
                <View style={styles.quantityBox}>
                  <Text style={styles.quantityText}>
                    {item.quantity.toFixed(2)}
                  </Text>
                </View>
              </View>
              <Text style={styles.colUnit}>Stk</Text>
              <Text style={styles.colPrice}>{formatPrice(item.vkPrice)}</Text>
              <Text style={styles.colTotal}>
                {formatPrice(item.quantity * item.vkPrice)}
              </Text>
              <Text style={styles.colVat}>{item.product.mwst}</Text>
            </View>
          ))}
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Nettowert:</Text>
            <Text style={styles.summaryAmount}>{formatPrice(subtotal)}</Text>
          </View>
          {vatAmountA > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>MwSt. 7% (A):</Text>
              <Text style={styles.summaryAmount}>{formatPrice(vatAmountA)}</Text>
            </View>
          )}
          {vatAmountB > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>MwSt. 19% (B):</Text>
              <Text style={styles.summaryAmount}>{formatPrice(vatAmountB)}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.bold]}>
            <Text style={styles.summaryLabel}>Bruttowert:</Text>
            <Text style={styles.summaryAmount}>{formatPrice(total)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Ware ordnungsgemäß erhalten ________________ Unterschrift ________________
        </Text>
      </Page>
    </Document>
  );
}