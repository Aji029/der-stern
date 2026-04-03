import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatPrice } from '../../../utils/priceCalculations';
import type { OrderItem } from '../../../types/order';

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    paddingHorizontal: 15,
    paddingBottom: 70, // Consistent bottom padding
  },
  table: {
    display: 'table',
    width: '100%',
    borderCollapse: 'collapse',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    paddingVertical: 6,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingVertical: 10,
    borderTopWidth: 2,
    borderTopColor: '#000',
  },
  cell: {
    fontSize: 10,
    padding: 5,
    textAlign: 'right',
    flex: 1,
  },
  headerCell: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    padding: 5,
    textAlign: 'right',
    flex: 1,
  },
  descriptionCell: {
    textAlign: 'left',
    flex: 3,
    fontSize: 10,
    padding: 5,
  },
  headerDescriptionCell: {
    textAlign: 'left',
    flex: 3,
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    padding: 5,
  },
  totalLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    textAlign: 'left',
  },
  totalValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    textAlign: 'right',
  },
  footer: {
    marginTop: 40,
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center',
  },
});

interface SummaryProps {
  items: OrderItem[];
}

export function Summary({ items }: SummaryProps) {
  const calculateAmounts = (items: OrderItem[], vatType: 'A' | 'B') => {
    const filteredItems = items.filter(item => item.product.mwst === vatType);
    const netto = filteredItems.reduce((sum, item) => sum + item.quantity * item.vkPrice, 0);
    const vatRate = vatType === 'A' ? 0.07 : 0.19;
    const vat = netto * vatRate;
    const brutto = netto + vat;

    return { netto, vat, brutto };
  };

  const amountsA = calculateAmounts(items, 'A');
  const amountsB = calculateAmounts(items, 'B');
  const totalNetto = amountsA.netto + amountsB.netto;
  const totalVat = amountsA.vat + amountsB.vat;
  const totalBrutto = totalNetto + totalVat;

  return (
    <View style={styles.container}>
      <View style={styles.table}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={styles.headerDescriptionCell}>Beschreibung</Text>
          <Text style={styles.headerCell}>Betrag</Text>
        </View>

        {/* Nettobetrag Rows */}
        <View style={styles.tableRow}>
          <Text style={styles.descriptionCell}>Nettobetrag 7%</Text>
          <Text style={styles.cell}>{formatPrice(amountsA.netto)}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.descriptionCell}>Nettobetrag 19%</Text>
          <Text style={styles.cell}>{formatPrice(amountsB.netto)}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.descriptionCell}>Gesamtnettobetrag</Text>
          <Text style={styles.cell}>{formatPrice(totalNetto)}</Text>
        </View>

        {/* MwSt Rows */}
        <View style={styles.tableRow}>
          <Text style={styles.descriptionCell}>MwSt. 7% (A)</Text>
          <Text style={styles.cell}>{formatPrice(amountsA.vat)}</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.descriptionCell}>MwSt. 19% (B)</Text>
          <Text style={styles.cell}>{formatPrice(amountsB.vat)}</Text>
        </View>

        {/* Total Row */}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Gesamtbetrag</Text>
          <Text style={styles.totalValue}>{formatPrice(totalBrutto)}</Text>
        </View>
      </View>

      <Text style={styles.footer}>Vielen Dank für Ihre Bestellung!</Text>
    </View>
  );
}