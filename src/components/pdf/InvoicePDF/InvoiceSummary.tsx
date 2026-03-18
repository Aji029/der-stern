import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatPrice } from '../../../utils/priceCalculations';
import type { OrderItem } from '../../../types/order';

const styles = StyleSheet.create({
  summary: {
    marginTop: 20,
  },
  totals: {
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  totalLabel: {
    width: 100,
  },
  totalAmount: {
    width: 80,
    textAlign: 'right',
  },
  bold: {
    fontWeight: 'bold',
  },
});

interface InvoiceSummaryProps {
  items: OrderItem[];
}

export function InvoiceSummary({ items }: InvoiceSummaryProps) {
  const calculateVatAmount = (items: OrderItem[], vatType: 'A' | 'B') => {
    const rate = vatType === 'A' ? 0.07 : 0.19;
    return items
      .filter(item => item.product.mwst === vatType)
      .reduce((sum, item) => sum + (item.quantity * item.vkPrice * rate), 0);
  };

  const vatAmountA = calculateVatAmount(items, 'A');
  const vatAmountB = calculateVatAmount(items, 'B');
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.vkPrice), 0);
  const total = subtotal + vatAmountA + vatAmountB;

  return (
    <View style={styles.summary}>
      <View style={styles.totals}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Netto:</Text>
          <Text style={styles.totalAmount}>{formatPrice(subtotal)}</Text>
        </View>
        {vatAmountA > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>MwSt. 7%:</Text>
            <Text style={styles.totalAmount}>{formatPrice(vatAmountA)}</Text>
          </View>
        )}
        {vatAmountB > 0 && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>MwSt. 19%:</Text>
            <Text style={styles.totalAmount}>{formatPrice(vatAmountB)}</Text>
          </View>
        )}
        <View style={[styles.totalRow, styles.bold]}>
          <Text style={styles.totalLabel}>Summe:</Text>
          <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
        </View>
      </View>
    </View>
  );
}