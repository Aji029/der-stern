import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, ArrowDownRight, ArrowUpRight, Check, CheckCircle2, Link2, Loader2, Minus,
} from 'lucide-react';
import { supabase, sternDb, ARTICLES_TABLE } from './lib/supabase';
import { euro, price, percent, date, quantity } from './lib/format';
import { roundHalfUp } from '../shared/verifier';
import ArticlePicker from './components/ArticlePicker';
import type { Article, Invoice, InvoiceLineRow, ReviewRow } from './types';

/**
 * The review screen. Photograph the invoice, get a list of what changed, approve.
 *
 * Nothing on this screen writes to der Stern's article table until "Übernehmen"
 * is pressed. The model transcribed, the verifier proved the numbers add up, and
 * the mapping decisions are the user's — the same boundary all the way through.
 */

export default function InvoiceReview() {
  const { invoiceId } = useParams<{ invoiceId: string }>();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lines, setLines] = useState<InvoiceLineRow[]>([]);
  const [articles, setArticles] = useState<Map<string, Article>>(new Map());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pickerFor, setPickerFor] = useState<InvoiceLineRow | null>(null);
  const [onlyChanges, setOnlyChanges] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<string | null>(null);

  // --- load ---------------------------------------------------------------

  const load = useCallback(async () => {
    if (!invoiceId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [{ data: invoiceRow, error: invoiceError }, { data: lineRows, error: linesError }] =
        await Promise.all([
          supabase
            .from('invoices')
            .select('*, suppliers ( id, name, layout_key )')
            .eq('id', invoiceId)
            .single(),
          supabase
            .from('invoice_lines')
            .select('*')
            .eq('invoice_id', invoiceId)
            .order('page')
            .order('pos', { nullsFirst: false }),
        ]);

      if (invoiceError) throw invoiceError;
      if (linesError) throw linesError;

      setInvoice(invoiceRow as Invoice);
      setLines((lineRows ?? []) as InvoiceLineRow[]);
      await loadArticles((lineRows ?? []) as InvoiceLineRow[]);
    } catch (err) {
      setError((err as Error).message ?? 'Rechnung konnte nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  const loadArticles = async (rows: InvoiceLineRow[]) => {
    const ids = Array.from(new Set(rows.map(r => r.article_id).filter((id): id is string => !!id)));
    if (ids.length === 0) {
      setArticles(new Map());
      return;
    }

    // Chunked: a big Hamberger invoice can map to a few hundred articles.
    const found = new Map<string, Article>();
    for (let i = 0; i < ids.length; i += 200) {
      const { data } = await sternDb()
        .from(ARTICLES_TABLE)
        .select('artikel_nr, name, ek_price, supplier_id')
        .in('artikel_nr', ids.slice(i, i + 200));
      for (const article of (data ?? []) as Article[]) found.set(article.artikel_nr, article);
    }
    setArticles(found);
  };

  useEffect(() => { load(); }, [load]);

  // --- rows ---------------------------------------------------------------

  const rows: ReviewRow[] = useMemo(
    () =>
      lines.map(line => {
        const article = line.article_id ? articles.get(line.article_id) ?? null : null;
        const invoicePrice = line.preis;

        // public.products stores ek_price as numeric(10,2), so a supplier price of
        // 0,625 lands as 0,63. Small, but systematic on high-volume articles — so
        // it is shown rather than hidden.
        const newEkPrice = invoicePrice === null ? null : roundHalfUp(invoicePrice, 2);
        const delta =
          article && newEkPrice !== null ? roundHalfUp(newEkPrice - Number(article.ek_price), 2) : null;

        return {
          line,
          article,
          invoicePrice,
          newEkPrice,
          delta,
          roundsAway: invoicePrice !== null && newEkPrice !== null && invoicePrice !== newEkPrice,
        };
      }),
    [lines, articles]
  );

  const changedRows = useMemo(
    () => rows.filter(row => !row.line.is_pfand && (row.delta === null || row.delta !== 0)),
    [rows]
  );
  const unmappedRows = useMemo(() => rows.filter(row => !row.line.is_pfand && !row.article), [rows]);
  const visibleRows = onlyChanges ? changedRows : rows;

  // Pre-select every mapped line whose price actually moved. A line still waiting
  // for a mapping decision is never pre-selected.
  useEffect(() => {
    setSelected(
      new Set(
        rows
          .filter(row => row.article && row.delta !== null && row.delta !== 0 && !row.line.is_pfand)
          .map(row => row.line.id)
      )
    );
  }, [rows]);

  const selectedRows = useMemo(
    () => rows.filter(row => selected.has(row.line.id) && row.article && row.newEkPrice !== null),
    [rows, selected]
  );

  // --- mapping ------------------------------------------------------------

  /**
   * Confirming a mapping is its own decision, saved the moment it is made — so
   * the learning survives even if the invoice is never approved. This is the
   * table that makes the morning job disappear.
   */
  const confirmMapping = async (line: InvoiceLineRow, article: Article) => {
    setPickerFor(null);
    setError(null);

    try {
      const { error: mappingError } = await supabase.from('article_mappings').upsert(
        {
          supplier_id: invoice!.supplier_id,
          supplier_article_nr: line.supplier_article_nr,
          article_id: article.artikel_nr,
          last_description: line.description,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'supplier_id,supplier_article_nr' }
      );
      if (mappingError) throw mappingError;

      // Every line on this invoice with the same supplier article number follows.
      const sameArticle = lines.filter(l => l.supplier_article_nr === line.supplier_article_nr);
      const { error: lineError } = await supabase
        .from('invoice_lines')
        .update({ article_id: article.artikel_nr })
        .in('id', sameArticle.map(l => l.id));
      if (lineError) throw lineError;

      setLines(current =>
        current.map(l =>
          l.supplier_article_nr === line.supplier_article_nr
            ? { ...l, article_id: article.artikel_nr }
            : l
        )
      );
      setArticles(current => new Map(current).set(article.artikel_nr, article));
    } catch (err) {
      setError((err as Error).message ?? 'Zuordnung konnte nicht gespeichert werden.');
    }
  };

  // --- apply --------------------------------------------------------------

  const apply = async () => {
    if (selectedRows.length === 0) return;
    setIsApplying(true);
    setError(null);
    setApplied(null);

    try {
      for (const row of selectedRows) {
        const article = row.article!;
        const newEkPrice = row.newEkPrice!;

        const { data: updated, error: updateError } = await sternDb()
          .from(ARTICLES_TABLE)
          .update({ ek_price: newEkPrice })
          .eq('artikel_nr', article.artikel_nr)
          .select('artikel_nr');
        if (updateError) throw updateError;
        if (!updated || updated.length === 0) {
          throw new Error(`Artikel ${article.artikel_nr} konnte nicht aktualisiert werden.`);
        }

        const { error: auditError } = await supabase.from('price_applications').insert({
          invoice_id: invoice!.id,
          line_id: row.line.id,
          article_id: article.artikel_nr,
          supplier_article_nr: row.line.supplier_article_nr,
          old_ek_price: article.ek_price,
          invoice_price: row.invoicePrice,
          new_ek_price: newEkPrice,
        });
        if (auditError) throw auditError;
      }

      await supabase
        .from('invoices')
        .update({ status: 'applied', applied_at: new Date().toISOString() })
        .eq('id', invoice!.id);

      setApplied(`${selectedRows.length} Preis(e) übernommen.`);
      await load();
    } catch (err) {
      setError((err as Error).message ?? 'Übernahme fehlgeschlagen.');
    } finally {
      setIsApplying(false);
    }
  };

  // --- render -------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-20 space-y-3">
        <p className="text-gray-600">{error ?? 'Rechnung nicht gefunden.'}</p>
        <Link to="/" className="text-brand-700 font-medium">Zurück</Link>
      </div>
    );
  }

  const verification = invoice.verification;

  return (
    <div className="space-y-4">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> Alle Rechnungen
      </Link>

      {/* Header: what the paper says, and whether the reading matches it. */}
      <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              {invoice.invoice_no ?? 'Rechnung ohne Nummer'}
            </h1>
            <p className="text-sm text-gray-500">
              {invoice.suppliers?.name} · {date(invoice.invoice_date)} · {lines.length} Positionen
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-500">Warenwert</p>
            <p className="tabular text-xl font-semibold text-gray-900">
              {euro(invoice.warenwert_computed)} €
            </p>
          </div>
        </div>

        {verification?.ok ? (
          <div className="mt-4 flex gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Nachgerechnet: {lines.length} Zeilen ergeben genau die gedruckten{' '}
              {euro(invoice.warenwert_printed)} €. Zwei unabhängige Lesungen, keine Abweichung.
            </span>
          </div>
        ) : (
          <div className="mt-4 flex gap-2 text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{verification?.summary ?? 'Diese Rechnung wurde nicht geprüft.'}</span>
          </div>
        )}

        {unmappedRows.length > 0 && (
          <p className="mt-3 text-sm text-gray-600">
            {unmappedRows.length} Position(en) sind noch keinem Artikel zugeordnet. Einmal zuordnen —
            danach erkennt die App sie bei jeder weiteren Rechnung dieses Lieferanten.
          </p>
        )}
      </section>

      {/* The list of what changed. */}
      <section className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">
            {onlyChanges ? `${changedRows.length} Änderungen` : `${rows.length} Positionen`}
          </h2>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={onlyChanges}
              onChange={e => setOnlyChanges(e.target.checked)}
              className="rounded border-gray-300 text-brand-600 focus:ring-brand-400"
            />
            Nur Änderungen
          </label>
        </div>

        {visibleRows.length === 0 ? (
          <p className="px-4 sm:px-6 py-8 text-sm text-gray-500 text-center">
            Keine Preisänderung gegenüber der Artikelliste.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {visibleRows.map(row => (
              <ReviewLine
                key={row.line.id}
                row={row}
                isSelected={selected.has(row.line.id)}
                onToggle={() =>
                  setSelected(current => {
                    const next = new Set(current);
                    if (next.has(row.line.id)) next.delete(row.line.id);
                    else next.add(row.line.id);
                    return next;
                  })
                }
                onMap={() => setPickerFor(row.line)}
              />
            ))}
          </ul>
        )}
      </section>

      {error && (
        <div className="flex gap-2 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {applied && (
        <div className="flex gap-2 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{applied}</span>
        </div>
      )}

      {/* Apply bar — the only thing on this screen that writes a price. */}
      <div className="sticky bottom-0 bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          {selectedRows.length === 0
            ? 'Nichts ausgewählt.'
            : `${selectedRows.length} Preis(e) werden in die Artikelliste geschrieben.`}
        </p>
        <button
          onClick={apply}
          disabled={selectedRows.length === 0 || isApplying}
          className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg px-5 py-2.5 font-medium"
        >
          {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Übernehmen
        </button>
      </div>

      {pickerFor && (
        <ArticlePicker
          supplierArticleNr={pickerFor.supplier_article_nr}
          description={pickerFor.description}
          onPick={article => confirmMapping(pickerFor, article)}
          onClose={() => setPickerFor(null)}
        />
      )}
    </div>
  );
}

