import React from 'react';
import { FileText } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '../../../../components/ui/Button';
import { TodaysPickPDF } from '../../../../components/pdf/TodaysPickPDF';
import type { GroupedOrders } from '../../hooks/useTodaysPick';

interface PDFButtonProps {
  groupedOrders: GroupedOrders[];
  selectedDate: string;
  supplierName?: string;
}

export function PDFButton({ groupedOrders, selectedDate, supplierName }: PDFButtonProps) {
  const fileName = supplierName 
    ? `picking-list-${supplierName}-${selectedDate}.pdf`
    : `picking-list-${selectedDate}.pdf`;

  return (
    <PDFDownloadLink
      document={
        <TodaysPickPDF 
          groupedOrders={groupedOrders}
          selectedDate={selectedDate}
          singleSupplier={!!supplierName}
        />
      }
      fileName={fileName}
    >
      {({ loading }) => (
        <button
          disabled={loading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm font-medium disabled:opacity-50"
          title={`Download ${supplierName ? `${supplierName}'s ` : ''}picking list`}
        >
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">{loading ? 'Loading...' : 'PDF'}</span>
        </button>
      )}
    </PDFDownloadLink>
  );
}