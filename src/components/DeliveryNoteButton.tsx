import React from 'react';
import { Truck } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from './ui/Button';
import { DeliveryNotePDF } from './pdf/DeliveryNotePDF/index';
import type { Order } from '../types/order';

interface DeliveryNoteButtonProps {
  order: Order;
  className?: string;
}

export function DeliveryNoteButton({ order, className = "" }: DeliveryNoteButtonProps) {
  return (
    <PDFDownloadLink
      document={<DeliveryNotePDF order={order} />}
      fileName={`lieferschein-${order.id}.pdf`}
    >
      {({ loading }) => (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          className={className}
          title="Lieferschein"
        >
          <Truck className="h-4 w-4" />
        </Button>
      )}
    </PDFDownloadLink>
  );
}