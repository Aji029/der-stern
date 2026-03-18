import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatDateForDisplay } from '../../../utils/dateFormatting';
import { generateSammelrechnungNumber } from '../../../utils/invoiceNumberGenerator';
import type { SammelrechnungWithDetails } from '../../../types/sammelrechnung';

const styles = StyleSheet.create({
  container: {
    marginBottom: 30,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  companyInfo: {
    width: '45%',
  },
  customerInfo: {
    width: '45%',
    textAlign: 'right',
  },
  companyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
  },
  invoiceDetails: {
    marginBottom: 20,
  },
  invoiceNumber: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  date: {
    fontSize: 10,
    textAlign: 'right',
  },
});

interface HeaderProps {
  sammelrechnung: SammelrechnungWithDetails;
}

export function Header({ sammelrechnung }: HeaderProps) {
  const formattedNumber = generateSammelrechnungNumber(sammelrechnung);
  const createdAt = sammelrechnung.createdAt ? new Date(sammelrechnung.createdAt) : new Date();
  
  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <View style={styles.companyInfo}>
          <Text style={styles.companyName}>Der Stern</Text>
          <Text style={styles.text}>Sabrina Kretschmar</Text>
          <Text style={styles.text}>Stubnitzstraße 28</Text>
          <Text style={styles.text}>13189 Berlin</Text>
          <Text style={styles.text}>Steuer-Nr.: 35/398/01172</Text>
        </View>
        <View style={styles.customerInfo}>
          <Text style={styles.companyName}>{sammelrechnung.customer.companyName}</Text>
          <Text style={styles.text}>{sammelrechnung.customer.contactPerson}</Text>
          <Text style={styles.text}>{sammelrechnung.customer.address}</Text>
        </View>
      </View>

      <View style={styles.invoiceDetails}>
        <Text style={styles.invoiceNumber}>
          Sammelrechnung Nr.: {formattedNumber}
        </Text>
        <Text style={styles.date}>
          Datum: {formatDateForDisplay(createdAt)}
        </Text>
      </View>
    </View>
  );
}