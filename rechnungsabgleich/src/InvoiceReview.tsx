/**
 * InvoiceReview.tsx
 *
 * The only screen you touch each morning. Shows what changed, nothing else.
 *
 * This app is READ-ONLY against der Stern. It reads public.products to match
 * articles and never writes to it — no price update, no cascade into open
 * orders, nothing that can disturb the live shop.
 *
 * Approving a price records it here instead. The newest approval per article
 * becomes the baseline the next invoice is compared against, so an accepted
 * price stops resurfacing on every future invoice.
 *
 * Adapted from the standalone reference for der Stern:
 *   - articles come from public.products, keyed by artikel_nr (there is no uuid id)
 *   - only the mapped articles are loaded, not the whole table
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Check, Link2, RefreshCw } from 'lucide-react';
import { supabase } from './lib/supabase';
import { sternDb, ARTICLES_TABLE, ARTICLES_KEY } from './lib/sternDb';
import {
  diffPrices,
  type DiffRow,
  type LineResult,
  type Mapping,
  type StoredArticle,
} from '../shared/verifier';
import { euro, price, quantity } from './lib/format';
import { loadTodaysPick, type PickItem } from './lib/todaysPick';
import ArticlePicker from './components/ArticlePicker';
import type { Article, Invoice, StoredVerifyReport } from './types';

export default function InvoiceReview() {
  const { invoiceId = '' } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [lines, setLines] = useState<LineResult[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [articles, setArticles] = useState<StoredArticle[]>([]);
  // article_ids whose baseline is a previous approval here rather than der Stern
  const [fromApproval, setFromApproval] = useState<Set<string>>(new Set());
  // What der Stern expected from this supplier on this invoice's day
  const [ordered, setOrdered] = useState<PickItem[] | null>(null);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linking, setLinking] = useState<{ artNr: string; description: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: inv, error: invErr } = await supabase
      .from('supplier_invoices')
      .select('*, suppliers ( id, name, layout_key, stern_supplier_id )')
      .eq('id', invoiceId)
      .single();

    if (invErr || !inv) {
      setError('Rechnung nicht gefunden.');
      setLoading(false);
      return;
    }
    setInvoice(inv as Invoice);

    const { data: ls } = await supabase
      .from('invoice_lines')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('page_no')
      .order('line_no');
    setLines((ls ?? []) as unknown as LineResult[]);

    const { data: ms } = await supabase
      .from('article_mappings')
      .select('supplier_art_nr, article_id, unit_factor')
      .eq('supplier_id', inv.supplier_id);
    const mappingRows = (ms ?? []) as Mapping[];
    setMappings(mappingRows);

    // Only the articles this supplier's mappings point at — der Stern's product
    // table is far too big to pull whole just to diff a few dozen prices.
    const ids = [...new Set(mappingRows.map(m => m.article_id))];
    if (ids.length > 0) {
      // der Stern's stored price — read only, never written back.
      const { data: as_ } = await sternDb()
        .from(ARTICLES_TABLE)
        .select('artikel_nr, name, ek_price')
        .in(ARTICLES_KEY, ids);

      // Prices already approved here. The newest per article wins and becomes
      // the baseline, so an accepted change does not reappear next invoice.
      const { data: approvals } = await supabase
        .from('price_change_log')
        .select('article_id, new_price, applied_at')
        .in('article_id', ids)
        .order('applied_at', { ascending: false });

      const approved = new Map<string, number>();
      for (const a of (approvals ?? []) as { article_id: string; new_price: number }[]) {
        if (!approved.has(a.article_id)) approved.set(a.article_id, Number(a.new_price));
      }
      setFromApproval(new Set(approved.keys()));

      setArticles(
        (as_ ?? []).map((a: { artikel_nr: string; name: string; ek_price: number }) => ({
          article_id: a.artikel_nr,
          name: a.name,
          ek_price: approved.get(a.artikel_nr) ?? Number(a.ek_price),
        })),
      );
    } else {
      setArticles([]);
      setFromApproval(new Set());
    }

    // What der Stern expected from this supplier that day. Only possible once
    // the supplier has been matched to its der Stern counterpart.
    const sternId = inv.suppliers?.stern_supplier_id;
    if (sternId) {
      const day = (inv.invoice_date ?? inv.created_at ?? '').slice(0, 10);
      try {
        const groups = await loadTodaysPick(day);
        setOrdered(groups.find(g => g.stern_supplier_id === sternId)?.items ?? []);
      } catch {
        setOrdered(null); // a failed read must not block the price review
      }
    } else {
      setOrdered(null);
    }

    setLoading(false);
  }, [invoiceId]);

  useEffect(() => {
    void load();
  }, [load]);

  const diff = useMemo(
    () => diffPrices(lines, mappings, articles),
    [lines, mappings, articles],
  );

  const changes = useMemo(
    () => diff.filter((d): d is Extract<DiffRow, { kind: 'price_change' }> => d.kind === 'price_change'),
    [diff],
  );
  const unmapped = useMemo(
    () => diff.filter((d): d is Extract<DiffRow, { kind: 'unmapped' }> => d.kind === 'unmapped'),
    [diff],
  );
  const unchanged = diff.filter(d => d.kind === 'unchanged');

  /**
   * Ordered vs delivered.
   *
   * Invoice quantities are in the supplier's units; unit_factor converts them
   * into der Stern's units, the same conversion diffPrices uses for the price.
   */
  const deliveryCheck = useMemo(() => {
    if (ordered === null) return null;

    const byArt = new Map(mappings.map(m => [m.supplier_art_nr, m]));
    const delivered = new Map<string, number>();

    for (const l of lines) {
      if (l.is_leergut) continue;
      const m = l.supplier_art_nr ? byArt.get(l.supplier_art_nr) : undefined;
      if (!m) continue;
      const menge = (l.effective_menge ?? 0) * Number(m.unit_factor || 1);
      delivered.set(m.article_id, (delivered.get(m.article_id) ?? 0) + menge);
    }

    const missing: Array<PickItem & { delivered: number }> = [];
    const short: Array<PickItem & { delivered: number }> = [];

    for (const item of ordered) {
      const got = delivered.get(item.artikel_nr) ?? 0;
      if (got === 0) missing.push({ ...item, delivered: 0 });
      else if (Math.abs(got - item.quantity) > 0.001) short.push({ ...item, delivered: got });
    }

    const orderedIds = new Set(ordered.map(i => i.artikel_nr));
    const unexpected = [...delivered.keys()].filter(id => !orderedIds.has(id));

    return { missing, short, unexpected };
  }, [ordered, mappings, lines]);

  /**
   * Record the accepted prices. Nothing is written to der Stern — this only
   * writes to this app's own tables, at full four-decimal precision.
   */
  async function applyAccepted() {
    setSaving(true);
    setError(null);
    const rows = changes.filter(c => accepted.has(c.art_nr));
    const userId = (await supabase.auth.getUser()).data.user?.id ?? null;

    const { error: logErr } = await supabase.from('price_change_log').insert(
      rows.map(r => ({
        invoice_id: invoiceId,
        article_id: r.article_id,
        old_price: r.old_price,
        new_price: r.new_price,
        applied_by: userId,
      })),
    );

    if (logErr) {
      setError(logErr.message);
      setSaving(false);
      return;
    }

    await supabase
      .from('supplier_invoices')
      .update({ status: 'applied' })
      .eq('id', invoiceId);

    setSaving(false);
    navigate('/');
  }

  async function linkArticle(article: Article, unitFactor: number) {
    if (!linking || !invoice) return;
    await supabase.from('article_mappings').insert({
      supplier_id: invoice.supplier_id,
      supplier_art_nr: linking.artNr,
      article_id: article.artikel_nr,
      unit_factor: unitFactor,
    });
    setLinking(null);
    await load();
  }

  if (loading) return <p className="text-sm text-gray-500">Rechnung wird geladen…</p>;

  if (error && !invoice) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  /* ---- a photo that did not reconcile never shows numbers ---- */
  if (invoice?.status === 'needs_rescan') {
    const stored = invoice.verify_report as StoredVerifyReport | null;
    const messages = stored?.report?.messages ?? [];
    const conflicts = stored?.consensus?.conflicts ?? [];

    return (
      <div className="max-w-2xl space-y-4">
        <BackLink />
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-gray-900">Foto muss neu aufgenommen werden</h2>
            <p className="text-sm text-gray-600 mt-1">
              Die Zahlen dieser Rechnung ergeben nicht ihre eigenen gedruckten Summen — also
              wurde eine Ziffer falsch gelesen. Die markierten Seiten neu fotografieren und
              die Erkennung erneut starten.
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
            {messages.map((m, i) => <li key={i}>{m}</li>)}
          </ul>
        )}

        {conflicts.length > 0 && (
          <div className="text-sm text-gray-700">
            <p className="font-medium">Die beiden Durchgänge widersprechen sich:</p>
            <ul className="list-disc pl-5 mt-1 space-y-1">
              {conflicts.slice(0, 10).map((c, i) => (
                <li key={i}>
                  Seite {c.page_no}, Zeile {c.line_no}, Feld <code>{c.field}</code>:{' '}
                  {String(c.a)} ≠ {String(c.b)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => void load()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
        >
          <RefreshCw className="w-4 h-4" />
          Erneut prüfen
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <BackLink />

      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-gray-900">
          {invoice?.suppliers?.name ?? 'Rechnung'}
          {invoice?.invoice_no ? ` · ${invoice.invoice_no}` : ''}
        </h2>
        <p className="text-sm text-gray-600">
          {changes.length} {changes.length === 1 ? 'Preisänderung' : 'Preisänderungen'} ·{' '}
          {unmapped.length} {unmapped.length === 1 ? 'neuer Artikel' : 'neue Artikel'} ·{' '}
          {unchanged.length} unverändert
        </p>
        {invoice?.printed_warenwert != null && (
          <p className="text-xs text-gray-500">
            Warenwert laut Rechnung {euro(invoice.printed_warenwert)} € — von der Prüfung bestätigt.
          </p>
        )}
      </header>

      {error && <p className="text-sm text-red-700">{error}</p>}

      {/* ---- price changes ---- */}
      {changes.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Preisänderungen
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-gray-400">
                <th className="w-6" />
                <th className="text-left font-medium py-1">Artikel</th>
                <th className="text-right font-medium py-1">Bisher</th>
                <th className="text-right font-medium py-1 pl-3">Neu</th>
                <th className="text-right font-medium py-1 pl-3">Δ</th>
              </tr>
            </thead>
            <tbody>
              {changes.map(c => (
                  <tr key={c.art_nr} className="border-b border-gray-100 last:border-0">
                    <td className="py-2 pr-2 align-top">
                      <input
                        type="checkbox"
                        checked={accepted.has(c.art_nr)}
                        onChange={e => {
                          const next = new Set(accepted);
                          if (e.target.checked) next.add(c.art_nr);
                          else next.delete(c.art_nr);
                          setAccepted(next);
                        }}
                      />
                    </td>
                    <td className="py-2">
                      <div className="text-gray-900">{c.name}</div>
                      <div className="text-xs text-gray-500">Art. {c.art_nr}</div>
                      {fromApproval.has(c.article_id) && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          Vergleich mit dem zuletzt hier bestätigten Preis
                        </div>
                      )}
                    </td>
                    <td className="py-2 text-right tabular text-gray-500">{price(c.old_price)}</td>
                    <td className="py-2 pl-3 text-right tabular font-medium text-gray-900">
                      {price(c.new_price)}
                    </td>
                    <td
                      className={
                        'py-2 pl-3 text-right tabular text-xs ' +
                        (c.delta > 0 ? 'text-red-600' : 'text-green-700')
                      }
                    >
                      {c.delta > 0 ? '+' : ''}
                      {price(c.delta)}
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
          <div className="flex gap-3 pt-1">
            <button
              className="text-xs text-gray-600 underline"
              onClick={() => setAccepted(new Set(changes.map(c => c.art_nr)))}
            >
              Alle auswählen
            </button>
            <button className="text-xs text-gray-600 underline" onClick={() => setAccepted(new Set())}>
              Auswahl aufheben
            </button>
          </div>
        </section>
      )}

      {/* ---- unmapped: the one-time question per article ---- */}
      {unmapped.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Noch keinem Artikel zugeordnet
          </h3>
          <p className="text-xs text-gray-600">
            Einmal zuordnen. Ab dann wird die Artikel-Nr dauerhaft erkannt.
          </p>
          {unmapped.map(u => (
            <div
              key={u.art_nr}
              className="rounded-lg border border-gray-200 p-3 flex flex-wrap items-center gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="text-sm text-gray-900 truncate">{u.description}</div>
                <div className="text-xs text-gray-500">
                  Art. {u.art_nr} · {price(u.preis)} € laut Rechnung
                </div>
              </div>
              <button
                onClick={() => setLinking({ artNr: u.art_nr, description: u.description })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                <Link2 className="w-4 h-4" />
                Zuordnen
              </button>
            </div>
          ))}
        </section>
      )}

      {/* ---- ordered vs delivered, against der Stern's own order list ---- */}
      {deliveryCheck && (deliveryCheck.missing.length > 0 || deliveryCheck.short.length > 0 || deliveryCheck.unexpected.length > 0) && (
        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Bestellt gegen geliefert
          </h3>

          {deliveryCheck.missing.length > 0 && (
            <div className="text-sm">
              <p className="text-gray-700 mb-1">Bestellt, aber nicht auf dieser Rechnung:</p>
              <ul className="list-disc pl-5 text-gray-700">
                {deliveryCheck.missing.map(i => (
                  <li key={i.artikel_nr}>
                    {i.name} — {quantity(i.quantity)}× erwartet
                  </li>
                ))}
              </ul>
            </div>
          )}

          {deliveryCheck.short.length > 0 && (
            <div className="text-sm">
              <p className="text-gray-700 mb-1">Menge weicht ab:</p>
              <ul className="list-disc pl-5 text-gray-700">
                {deliveryCheck.short.map(i => (
                  <li key={i.artikel_nr}>
                    {i.name} — {quantity(i.quantity)}× bestellt, {quantity(i.delivered)}× geliefert
                  </li>
                ))}
              </ul>
            </div>
          )}

          {deliveryCheck.unexpected.length > 0 && (
            <div className="text-sm">
              <p className="text-gray-700 mb-1">Geliefert, aber heute nicht bestellt:</p>
              <ul className="list-disc pl-5 text-gray-700">
                {deliveryCheck.unexpected.map(id => (
                  <li key={id}>{articles.find(a => a.article_id === id)?.name ?? id}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-gray-400">
            Gewogene Ware weicht bauartbedingt ab — das ist eine Bestandsfrage, keine Preisfrage.
          </p>
        </section>
      )}

      {lines.length > 0 && (
        <p className="text-xs text-gray-500">
          {lines.length} Zeilen geprüft · {quantity(lines.filter(l => l.is_leergut).length)} davon Leergut
        </p>
      )}

      <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
        <button
          disabled={accepted.size === 0 || saving}
          onClick={() => void applyAccepted()}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 text-white px-4 py-2 text-sm disabled:opacity-40"
        >
          <Check className="w-4 h-4" />
          {saving
            ? 'Wird bestätigt…'
            : `${accepted.size} ${accepted.size === 1 ? 'Preis' : 'Preise'} bestätigen`}
        </button>
        <span className="text-xs text-gray-500">
          Wird nur hier gespeichert — der Stern wird nicht verändert.
        </span>
      </div>

      {linking && (
        <ArticlePicker
          supplierArticleNr={linking.artNr}
          description={linking.description}
          onPick={linkArticle}
          onClose={() => setLinking(null)}
        />
      )}
    </div>
  );
}

function BackLink() {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate('/')}
      className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
    >
      <ArrowLeft className="w-4 h-4" />
      Alle Rechnungen
    </button>
  );
}
