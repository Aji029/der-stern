import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatPrice } from '../../../utils/priceCalculations';
import type { OrderItem } from '../../../types/order';

const styles = StyleSheet.create({
  table: {
    width: '100%',
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottom: '1pt solid #000',
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '0.5pt solid #e5e7eb',
    padding: 8,
    minHeight: 40,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
  },
  cellText: {
    fontSize: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
  // Fixed width columns
  pos: { width: '5%', textAlign: 'center' },
  artikelNr: { width: '15%', textAlign: 'center' },
  bezeichnung: { width: '25%' },
  menge: { width: '15%', textAlign: 'center' },
  verpackung: { width: '15%', textAlign: 'center' },
  einzel: { width: '10%', textAlign: 'right' },
  gesamt: { width: '10%', textAlign: 'right' },
  mwst: { width: '5%', textAlign: 'center' },
  quantityBox: {
    backgroundColor: '#f3f4f6',
    padding: '4 8',
    borderRadius: 4,
    marginHorizontal: 'auto',
    minWidth: '60%',
  },
  quantityText: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1f2937',
  },
});

interface InvoiceTableProps {
  items: OrderItem[];
}

export function InvoiceTable({ items }: InvoiceTableProps) {
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        <Text style={[styles.pos, styles.headerText]}>Pos.</Text>
        <Text style={[styles.artikelNr, styles.headerText]}>Artikel Nr.</Text>
        <Text style={[styles.bezeichnung, styles.headerText]}>Bezeichnung</Text>
        <Text style={[styles.menge, styles.headerText]}>Menge</Text>
        <Text style={[styles.verpackung, styles.headerText]}>Verpackung</Text>
        <Text style={[styles.einzel, styles.headerText]}>Einzel €</Text>
        <Text style={[styles.gesamt, styles.headerText]}>Gesamt €</Text>
        <Text style={[styles.mwst, styles.headerText]}>%</Text>
      </View>

      {items.map((item, index) => (
        <View key={index} style={styles.tableRow}>
          <Text style={[styles.pos, styles.cellText]}>{index + 1}</Text>
          <Text style={[styles.artikelNr, styles.cellText]}>{item.product.artikelNr}</Text>
          <Text style={[styles.bezeichnung, styles.cellText]}>{item.product.name}</Text>
          <View style={[styles.menge]}>
            <View style={styles.quantityBox}>
              <Text style={styles.quantityText}>
                {item.quantity.toFixed(2)}
              </Text>
            </View>
          </View>
          <Text style={[styles.verpackung, styles.cellText]}>Packung</Text>
          <Text style={[styles.einzel, styles.cellText]}>{formatPrice(item.vkPrice)}</Text>
          <Text style={[styles.gesamt, styles.cellText]}>
            {formatPrice(parseFloat((item.quantity * item.vkPrice).toFixed(2)))}
          </Text>
          <Text style={[styles.mwst, styles.cellText]}>{item.product.mwst}</Text>
        </View>
      ))}
    </View>
  );
}