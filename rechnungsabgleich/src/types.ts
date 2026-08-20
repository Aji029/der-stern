import type { VerificationReport } from '../shared/verifier';

export type { VerificationReport };

export interface Supplier {
  id: string;
  name: string;
  layout_key: string;
}

export type InvoiceStatus =
  | 'uploaded'
  | 'extracting'
  | 'needs_rescan'
  | 'review'
  | 'applied'
  | 'failed';

export interface Invoice {
  id: string;
  supplier_id: string;
  invoice_no: string | null;
  invoice_date: string | null;
  storage_paths: string[];
  status: InvoiceStatus;
  warenwert_printed: number | null;
  warenwert_computed: number | null;
  rescan_pages: number[];
  verification: VerificationReport | null;
  extraction_error: string | null;
  created_at: string;
  suppliers?: Supplier | null;
}

export interface InvoiceLineRow {
  id: string;
  invoice_id: string;
  page: number;
  bon_nr: string | null;
  pos: number | null;
  supplier_article_nr: string;
  description: string;
  a_kolli: number | null;
  inh_kolli: number | null;
  einheit: string | null;
  menge: number | null;
  preis: number | null;
  betrag: number | null;
  is_pfand: boolean;
  article_id: string | null;
}

/** A row of der Stern's article table, as far as this app is concerned. */
export interface Article {
  artikel_nr: string;
  name: string;
  ek_price: number;
  supplier_id: string | null;
}

/** One line, joined to the article it maps to and the price change it implies. */
export interface ReviewRow {
  line: InvoiceLineRow;
  article: Article | null;
  /** Price this invoice implies, at full printed precision. Null if unmapped. */
  invoicePrice: number | null;
  /** What public.products would actually store, after its 2-decimal rounding. */
  newEkPrice: number | null;
  /** newEkPrice − current ek_price. Null when there is nothing to compare. */
  delta: number | null;
  /** True when a three-decimal supplier price is lost to 2-decimal storage. */
  roundsAway: boolean;
}
