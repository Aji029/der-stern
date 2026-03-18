import React from 'react';
import { FileText } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '../../ui/Button';
import { TodaysPickPDF } from '../pdf/TodaysPickPDF';
import type { GroupedOrders } from '../../pages/dashboard/hooks/useTodaysPick';

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
        <Button 
          variant="outline" 
          size="sm" 
          disabled={loading}
          title={`Download ${supplierName ? `${supplierName}'s ` : ''}picking list`}
        >
          <FileText className="h-4 w-4" />
        </Button>
      )}
    </PDFDownloadLink>
  );
}