export interface ExtractedPriceMatch {
  artikelNr: string;
  productName: string;          // name from our catalog
  invoiceDescription: string;   // raw text from invoice
  currentEkPrice: number;
  newEkPrice: number;
  confidence: 'high' | 'medium' | 'low';
  selected: boolean;            // user toggle
}

export interface UnmatchedItem {
  invoiceDescription: string;
  price: number;
}

export interface BillAnalysisResult {
  matches: ExtractedPriceMatch[];
  unmatched: UnmatchedItem[];
}

export type BillScanStep = 'upload' | 'analysing' | 'review' | 'applying' | 'done';
