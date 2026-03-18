import React from 'react';
import { FileText } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from './ui/Button';
import { OrderPDF } from './pdf/OrderPDF';
import type { Order } from '../types/order';

interface InvoiceButtonProps {
  order: Order;
  className?: string;
}

export function InvoiceButton({ order, className = "" }: InvoiceButtonProps) {
  return (
    <PDFDownloadLink
      document={<OrderPDF order={order} />}
      fileName={`invoice-${order.id}.pdf`}
    >
      {({ loading }) => (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          className={className}
          title="Generate Invoice"
        >
          <FileText className="h-4 w-4" />
        </Button>
      )}
    </PDFDownloadLink>
  );
}