import React from 'react';
import { FileText } from 'lucide-react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { Button } from '../ui/Button';
import { SammelrechnungPDF } from '../pdf/SammelrechnungPDF';
import type { SammelrechnungWithDetails } from '../../types/sammelrechnung';

interface SammelrechnungButtonProps {
  sammelrechnung: SammelrechnungWithDetails;
  className?: string;
}

export function SammelrechnungButton({ sammelrechnung, className = "" }: SammelrechnungButtonProps) {
  return (
    <PDFDownloadLink
      document={<SammelrechnungPDF sammelrechnung={sammelrechnung} />}
      fileName={`sammelrechnung-${sammelrechnung.number}.pdf`}
    >
      {({ loading }) => (
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          className={className}
          title="Generate Sammelrechnung"
        >
          <FileText className="h-4 w-4" />
        </Button>
      )}
    </PDFDownloadLink>
  );
}