import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatPrice } from '../../../utils/priceCalculations';

const styles = StyleSheet.create({
  summary: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  label: {
    width: 120,
    textAlign: 'right',
    paddingRight: 20,
    fontSize: 10,
  },
  amount: {
    width: 100,
    textAlign: 'right',
    fontSize: 10,
  },
  total: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  vatDetails: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  vatRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  vatLabel: {
    width: 80,
    textAlign: 'right',
    paddingRight: 10,
    fontSize: 9,
    color: '#666',
  },
  vatAmount: {
    width: 80,
    textAlign: 'right',
    fontSize: 9,
    color: '#666',
  },
  footer: {
    marginTop: 40,
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
});

interface SummaryProps {
  totalNetto: number;
  totalVat: number;
  totalBrutto: number;
  vatBreakdown: {
    vatA: number;
    vatB: number;
    nettoA: number;
    nettoB: number;
  };
}

export function Summary({ totalNetto, totalVat, totalBrutto, vatBreakdown }: SummaryProps) {
  return (
    <View style={styles.summary}>
      <View style={styles.vatDetails}>
        <View style={styles.vatRow}>
          <Text style={styles.vatLabel}>Netto 7% (A):</Text>
          <Text style={styles.vatAmount}>{formatPrice(vatBreakdown.nettoA)}</Text>
        </View>
        <View style={styles.vatRow}>
          <Text style={styles.vatLabel}>MwSt. 7%:</Text>
          <Text style={styles.vatAmount}>{formatPrice(vatBreakdown.vatA)}</Text>
        </View>
        <View style={styles.vatRow}>
          <Text style={styles.vatLabel}>Netto 19% (B):</Text>
          <Text style={styles.vatAmount}>{formatPrice(vatBreakdown.nettoB)}</Text>
        </View>
        <View style={styles.vatRow}>
          <Text style={styles.vatLabel}>MwSt. 19%:</Text>
          <Text style={styles.vatAmount}>{formatPrice(vatBreakdown.vatB)}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Nettobetrag:</Text>
        <Text style={styles.amount}>{formatPrice(totalNetto)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>MwSt. Gesamt:</Text>
        <Text style={styles.amount}>{formatPrice(totalVat)}</Text>
      </View>
      <View style={[styles.row, styles.total]}>
        <Text style={styles.label}>Gesamtbetrag:</Text>
        <Text style={styles.amount}>{formatPrice(totalBrutto)}</Text>
      </View>

      <Text style={styles.footer}>
        Bitte überweisen Sie den Gesamtbetrag innerhalb von 14 Tagen auf das unten angegebene Konto.
        Bei Fragen wenden Sie sich bitte an unseren Kundenservice.
      </Text>
    </View>
  );
}