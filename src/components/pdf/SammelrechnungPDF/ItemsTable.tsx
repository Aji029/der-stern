import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatDateForDisplay } from '../../../utils/dateFormatting';
import { formatPrice } from '../../../utils/priceCalculations';
import { generateDeliveryNoteNumber } from '../../../utils/invoiceNumberGenerator';

const styles = StyleSheet.create({
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    padding: 8,
  },
  headerText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: '#374151',
  },
  cellText: {
    fontSize: 10,
  },
  orderSection: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    backgroundColor: '#f9fafb',
    padding: 8,
  },
  orderInfo: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
  },
  itemDetails: {
    marginLeft: 16,
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 4,
    fontSize: 9,
  },
  col1: { width: '40%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '15%', textAlign: 'right' },
  col4: { width: '15%', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right' },
  orderSummary: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  summaryText: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginRight: 16,
  },
  vatInfo: {
    fontSize: 8,
    color: '#666',
    marginLeft: 8,
  },
});

interface ItemsTableProps {
  orders: Array<{
    id: string;
    orderDate: Date;
    totalAmount: number;
    items: Array<{
      product: {
        name: string;
        mwst: 'A' | 'B';
      };
      quantity: number;
      vkPrice: number;
      total: number;
    }>;
  }>;
}

export function ItemsTable({ orders }: ItemsTableProps) {
  return (
    <View style={styles.table}>
      {orders.map((order, orderIndex) => {
        // Calculate order VAT totals
        const vatTotals = order.items.reduce((acc, item) => {
          const total = item.quantity * item.vkPrice;
          if (item.product.mwst === 'A') {
            acc.vatA += total - (total / 1.07);
            acc.nettoA += total / 1.07;
          } else {
            acc.vatB += total - (total / 1.19);
            acc.nettoB += total / 1.19;
          }
          return acc;
        }, { vatA: 0, vatB: 0, nettoA: 0, nettoB: 0 });

        return (
          <View key={orderIndex} style={styles.orderSection}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderInfo}>
                Order #{order.id}
              </Text>
              <Text style={styles.orderInfo}>
                {formatDateForDisplay(order.orderDate)}
              </Text>
            </View>

            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.col1]}>Product</Text>
              <Text style={[styles.headerText, styles.col2]}>MwSt</Text>
              <Text style={[styles.headerText, styles.col3]}>Quantity</Text>
              <Text style={[styles.headerText, styles.col4]}>Price</Text>
              <Text style={[styles.headerText, styles.col5]}>Total</Text>
            </View>

            {order.items.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.tableRow}>
                <Text style={[styles.cellText, styles.col1]}>
                  {item.product.name}
                </Text>
                <Text style={[styles.cellText, styles.col2]}>
                  {item.product.mwst}
                </Text>
                <Text style={[styles.cellText, styles.col3]}>
                  {item.quantity.toFixed(2)}
                </Text>
                <Text style={[styles.cellText, styles.col4]}>
                  {formatPrice(item.vkPrice)}
                </Text>
                <Text style={[styles.cellText, styles.col5]}>
                  {formatPrice(item.total || item.quantity * item.vkPrice)}
                </Text>
              </View>
            ))}

            <View style={styles.orderSummary}>
              <View>
                <Text style={styles.summaryText}>
                  Netto: {formatPrice(vatTotals.nettoA + vatTotals.nettoB)}
                </Text>
                <Text style={styles.vatInfo}>
                  MwSt. 7%: {formatPrice(vatTotals.vatA)} | MwSt. 19%: {formatPrice(vatTotals.vatB)}
                </Text>
                <Text style={styles.summaryText}>
                  Total: {formatPrice(order.totalAmount)}
                </Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}