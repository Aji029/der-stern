import React, { useState } from 'react';
import { Truck } from 'lucide-react';
import { Button } from './ui/Button';
import type { Order } from '../types/order';

interface DeliveryNoteButtonProps {
  order: Order;
  className?: string;
}

// On-click PDF generation; see InvoiceButton for rationale.
export function DeliveryNoteButton({ order, className = '' }: DeliveryNoteButtonProps) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      const [{ pdf }, { DeliveryNotePDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./pdf/DeliveryNotePDF/index'),
      ]);
      const blob = await pdf(<DeliveryNotePDF order={order} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lieferschein-${order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Delivery note PDF failed', e);
      alert('Failed to generate delivery note. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      className={className}
      title="Lieferschein"
      onClick={handleClick}
    >
      <Truck className="h-4 w-4" />
    </Button>
  );
}
