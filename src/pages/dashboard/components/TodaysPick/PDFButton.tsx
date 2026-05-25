import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import type { GroupedOrders } from '../../hooks/useTodaysPick';

interface PDFButtonProps {
  groupedOrders: GroupedOrders[];
  selectedDate: string;
  supplierName?: string;
}

export function PDFButton({ groupedOrders, selectedDate, supplierName }: PDFButtonProps) {
  const [loading, setLoading] = useState(false);
  const fileName = supplierName
    ? `picking-list-${supplierName}-${selectedDate}.pdf`
    : `picking-list-${selectedDate}.pdf`;

  // Generate on click only. PDFDownloadLink generates eagerly on mount, which —
  // with one button per supplier — kicked off many heavy @react-pdf renders as
  // soon as the page opened. Loading @react-pdf lazily here also keeps the 1.3MB
  // PDF engine out of the initial Today's Pick bundle.
  const handleDownload = async () => {
    setLoading(true);
    try {
      const [{ pdf }, { TodaysPickPDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../../../../components/pdf/TodaysPickPDF'),
      ]);
      const blob = await pdf(
        <TodaysPickPDF
          groupedOrders={groupedOrders}
          selectedDate={selectedDate}
          singleSupplier={!!supplierName}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium disabled:opacity-50"
      title={`Download ${supplierName ? `${supplierName}'s ` : ''}picking list`}
    >
      <FileText className="h-4 w-4" />
      <span className="hidden sm:inline">{loading ? 'Loading...' : 'PDF'}</span>
    </button>
  );
}
