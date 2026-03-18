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
    fontSize: 22,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 11,
    color: '#666',
    marginBottom: 25,
  },
  supplierSection: {
    marginBottom: 25,
    borderBottom: '1 solid #e5e7eb',
    paddingBottom: 15,
  },
  supplierHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#3b82f6',
    color: '#ffffff',
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '2 solid #333',
    paddingBottom: 5,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottom: '0.5 solid #e5e7eb',
  },
  colArticle: {
    width: '55%',
    fontSize: 10,
  },
  colQuantity: {
    width: '20%',
    fontSize: 10,
    textAlign: 'center',
  },
  colPrice: {
    width: '25%',
    fontSize: 10,
    textAlign: 'right',
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 11,
  },
  total: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: '2 solid #333',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
});

interface SimplifiedPickPDFProps {
  groupedOrders: GroupedOrders[];
  selectedDate: string;
  singleSupplier?: boolean;
}

export function SimplifiedPickPDF({ groupedOrders, selectedDate, singleSupplier = false }: SimplifiedPickPDFProps) {
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
          const totalEK = group.items.reduce((sum, item) => sum + (item.ekPrice * item.quantity), 0);
          const totalQuantity = group.items.reduce((sum, item) => sum + item.quantity, 0);

          return (
            <View key={group.supplierId} style={styles.supplierSection}>
              <Text style={styles.supplierHeader}>
                {group.supplierName} - {group.items.length} items
              </Text>

              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.colArticle, styles.headerText]}>Article Name</Text>
                  <Text style={[styles.colQuantity, styles.headerText]}>Quantity</Text>
                  <Text style={[styles.colPrice, styles.headerText]}>EK Price</Text>
                </View>

                {group.items.map((item, index) => (
                  <View key={`${item.product.artikelNr}-${index}`} style={styles.tableRow}>
                    <Text style={styles.colArticle}>{item.product.name}</Text>
                    <Text style={styles.colQuantity}>{item.quantity.toFixed(2)}</Text>
                    <Text style={styles.colPrice}>{formatPrice(item.ekPrice)}</Text>
                  </View>
                ))}

                <View style={styles.total}>
                  <Text style={styles.totalText}>Total: {totalQuantity.toFixed(2)} items</Text>
                  <Text style={styles.totalText}>{formatPrice(totalEK)}</Text>
                </View>
              </View>
            </View>
          );
        })}

        <Text style={styles.footer}>
          Generated on {formatDateForDisplay(new Date().toISOString())}
        </Text>
      </Page>
    </Document>
  );
}
