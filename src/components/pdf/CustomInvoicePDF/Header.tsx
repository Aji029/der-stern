import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { formatDateForDisplay } from '../../../utils/dateFormatting';
import type { Order } from '../../../types/order';

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
    paddingLeft: '1cm',
  },
  addressSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 60,
  },
  senderAddress: {
    width: '45%',
    marginLeft: '-0.8cm',
  },
  recipientAddress: {
    width: '45%',
    marginLeft: '9.5cm',
  },
  companyName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  text: {
    fontSize: 10,
    lineHeight: 1.4,
    flexWrap: 'wrap',
  },
  datum: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginTop: 6,
  },
  invoiceSection: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 12,
  },
  invoiceNumber: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  deliveryDate: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    textAlign: 'center',
    marginBottom: 4,
  },
});

interface HeaderProps {
  order: Order;
  invoiceNumber: string | null;
}

export function Header({ order, invoiceNumber }: HeaderProps) {
  const customer = order.customer;

  return (
    <View style={styles.container}>
      <View style={styles.addressSection}>
        {/* Sender Details - Fetched directly from customers table */}
        <View style={styles.senderAddress}>
          <Text style={styles.companyName}>{customer.companyName}</Text>
          <Text style={styles.text}>{customer.contactPerson}</Text>
          {customer.address && <Text style={styles.text}>{customer.address}</Text>}
          {customer.idNumber && <Text style={styles.text}>{customer.idNumber}</Text>}

          {/* Added Datum Below Sender's Details */}
          <Text style={styles.datum}>
            Datum: {formatDateForDisplay(order.orderDate)}
          </Text>
        </View>

        {/* Recipient Details */}
        <View style={styles.recipientAddress}>
          <Text style={styles.companyName}>Der Stern</Text>
          <Text style={styles.text}>Sabrina Kretschmar</Text>
          <Text style={styles.text}>Stubnitzstraße 28</Text>
          <Text style={styles.text}>13189 Berlin</Text>
          <Text style={styles.text}>Steuer-Nr.: 35/398/01172</Text>
        </View>
      </View>

      {/* Invoice and Delivery Date Section */}
      <View style={styles.invoiceSection}>
        <Text style={styles.invoiceNumber}>
          Rechnung Nr.: {invoiceNumber || `${order.id}`}
        </Text>
        <Text style={styles.deliveryDate}>
          Lieferdatum: {formatDateForDisplay(order.deliveryDate || order.orderDate)}
        </Text>
      </View>
    </View>
  );
}