import React from 'react';
import { Page, Text, View, Document, StyleSheet } from '@react-pdf/renderer';
import { formatDateForDisplay } from '../../../../utils/dateFormatting';
import { formatPrice } from '../../../../utils/priceCalculations';
import type { GroupedOrders } from '../../hooks/useTodaysPick';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  supplierSection: {
    marginBottom: 20,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  item: {
    marginBottom: 8,
    paddingLeft: 10,
  },
  itemName: {
    fontSize: 12,
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 10,
    color: '#666',
  },
  totals: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f3f4f6',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    fontSize: 10,
  },
  bold: {
    fontWeight: 'bold',
  },
});

interface TodaysPickPDFProps {
  groupedOrders: GroupedOrders[];
  selectedDate: string;
  singleSupplier?: boolean;
}

export function TodaysPickPDF({ groupedOrders, selectedDate, singleSupplier = false }: TodaysPickPDFProps) {
  const calculateTotals = (items: GroupedOrders['items']) => {
    return items.reduce((acc, item) => ({
      totalEK: acc.totalEK + (item.ekPrice * item.quantity),
      totalVK: acc.totalVK + (item.vkPrice * item.quantity),
      totalQuantity: acc.totalQuantity + item.quantity,
    }), { totalEK: 0, totalVK: 0, totalQuantity: 0 });
  };

  const title = singleSupplier 
    ? `Picking List - ${groupedOrders[0].supplierName}`
    : 'Picking List - All Suppliers';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>{title}</Text>
        <Text style={styles.date}>
          Date: {formatDateForDisplay(selectedDate)}
        </Text>

        {groupedOrders.map((group) => {
          const totals = calculateTotals(group.items);
          const margin = ((totals.totalVK - totals.totalEK) / totals.totalEK * 100).toFixed(2);

          return (
            <View key={group.supplierId} style={styles.supplierSection}>
              <Text style={styles.supplierName}>
                {group.supplierName} ({group.items.length} items)
              </Text>

              {group.items.map((item, index) => (
                <View key={`${item.product.artikelNr}-${index}`} style={styles.item}>
                  <Text style={styles.itemName}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.itemDetails}>
                    Art. Nr: {item.product.artikelNr}
                    {' - '}
                    Quantity: {item.quantity}
                    {' - '}
                    EK: {formatPrice(item.ekPrice)}
                    {' - '}
                    Total: {formatPrice(item.ekPrice * item.quantity)}
                  </Text>
                </View>
              ))}

              <View style={styles.totals}>
                <View style={styles.totalRow}>
                  <Text>Total Items:</Text>
                  <Text>{totals.totalQuantity}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text>Total EK:</Text>
                  <Text>{formatPrice(totals.totalEK)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text>Total VK:</Text>
                  <Text>{formatPrice(totals.totalVK)}</Text>
                </View>
                <View style={[styles.totalRow, styles.bold]}>
                  <Text>Margin:</Text>
                  <Text>{margin}%</Text>
                </View>
              </View>
            </View>
          );
        })}
      </Page>
    </Document>
  );
}