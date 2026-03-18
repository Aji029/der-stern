import React from 'react';
import { Document, Page, StyleSheet } from '@react-pdf/renderer';
import { Header } from './Header';
import { ItemsTable } from './ItemsTable';
import { Summary } from './Summary';
import type { SammelrechnungWithDetails } from '../../../types/sammelrechnung';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
});

interface SammelrechnungPDFProps {
  sammelrechnung: SammelrechnungWithDetails;
}

export function SammelrechnungPDF({ sammelrechnung }: SammelrechnungPDFProps) {
  // Calculate VAT breakdown
  const vatBreakdown = sammelrechnung.orders.reduce((acc, order) => {
    order.items.forEach(item => {
      const total = item.quantity * item.vkPrice;
      if (item.product.mwst === 'A') {
        acc.nettoA += total / 1.07;
        acc.vatA += total - (total / 1.07);
      } else {
        acc.nettoB += total / 1.19;
        acc.vatB += total - (total / 1.19);
      }
    });
    return acc;
  }, { vatA: 0, vatB: 0, nettoA: 0, nettoB: 0 });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Header sammelrechnung={sammelrechnung} />
        <ItemsTable orders={sammelrechnung.orders} />
        <Summary 
          totalNetto={sammelrechnung.totalNetto}
          totalVat={sammelrechnung.totalVat}
          totalBrutto={sammelrechnung.totalBrutto}
          vatBreakdown={vatBreakdown}
        />
      </Page>
    </Document>
  );
}