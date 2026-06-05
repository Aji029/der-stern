import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { Button } from './ui/Button';
import type { Order } from '../types/order';

interface InvoiceButtonProps {
  order: Order;
  className?: string;
}

// On-click PDF generation. PDFDownloadLink rendered eagerly per row and started
// generating its PDF on mount — many rows × many PDFs = frozen JS thread.
export function InvoiceButton({ order, className = '' }: InvoiceButtonProps) {
  const [loading, setLoading] = useState(false);
  const handleClick = async () => {
    setLoading(true);
    try {
      const [{ pdf }, { OrderPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./pdf/OrderPDF'),
      ]);
      const blob = await pdf(<OrderPDF order={order} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Invoice PDF failed', e);
      alert('Failed to generate invoice. Please try again.');
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
      title="Generate Invoice"
      onClick={handleClick}
    >
      <FileText className="h-4 w-4" />
    </Button>
  );
}
