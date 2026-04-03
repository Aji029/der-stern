import React, { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import { FileDown, Loader2, Receipt, CheckCircle2 } from 'lucide-react';
import { useOrders } from '../../context/OrderContext';
import { CustomInvoicePDF } from '../../components/pdf/CustomInvoicePDF';
import { generateZugferdXml } from '../../utils/zugferd/generateXml';
import { embedZugferdXml } from '../../utils/zugferd/embedXml';
import { formatDateForDisplay } from '../../utils/dateFormatting';
import type { Order } from '../../types/order';

// ---------------------------------------------------------------------------
// Price helpers
// ---------------------------------------------------------------------------

function calcBrutto(order: Order): number {
  const nettoA = order.items.filter(i => i.product.mwst === 'A').reduce((s, i) => s + i.quantity * i.vkPrice, 0);
  const nettoB = order.items.filter(i => i.product.mwst === 'B').reduce((s, i) => s + i.quantity * i.vkPrice, 0);
  return nettoA * 1.07 + nettoB * 1.19;
}

function formatEur(n: number): string {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_STYLE: Record<string, string> = {
  Pending:    'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  Completed:  'bg-green-100 text-green-800',
  Cancelled:  'bg-gray-100 text-gray-500',
};

const PAYMENT_STYLE: Record<string, string> = {
  Pending: 'bg-orange-100 text-orange-700',
  Paid:    'bg-green-100 text-green-700',
  Overdue: 'bg-red-100 text-red-700',
};

// ---------------------------------------------------------------------------
// E-Rechnung download hook (per row)
// ---------------------------------------------------------------------------

function useERechenungDownload() {
  const [generating, setGenerating] = useState<Set<string>>(new Set());
  const [done, setDone] = useState<Set<string>>(new Set());

  const download = async (order: Order) => {
    if (generating.has(order.id)) return;
    setGenerating(prev => new Set(prev).add(order.id));

    try {
      // 1. Generate PDF blob via react-pdf
      const pdfBlob = await pdf(
        <CustomInvoicePDF order={order} invoiceNumber={order.id} />
      ).toBlob();

      // 2. Generate ZUGFeRD XML
      const xml = generateZugferdXml(order, order.id);

      // 3. Embed XML into PDF → ZUGFeRD blob
      const zugferdBlob = await embedZugferdXml(pdfBlob, xml);

      // 4. Trigger download
      const url = URL.createObjectURL(zugferdBlob);
      const a   = document.createElement('a');
      a.href     = url;
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
// Main page
// ---------------------------------------------------------------------------

export function ERechenungPage() {
  const { orders } = useOrders();
  const { download, generating, done } = useERechenungDownload();

  const active = orders.filter(o => o.status !== 'Cancelled');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-50 rounded-lg">
            <Receipt className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">E-Rechnung</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              ZUGFeRD-konforme Rechnungen herunterladen (Factur-X 2.3 BASIC)
            </p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 flex items-start gap-2">
        <Receipt className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
        <span>
          Jede heruntergeladene Rechnung ist eine <strong>ZUGFeRD 2.3 BASIC</strong> PDF-Datei —
          sie sieht aus wie eine normale Rechnung und enthält zusätzlich eine maschinenlesbare XML-Datei,
          die Buchhaltungssoftware (DATEV, Lexware usw.) automatisch einlesen kann.
        </span>
      </div>

      {/* ── Desktop table ── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden hidden sm:block">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bestell-Nr.</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kunde</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Betrag (Brutto)</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zahlung</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">E-Rechnung</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {active.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-sm text-gray-400">
                  Keine aktiven Bestellungen vorhanden.
                </td>
              </tr>
            )}
            {active.map(order => {
              const isGen  = generating.has(order.id);
              const isDone = done.has(order.id);
              return (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">#{order.id}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{order.customer.companyName}</p>
                    <p className="text-xs text-gray-400">{order.customer.contactPerson}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDateForDisplay(order.orderDate)}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {formatEur(calcBrutto(order))}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[order.status] ?? ''}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STYLE[order.paymentStatus] ?? ''}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => download(order)}
                      disabled={isGen}
                      title="ZUGFeRD E-Rechnung herunterladen"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors disabled:opacity-50 ${
                        isDone
                          ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                          : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                      }`}
                    >
                      {isGen
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : isDone
                        ? <CheckCircle2 className="h-3.5 w-3.5" />
                        : <FileDown className="h-3.5 w-3.5" />
                      }
                      {isGen ? 'Erstelle…' : isDone ? 'Heruntergeladen' : 'Herunterladen'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list ── */}
      <div className="sm:hidden space-y-3">
        {active.length === 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-sm text-gray-400">
            Keine aktiven Bestellungen vorhanden.
          </div>
        )}
        {active.map(order => {
          const isGen  = generating.has(order.id);
          const isDone = done.has(order.id);
          return (
            <div key={order.id} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">#{order.id}</p>
                  <p className="text-sm font-medium text-gray-800">{order.customer.companyName}</p>
                  <p className="text-xs text-gray-400">{formatDateForDisplay(order.orderDate)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{formatEur(calcBrutto(order))}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[order.status] ?? ''}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => download(order)}
                disabled={isGen}
                className={`w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                  isDone
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'
                }`}
              >
                {isGen
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : isDone
                  ? <CheckCircle2 className="h-4 w-4" />
                  : <FileDown className="h-4 w-4" />
                }
                {isGen ? 'E-Rechnung wird erstellt…' : isDone ? 'Heruntergeladen' : 'E-Rechnung herunterladen'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
