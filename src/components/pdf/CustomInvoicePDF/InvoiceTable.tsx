import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatPrice } from '../../../utils/priceCalculations';
import type { OrderItem } from '../../../types/order';

const styles = StyleSheet.create({
  table: {
    width: '100%',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 4,
    minHeight: 24,
  },
  header: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 8,
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
  },
  numberCol: { width: '8%', textAlign: 'center' },
  articleCol: { width: '15%', textAlign: 'center' },
  productCol: { width: '32%', textAlign: 'left' },
  quantityCol: { width: '10%', textAlign: 'center' },
  priceCol: { width: '12%', textAlign: 'right' },
  totalCol: { width: '15%', textAlign: 'right' },
  vatCol: { width: '8%', textAlign: 'center' },
  cell: {
    fontSize: 10,
    padding: '4 8',
  },
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
});

interface InvoiceTableProps {
  items: OrderItem[];
}

export function InvoiceTable({ items }: InvoiceTableProps) {
  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.header]}>
        <Text style={styles.numberCol}>Nr.</Text>
        <Text style={styles.articleCol}>Artikel</Text>
        <Text style={styles.productCol}>Bezeichnung</Text>
        <Text style={styles.quantityCol}>Menge</Text>
        <Text style={styles.priceCol}>Einzel €</Text>
        <Text style={styles.totalCol}>Gesamt €</Text>
        <Text style={styles.vatCol}>MwSt.</Text>
      </View>

      {items.map((item, index) => (
        <View key={index} style={styles.row}>
          <Text style={[styles.cell, styles.numberCol]}>{index + 1}</Text>
          <Text style={[styles.cell, styles.articleCol]}>{item.product.artikelNr}</Text>
          <Text style={[styles.cell, styles.productCol]}>{item.product.name}</Text>
          <View style={styles.quantityCol}>
            <View style={styles.quantityBox}>
              <Text style={styles.quantityText}>
                {item.quantity.toFixed(2)}
              </Text>
            </View>
          </View>
          <Text style={[styles.cell, styles.priceCol]}>{formatPrice(item.vkPrice)}</Text>
          <Text style={[styles.cell, styles.totalCol]}>
            {formatPrice(item.quantity * item.vkPrice)}
          </Text>
          <Text style={[styles.cell, styles.vatCol]}>{item.product.mwst}</Text>
        </View>
      ))}
    </View>
  );
}