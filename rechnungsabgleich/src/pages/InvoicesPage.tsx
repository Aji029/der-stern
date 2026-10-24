import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Camera, CheckCircle2, Clock, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { supabase, extractInvoice } from '../lib/supabase';
import { euro, date, dateTime } from '../lib/format';
import type { Invoice, InvoiceStatus, Supplier } from '../types';

const STATUS: Record<InvoiceStatus, { label: string; className: string; icon: typeof Clock }> = {
  uploaded:     { label: 'Hochgeladen',   className: 'bg-gray-100 text-gray-700',      icon: Clock },
  extracting:   { label: 'Wird gelesen',  className: 'bg-blue-50 text-blue-700',       icon: Loader2 },
  needs_rescan: { label: 'Neu scannen',   className: 'bg-amber-50 text-amber-800',     icon: AlertTriangle },
  verified:     { label: 'Zur Prüfung',   className: 'bg-brand-100 text-brand-800',    icon: CheckCircle2 },
  applied:      { label: 'Übernommen',    className: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  failed:       { label: 'Fehler',        className: 'bg-red-50 text-red-700',         icon: XCircle },
};

/** Pages the verifier flagged, read back out of the stored report. */
function rescanPages(invoice: Invoice): number[] {
  const report = invoice.verify_report?.report;
  if (!report) return [];
  return [...new Set(report.failed_lines.map(l => l.page_no))].sort((a, b) => a - b);
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const { label, className, icon: Icon } = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${className}`}>
      <Icon className={`w-3 h-3 ${status === 'extracting' ? 'animate-spin' : ''}`} />
      {label}
    </span>
  );
}

export default function InvoicesPage() {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    const { data, error: loadError } = await supabase
      .from('supplier_invoices')
      .select('*, suppliers ( id, name, layout_key )')
      .order('created_at', { ascending: false })
      .limit(50);
    if (loadError) setError(loadError.message);
    else setInvoices((data ?? []) as Invoice[]);
  }, []);

  useEffect(() => {
    supabase
      .from('suppliers')
      .select('id, name, layout_key')
      .order('name')
      .then(({ data }) => {
        const rows = (data ?? []) as Supplier[];
        setSuppliers(rows);
        setSupplierId(current => current || rows[0]?.id || '');
      });
    loadInvoices();
  }, [loadInvoices]);

  /** Upload the page photos, create the invoice, then read it. */
  const onFiles = async (files: FileList | null) => {
    if (!files?.length || !supplierId) return;
    setError(null);
    setNotice(null);
    setBusy('Lade Seiten hoch …');

    try {
      // Pages are ordered by the order they were picked — page 1 first.
      const pages = Array.from(files);
      const folder = `${supplierId}/${crypto.randomUUID()}`;
      const paths: string[] = [];

      for (let i = 0; i < pages.length; i++) {
        const file = pages[i];
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${folder}/page-${i + 1}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from('supplier_invoices')
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        paths.push(path);
      }

      const { data: invoice, error: insertError } = await supabase
        .from('supplier_invoices')
        .insert({ supplier_id: supplierId, page_paths: paths })
        .select('id')
        .single();
      if (insertError) throw insertError;

      setBusy('Rechnung wird zweimal gelesen und nachgerechnet …');
      await loadInvoices();

      const result = await extractInvoice(invoice.id);

      if (result.ok) {
        navigate(`/invoices/${invoice.id}`);
        return;
      }

      setError(
        result.needs_rescan
          ? `${result.messages?.[0] ?? 'Die Rechnung stimmt nicht mit ihren gedruckten Summen überein.'} ` +
            `Bitte ${
              result.pages?.length ? `Seite ${result.pages.join(', ')}` : 'die Rechnung'
            } neu fotografieren.`
          : result.error ?? 'Die Rechnung konnte nicht gelesen werden.'
      );
      await loadInvoices();
    } catch (err) {
      setError((err as Error).message ?? 'Upload fehlgeschlagen');
    } finally {
      setBusy(null);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const retry = async (invoiceId: string) => {
    setError(null);
    setNotice(null);
    setBusy('Rechnung wird erneut gelesen …');
    try {
      const result = await extractInvoice(invoiceId);
      if (result.ok) navigate(`/invoices/${invoiceId}`);
      else setError(result.messages?.[0] ?? result.error ?? 'Erneut fehlgeschlagen.');
    } finally {
      setBusy(null);
      await loadInvoices();
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <h2 className="font-semibold text-gray-900 mb-1">Rechnung fotografieren</h2>
        <p className="text-sm text-gray-500 mb-4">
          Alle Seiten in der richtigen Reihenfolge auswählen. Vorher durch CamScanner schicken —
          der Entzerrer und der Kontrast machen echte Arbeit, gerade bei der Knickfalte in der Mitte.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={supplierId}
            onChange={e => setSupplierId(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 sm:w-64"
          >
            {suppliers.map(supplier => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>

          <input
            ref={fileInput}
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            multiple
            onChange={e => onFiles(e.target.files)}
            className="hidden"
          />
          <button
            onClick={() => fileInput.current?.click()}
            disabled={!supplierId || busy !== null}
            className="inline-flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 font-medium"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {busy ?? 'Seiten auswählen'}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
        {notice && <p className="mt-4 text-sm text-gray-600">{notice}</p>}
      </section>

      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Rechnungen</h2>
          <button onClick={loadInvoices} className="p-2 rounded-lg hover:bg-gray-100" title="Aktualisieren">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {invoices.length === 0 ? (
          <p className="px-4 sm:px-6 py-8 text-sm text-gray-500 text-center">
            Noch keine Rechnungen.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {invoices.map(invoice => (
              <li key={invoice.id} className="px-4 sm:px-6 py-3 flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900 truncate">
                      {invoice.invoice_no ?? 'Ohne Nummer'}
                    </span>
                    <StatusBadge status={invoice.status} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {invoice.suppliers?.name ?? '—'} · {date(invoice.invoice_date) } · hochgeladen {dateTime(invoice.created_at)}
                    {invoice.status === 'needs_rescan' && rescanPages(invoice).length > 0 && (
                      <> · Seite {rescanPages(invoice).join(', ')} neu scannen</>
                    )}
                  </p>
                </div>

                <span className="tabular text-sm text-gray-700 hidden sm:block">
                  {euro(invoice.printed_warenwert)} €
                </span>

                {invoice.status === 'verified' || invoice.status === 'applied' ? (
                  <Link
                    to={`/invoices/${invoice.id}`}
                    className="text-sm font-medium text-brand-700 hover:text-brand-800 px-3 py-1.5"
                  >
                    Prüfen
                  </Link>
                ) : (
                  <button
                    onClick={() => retry(invoice.id)}
                    disabled={busy !== null || invoice.status === 'extracting'}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-40 px-3 py-1.5"
                  >
                    Erneut lesen
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
