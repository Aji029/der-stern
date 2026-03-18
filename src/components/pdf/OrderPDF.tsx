import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { formatDateForDisplay } from '../../utils/dateFormatting';
import { formatPrice } from '../../utils/priceCalculations';
import type { Order } from '../../types/order';

const styles = StyleSheet.create({
  // ... existing styles ...
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

  const calculateVatAmount = (items: Order['items'], vatType: 'A' | 'B'): number => {
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
        {/* ... existing header and customer info ... */}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colNumber}>Nr.</Text>
            <Text style={styles.colArticle}>Artikel</Text>
            <Text style={styles.colProduct}>Bezeichnung</Text>
            <Text style={styles.colQuantity}>Menge</Text>
            <Text style={styles.colPrice}>Einzel €</Text>
            <Text style={styles.colTotal}>Gesamt</Text>
            <Text style={styles.colVat}>MwSt.</Text>
          </View>

          {order.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.colNumber}>{index + 1}</Text>
              <Text style={styles.colArticle}>{item.product.artikelNr}</Text>
              <Text style={styles.colProduct}>{item.product.name}</Text>
              <Text style={styles.colQuantity}>{item.quantity.toFixed(2)}</Text>
              <Text style={styles.colPrice}>{formatPrice(item.vkPrice)}</Text>
              <Text style={styles.colTotal}>
                {formatPrice(item.quantity * item.vkPrice)}
              </Text>
              <Text style={styles.colVat}>{item.product.mwst}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Netto:</Text>
            <Text style={styles.totalAmount}>{formatPrice(subtotal)}</Text>
          </View>
          {vatAmountA > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>MwSt. 7% (A):</Text>
              <Text style={styles.totalAmount}>{formatPrice(vatAmountA)}</Text>
            </View>
          )}
          {vatAmountB > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>MwSt. 19% (B):</Text>
              <Text style={styles.totalAmount}>{formatPrice(vatAmountB)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.bold]}>
            <Text style={styles.totalLabel}>Brutto:</Text>
            <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* ... existing footer ... */}
      </Page>
    </Document>
  );
}