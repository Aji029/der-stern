import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, Camera, Link2, Loader2, RefreshCw } from 'lucide-react';
import { supabase, extractInvoice } from '../lib/supabase';
import { loadTodaysPick, type SupplierPick } from '../lib/todaysPick';
import { euro, quantity } from '../lib/format';
import type { Supplier } from '../types';

/**
 * The morning screen.
 *
 * What der Stern says you are getting today, per supplier, read live. Next to
 * each supplier: the camera. Photograph that supplier's invoice and the app
 * checks it and shows what changed.
 */
export default function TodayPage() {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const pendingSupplier = useRef<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [picks, setPicks] = useState<SupplierPick[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Our own suppliers first: they carry the display names, because der
      // Stern's suppliers table is not readable anonymously.
      const { data: supplierRows } = await supabase
        .from('suppliers')
        .select('id, name, layout_key, stern_supplier_id')
        .order('name');

      const rows = (supplierRows ?? []) as Array<Supplier & { stern_supplier_id: string | null }>;
      setSuppliers(rows);

      const linked = rows.filter(r => r.stern_supplier_id);
      setLinks(Object.fromEntries(linked.map(r => [r.stern_supplier_id as string, r.id])));

      const names = Object.fromEntries(linked.map(r => [r.stern_supplier_id as string, r.name]));
      setPicks(await loadTodaysPick(date, names));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Remember which der Stern supplier this app's supplier corresponds to. */
  async function linkSupplier(sternSupplierId: string, ourSupplierId: string) {
    await supabase
      .from('suppliers')
      .update({ stern_supplier_id: sternSupplierId })
      .eq('id', ourSupplierId);
    setLinks(prev => ({ ...prev, [sternSupplierId]: ourSupplierId }));
  }

  function openCamera(sternSupplierId: string) {
    pendingSupplier.current = links[sternSupplierId] ?? null;
    if (!pendingSupplier.current) return;
    fileInput.current?.click();
  }

  /** Upload the pages, create the invoice, read it, then show what changed. */
  async function onFiles(files: FileList | null) {
    const supplierId = pendingSupplier.current;
    if (!files?.length || !supplierId) return;

    setError(null);
    setBusy('Seiten werden hochgeladen …');

    try {
      const folder = `${supplierId}/${crypto.randomUUID()}`;
      const paths: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const path = `${folder}/page-${i + 1}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from('invoices')
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
      const result = await extractInvoice(invoice.id);

      if (result.ok) {
        navigate(`/invoices/${invoice.id}`);
        return;
      }

      setError(
        result.needs_rescan
          ? `${result.messages?.[0] ?? 'Die Rechnung stimmt nicht mit ihren gedruckten Summen überein.'} ` +
            `Bitte ${result.pages?.length ? `Seite ${result.pages.join(', ')}` : 'die Rechnung'} neu fotografieren.`
          : result.error ?? 'Die Rechnung konnte nicht gelesen werden.',
      );
    } catch (err) {
      setError((err as Error).message ?? 'Upload fehlgeschlagen');
    } finally {
      setBusy(null);
      pendingSupplier.current = null;
      if (fileInput.current) fileInput.current.value = '';
    }
  }

  return (
    <div className="space-y-5">
      <input
        ref={fileInput}
        type="file"
        accept="image/*,application/pdf"
        capture="environment"
        multiple
        onChange={e => void onFiles(e.target.files)}
        className="hidden"
      />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Heute</h1>
          <p className="text-sm text-gray-500">
            Was laut der Stern heute geliefert wird — je Lieferant.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
          />
          <button
            onClick={() => void load()}
            className="p-2 rounded-lg hover:bg-gray-100"
            title="Aktualisieren"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </header>

      {busy && (
        <div className="flex items-center gap-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-xl p-3">
          <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
          {busy}
        </div>
      )}

      {error && (
        <div className="flex gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Wird geladen …</p>
      ) : picks.length === 0 ? (
        <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-xl p-6 text-center">
          Für diesen Tag stehen keine offenen Bestellungen an.
        </p>
      ) : (
        picks.map(pick => {
          const linkedId = links[pick.stern_supplier_id];
          const value = pick.items.reduce((sum, i) => sum + i.quantity * i.ek_price, 0);

          return (
            <section
              key={pick.stern_supplier_id}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 p-4 border-b border-gray-100">
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900 truncate">
                    {linkedId ? pick.supplier_name : 'Noch nicht zugeordneter Lieferant'}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {pick.items.length} {pick.items.length === 1 ? 'Artikel' : 'Artikel'} ·{' '}
                    {quantity(pick.total_quantity)} Stück · {euro(value)} € EK
                  </p>
                </div>

                {linkedId ? (
                  <button
                    onClick={() => openCamera(pick.stern_supplier_id)}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium"
                  >
                    <Camera className="w-4 h-4" />
                    Rechnung fotografieren
                  </button>
                ) : (
                  <LinkSupplier
                    suppliers={suppliers}
                    onLink={id => void linkSupplier(pick.stern_supplier_id, id)}
                  />
                )}
              </div>

              <ul className="divide-y divide-gray-100">
                {pick.items.map(item => (
                  <li key={item.artikel_nr} className="px-4 py-2 flex items-center gap-3 text-sm">
                    <span className="tabular text-gray-500 w-16 shrink-0">{item.artikel_nr}</span>
                    <span className="flex-1 text-gray-900 truncate">{item.name}</span>
                    <span className="tabular text-gray-600">{quantity(item.quantity)}×</span>
                    <span className="tabular text-gray-500 w-16 text-right">{euro(item.ek_price)} €</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      <p className="text-xs text-gray-500">
        <Link to="/invoices" className="underline">Alle Rechnungen ansehen</Link>
      </p>
    </div>
  );
}

/**
 * A der Stern supplier has to be matched to this app's supplier once, because
 * the extraction prompt depends on the invoice layout.
 */
function LinkSupplier({
  suppliers,
  onLink,
}: {
  suppliers: Supplier[];
  onLink: (supplierId: string) => void;
}) {
  const [choice, setChoice] = useState('');

  return (
    <div className="flex items-center gap-2">
      <select
        value={choice}
        onChange={e => setChoice(e.target.value)}
        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
      >
        <option value="">Lieferant zuordnen …</option>
        {suppliers.map(s => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <button
        onClick={() => choice && onLink(choice)}
        disabled={!choice}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
      >
        <Link2 className="w-4 h-4" />
        Merken
      </button>
    </div>
  );
}
