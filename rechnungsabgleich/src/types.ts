import type { VerifyReport, ConsensusResult } from '../shared/verifier';

export type { VerifyReport, ConsensusResult };

export interface Supplier {
  id: string;
  name: string;
  layout_key: string;
}

export type InvoiceStatus =
  | 'uploaded'
  | 'extracting'
  | 'needs_rescan'
  | 'verified'
  | 'applied'
  | 'failed';

/** What the extract function stores in supplier_invoices.verify_report. */
export interface StoredVerifyReport {
  report?: VerifyReport;
  consensus?: ConsensusResult;
}

export interface Invoice {
  id: string;
  supplier_id: string;
  invoice_no: string | null;
  invoice_date: string | null;
  page_paths: string[];
  status: InvoiceStatus;
  printed_warenwert: number | null;
  printed_endbetrag: number | null;
  verify_report: StoredVerifyReport | null;
  created_at: string;
  suppliers?: Supplier | null;
}

/**
 * A row of der Stern's article table.
 *
 * Keyed by artikel_nr — public.products has no uuid id. ek_price is
 * DECIMAL(10,2), which is why three-decimal supplier prices round on the way in.
 */
export interface Article {
  artikel_nr: string;
  name: string;
  ek_price: number;
  supplier_id: string | null;
}
