import React from 'react';
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { formatDateForDisplay } from '../../utils/dateFormatting';
import { formatPrice } from '../../utils/priceCalculations';
import type { GroupedOrders } from '../../pages/dashboard/hooks/useTodaysPick';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingBottom: 120, // Added padding to move content up
  },
  header: {
    marginTop: 40, // Reduced from default to move content up
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  date: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  supplierSection: {
    marginBottom: 20,
    break: 'inside',
  },
  supplierName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#f3f4f6',
    padding: 8,
    marginBottom: 15,
  },
  hamburgerSupplierName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    backgroundColor: '#f3f4f6',
    padding: 8,
    marginBottom: 15,
  },
  table: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 5,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    minHeight: 30,
    alignItems: 'center',
  },
  cell: {
    fontSize: 10,
  },
  hamburgerCell: {
    fontSize: 9,
  },
  numberCol: { width: '8%', textAlign: 'center' },
  articleCol: { width: '15%', textAlign: 'center' },
  productCol: { width: '32%' },
  quantityCol: { width: '20%', textAlign: 'center' },
  priceCol: { width: '12%', textAlign: 'right' },
  totalCol: { width: '13%', textAlign: 'right' },
  quantityBox: {
    backgroundColor: '#F3F4F6',
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
  totals: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#F3F4F6',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  totalValue: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#666',
  },
});

interface TodaysPickPDFProps {
  groupedOrders: GroupedOrders[];
  selectedDate: string;
  singleSupplier?: boolean;
}

export function TodaysPickPDF({ groupedOrders, selectedDate, singleSupplier = false }: TodaysPickPDFProps) {
  const title = singleSupplier 
    ? `Picking List - ${groupedOrders[0].supplierName}`
    : 'Picking List - All Suppliers';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.date}>
            Date: {formatDateForDisplay(selectedDate)}
          </Text>
        </View>

        {groupedOrders.map((group) => {
          const isHamburger = group.supplierName.toLowerCase().includes('hamburger');
          const totals = {
            totalQuantity: group.items.reduce((sum, item) => sum + item.quantity, 0),
            totalEK: group.items.reduce((sum, item) => sum + (item.ekPrice * item.quantity), 0),
          };

          return (
            <View key={group.supplierId} style={styles.supplierSection}>
              <Text style={isHamburger ? styles.hamburgerSupplierName : styles.supplierName}>
                {group.supplierName} ({group.items.length} items)
              </Text>

              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.cell, styles.numberCol]}>Nr.</Text>
                  <Text style={[styles.cell, styles.articleCol]}>Artikel</Text>
                  <Text style={[styles.cell, styles.productCol]}>Bezeichnung</Text>
                  <Text style={[styles.cell, styles.quantityCol]}>Menge</Text>
                </View>

                {group.items.map((item, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[isHamburger ? styles.hamburgerCell : styles.cell, styles.numberCol]}>
                      {index + 1}
                    </Text>
                    <Text style={[isHamburger ? styles.hamburgerCell : styles.cell, styles.articleCol]}>
                      {item.product.artikelNr}
                    </Text>
                    <Text style={[isHamburger ? styles.hamburgerCell : styles.cell, styles.productCol]}>
                      {item.product.name}
                    </Text>
                    <View style={styles.quantityCol}>
                      <View style={styles.quantityBox}>
                        <Text style={styles.quantityText}>
                          {item.quantity.toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.totals}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Items:</Text>
                  <Text style={styles.totalValue}>{totals.totalQuantity.toFixed(2)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Value:</Text>
                  <Text style={styles.totalValue}>{formatPrice(totals.totalEK)}</Text>
                </View>
              </View>
            </View>
          );
        })}

        <Text 
          style={styles.pageNumber} 
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} 
          fixed 
        />
      </Page>
    </Document>
  );
}