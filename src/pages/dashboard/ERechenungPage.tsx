import React, { useState, useEffect, useMemo } from 'react';
import { pdf } from '@react-pdf/renderer';
import {
  FileDown, Loader2, Receipt, CheckCircle2, Search, Calendar,
  Building2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ERechenungPDF } from '../../components/pdf/ERechenungPDF';
import { generateZugferdXml } from '../../utils/zugferd/generateXml';
import { embedZugferdXml } from '../../utils/zugferd/embedXml';
import type { Order } from '../../types/order';

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type RangeKey = '7T' | '30T' | '90T' | 'Alles';

const RANGE_OPTIONS: { label: string; key: RangeKey; days: number | null }[] = [
  { label: 'Letzte 7 Tage',   key: '7T',    days: 7 },
  { label: 'Letzte 30 Tage',  key: '30T',   days: 30 },
  { label: 'Letzte 90 Tage',  key: '90T',   days: 90 },
  { label: 'Alle Bestellungen', key: 'Alles', days: null },
];

const STATUS_STYLE: Record<string, string> = {
  Pending:    'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  Completed:  'bg-green-100 text-green-800',
};

const PAYMENT_STYLE: Record<string, string> = {
  Pending: 'bg-orange-100 text-orange-700',
  Paid:    'bg-green-100 text-green-700',
  Overdue: 'bg-red-100 text-red-700',
};

// ---------------------------------------------------------------------------
// Data transform (mirrors OrderContext.transformOrder)
// ---------------------------------------------------------------------------

function transformOrder(order: any): Order {
  return {
    id: order.id,
    customer: {
      id: order.customer?.id || '',
      companyName: order.customer?.company_name || '',
      contactPerson: order.customer?.contact_person || '',
      email: order.customer?.email || '',
      idNumber: order.customer?.id_number || '',
      address: order.customer?.address || '',
      billingAddress: order.customer?.billing_address || '',
    },
    items: (order.items || []).map((item: any) => ({
      id: item.id,
      quantity: parseFloat(item.quantity),
      ekPrice: parseFloat(item.ek_price),
      vkPrice: parseFloat(item.vk_price),
      total: parseFloat((item.quantity * item.vk_price).toFixed(2)),
      isPacked: item.is_packed || false,
      packedAt: item.packed_at ? new Date(item.packed_at) : undefined,
      packedBy: item.packed_by || undefined,
      product: {
        artikelNr: item.product?.artikel_nr || '',
        name: item.product?.name || '',
        mwst: item.mwst || item.product?.mwst,
        supplierId: item.supplier_id || item.product?.supplier_id,
      },
    })),
    status: order.status,
    totalAmount: parseFloat(order.total_amount),
    finalAmount: parseFloat(order.final_amount || order.total_amount),
    orderDate: new Date(order.order_date),
    deliveryDate: order.delivery_date ? new Date(order.delivery_date) : undefined,
    paymentStatus: order.payment_status,
    shippingAddress: order.shipping_address,
    notes: order.notes,
    discount: order.discount,
    created_at: order.created_at ? new Date(order.created_at) : undefined,
    updated_at: order.updated_at ? new Date(order.updated_at) : undefined,
  };
}

const ORDER_SELECT = `
  *,
  customer:customers(*),
  items:order_items(
    *,
    product:products(artikel_nr, name, mwst, supplier_id)
  )
`;

// ---------------------------------------------------------------------------
// Price helpers
// ---------------------------------------------------------------------------

function calcBrutto(order: Order): number {
  const nettoA = order.items
    .filter(i => i.product.mwst === 'A')
    .reduce((s, i) => s + i.quantity * i.vkPrice, 0);
  const nettoB = order.items
    .filter(i => i.product.mwst === 'B')
    .reduce((s, i) => s + i.quantity * i.vkPrice, 0);
  return nettoA * 1.07 + nettoB * 1.19;
}