function ReviewLine({
  row,
  isSelected,
  onToggle,
  onMap,
}: {
  row: ReviewRow;
  isSelected: boolean;
  onToggle: () => void;
  onMap: () => void;
}) {
  const { line, article, invoicePrice, newEkPrice, delta, roundsAway } = row;

  // How the line reads on the paper: "3 KTK × 6", "2,035 kg", "12- ST".
  // On weighed goods a leading "1 KG ×" says nothing, so it is left off.
  const showsOuter = line.a_kolli !== null && !(line.menge !== null && line.a_kolli === 1);
  const quantityText = [
    showsOuter ? `${quantity(line.a_kolli)}${line.einheit ? ` ${line.einheit}` : ''}` : null,
    line.inh_kolli !== null && line.inh_kolli !== 1 ? `× ${quantity(line.inh_kolli)}` : null,
    line.menge !== null ? `${showsOuter ? '× ' : ''}${quantity(line.menge)} kg` : null,
  ]
    .filter(Boolean)
    .join(' ');

  const changePercent =
    article && delta !== null && Number(article.ek_price) !== 0
      ? (delta / Number(article.ek_price)) * 100
      : null;

  const DeltaIcon = delta === null || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;
  const deltaClass =
    delta === null || delta === 0
      ? 'text-gray-400'
      : delta > 0
        ? 'text-red-600'   // buying price up — costs money
        : 'text-emerald-600';

  return (
    <li className="px-4 sm:px-6 py-3 flex items-start gap-3">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        disabled={!article || newEkPrice === null || line.is_pfand}
        className="mt-1 rounded border-gray-300 text-brand-600 focus:ring-brand-400 disabled:opacity-30"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="tabular text-xs text-gray-500">{line.supplier_article_nr}</span>
          <span className="font-medium text-gray-900 truncate">{line.description}</span>
          {line.is_pfand && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">Pfand</span>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-0.5">
          {quantityText} × {price(invoicePrice)} € = {euro(line.betrag)} €
          {line.bon_nr && <> · Bon {line.bon_nr}</>}
        </p>

        {article ? (
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            → {article.artikel_nr} {article.name}
          </p>
        ) : (
          <button
            onClick={onMap}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
          >
            <Link2 className="w-3 h-3" /> Artikel zuordnen
          </button>
        )}

        {roundsAway && article && (
          <p className="text-xs text-amber-700 mt-0.5">
            Lieferantenpreis {price(invoicePrice)} € wird als {price(newEkPrice)} € gespeichert
            (Artikelliste rechnet mit zwei Nachkommastellen).
          </p>
        )}
      </div>

      <div className="text-right shrink-0">
        {article ? (
          <>
            <p className="tabular text-sm text-gray-900">
              {price(article.ek_price)} → <span className="font-semibold">{price(newEkPrice)}</span> €
            </p>
            <p className={`tabular text-xs inline-flex items-center gap-0.5 ${deltaClass}`}>
              <DeltaIcon className="w-3 h-3" />
              {delta === null || delta === 0 ? 'unverändert' : `${price(Math.abs(delta))} € · ${percent(changePercent)}`}
            </p>
          </>
        ) : (
          <p className="tabular text-sm text-gray-500">{price(invoicePrice)} €</p>
        )}
      </div>
    </li>
  );
}