function formatEur(n: number): string {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('de-DE', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Download hook
// ---------------------------------------------------------------------------

function useDownload() {
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());

  const download = async (order: Order) => {
    if (generating.has(order.id)) return;
    setGenerating(prev => new Set(prev).add(order.id));
    try {
      const pdfBlob = await pdf(<ERechenungPDF order={order} invoiceNumber={order.id} />).toBlob();
      const xml = generateZugferdXml(order, order.id);
      const zugferdBlob = await embedZugferdXml(pdfBlob, xml);
      const url = URL.createObjectURL(zugferdBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Rechnung-${order.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(prev => new Set(prev).add(order.id));
    } catch (err) {
      console.error('E-Rechnung Fehler:', err);
    } finally {
      setGenerating(prev => {
        const next = new Set(prev);
        next.delete(order.id);
        return next;
      });
    }
  };

  return { download, generating, done };
}

// ---------------------------------------------------------------------------
// Download button
// ---------------------------------------------------------------------------

function DownloadBtn({
  order, download, generating, done,
}: {
  order: Order;
  download: (o: Order) => void;
  generating: Set<string>;
  done: Set<string>;
}) {
  const isGen  = generating.has(order.id);
  const isDone = done.has(order.id);

  return (
    <button
      onClick={() => download(order)}
      disabled={isGen}
      title="ZUGFeRD E-Rechnung herunterladen"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all disabled:opacity-60 whitespace-nowrap ${
        isDone
          ? 'bg-green-50 text-green-700 border-green-200'
          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 hover:shadow-sm'
      }`}
    >
      {isGen
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : isDone
        ? <CheckCircle2 className="h-3.5 w-3.5" />
        : <FileDown className="h-3.5 w-3.5" />}
      {isGen ? 'Erstelle…' : isDone ? 'Heruntergeladen' : 'Herunterladen'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Customer group card
// ---------------------------------------------------------------------------

function CustomerGroup({
  name, orders, download, generating, done,
}: {
  name: string;
  orders: Order[];
  download: (o: Order) => void;
  generating: Set<string>;
  done: Set<string>;
}) {
  const [expanded, setExpanded] = useState(true);

  const totalBrutto = orders.reduce((s, o) => s + calcBrutto(o), 0);
  const doneCount = orders.filter(o => done.has(o.id)).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Card header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left border-b border-gray-200"
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">{name}</p>
            <p className="text-xs text-gray-500">
              {orders.length} {orders.length === 1 ? 'Bestellung' : 'Bestellungen'} · {formatEur(totalBrutto)}
              {doneCount > 0 && (
                <span className="ml-2 text-green-600 font-medium">
                  · {doneCount} heruntergeladen
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex-shrink-0 text-gray-400">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Order rows — desktop table */}
      {expanded && (
        <>
          {/* Desktop */}
          <div className="hidden sm:block">
            <table className="min-w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  {['Bestell-Nr.', 'Datum', 'Betrag (Brutto)', 'Status', 'Zahlung', 'E-Rechnung'].map(h => (
                    <th
                      key={h}
                      className={`px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider ${
                        h === 'E-Rechnung' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2.5 text-sm font-mono font-medium text-gray-800">
                      #{order.id}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-gray-900">
                      {formatEur(calcBrutto(order))}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STYLE[order.paymentStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <DownloadBtn
                        order={order}
                        download={download}
                        generating={generating}
                        done={done}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="sm:hidden divide-y divide-gray-100">
            {orders.map(order => (
              <div key={order.id} className="px-4 py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gray-500">#{order.id}</span>
                  <span className="text-xs text-gray-400">{formatDate(order.orderDate)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">{formatEur(calcBrutto(order))}</span>
                  <div className="flex gap-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_STYLE[order.status] ?? ''}`}>
                      {order.status}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${PAYMENT_STYLE[order.paymentStatus] ?? ''}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
                <DownloadBtn
                  order={order}
                  download={download}
                  generating={generating}
                  done={done}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function ERechenungPage() {
  const [range, setRange] = useState<RangeKey>('30T');
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { download, generating, done } = useDownload();

  // Fetch when range changes
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const opt = RANGE_OPTIONS.find(r => r.key === range)!;
        let query = supabase
          .from('orders')
          .select(ORDER_SELECT)
          .not('status', 'eq', 'Cancelled')
          .order('created_at', { ascending: false });

        if (opt.days !== null) {
          const since = new Date();
          since.setDate(since.getDate() - opt.days);
          query = query.gte('created_at', since.toISOString());
        }

        const { data } = await query;
        if (!cancelled) {
          setOrders((data || []).map(transformOrder));
        }
      } catch (err) {
        console.error('E-Rechnung fetch error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [range]);

  // Group by customer name (A–Z), filtered by search
  const grouped = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const order of orders) {
      const key = order.customer.companyName || '(Unbekannter Kunde)';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(order);
    }
    // Sort customers A–Z
    const sorted = [...map.entries()].sort(([a], [b]) =>
      a.localeCompare(b, 'de', { sensitivity: 'base' })
    );
    // Filter by search query
    const q = search.trim().toLowerCase();
    return q
      ? sorted.filter(([name]) => name.toLowerCase().includes(q))
      : sorted;
  }, [orders, search]);

  const totalOrders   = grouped.reduce((s, [, os]) => s + os.length, 0);
  const totalCustomers = grouped.length;

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-50 rounded-lg border border-amber-100">
            <Receipt className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">E-Rechnung</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              ZUGFeRD-konforme Rechnungen · Factur-X 2.3 BASIC
            </p>
          </div>
        </div>

        {/* Stats pills */}
        {!loading && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
              <Building2 className="h-3 w-3" />
              {totalCustomers} Kunden
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
              <Receipt className="h-3 w-3" />
              {totalOrders} Bestellungen
            </span>
          </div>
        )}
      </div>

      {/* ── Info banner ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
        <Receipt className="h-4 w-4 mt-0.5 flex-shrink-0 text-amber-500" />
        <span>
          Jede heruntergeladene Rechnung ist eine <strong>ZUGFeRD 2.3 BASIC</strong> PDF-Datei —
          mit eingebetteter XML-Datei für DATEV, Lexware und andere Buchhaltungssoftware.
        </span>
      </div>

      {/* ── Controls ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Kunden suchen…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition"
          />
        </div>

        {/* Date range tabs */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 self-start sm:self-auto">
          <Calendar className="h-4 w-4 text-gray-400 ml-1 mr-0.5 flex-shrink-0" />
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setRange(opt.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                range === opt.key
                  ? 'bg-white text-amber-700 shadow-sm border border-amber-200'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
              }`}
            >
              {opt.key}
            </button>
          ))}
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
            <p className="text-sm text-gray-400">Bestellungen werden geladen…</p>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && grouped.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Receipt className="h-7 w-7 text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">
            {search
              ? `Kein Kunde gefunden für „${search}"`
              : 'Keine Bestellungen im gewählten Zeitraum'}
          </p>
          {!search && range !== 'Alles' && (
            <button
              onClick={() => setRange('Alles')}
              className="mt-3 text-sm text-amber-600 hover:text-amber-700 underline"
            >
              Alle Zeiträume anzeigen
            </button>
          )}
        </div>
      )}

      {/* ── Customer groups ── */}
      {!loading && grouped.length > 0 && (
        <div className="space-y-3">
          {grouped.map(([customerName, customerOrders]) => (
            <CustomerGroup
              key={customerName}
              name={customerName}
              orders={customerOrders}
              download={download}
              generating={generating}
              done={done}
            />
          ))}
        </div>
      )}

    </div>
  );
}
