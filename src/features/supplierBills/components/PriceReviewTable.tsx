import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { formatPrice } from '../../../utils/priceCalculations';
import type { ExtractedPriceMatch, UnmatchedItem } from '../types';

interface PriceReviewTableProps {
  matches: ExtractedPriceMatch[];
  unmatched: UnmatchedItem[];
  onToggleItem: (artikelNr: string) => void;
  onToggleAll: (selected: boolean) => void;
  onChangeNewPrice: (artikelNr: string, price: number) => void;
}

export function PriceReviewTable({
  matches,
  unmatched,
  onToggleItem,
  onToggleAll,
  onChangeNewPrice,
}: PriceReviewTableProps) {
  const [showUnmatched, setShowUnmatched] = useState(false);

  const selectedCount = matches.filter(m => m.selected).length;
  const allSelected = matches.length > 0 && selectedCount === matches.length;
  const someSelected = selectedCount > 0 && selectedCount < matches.length;

  const getDeltaInfo = (match: ExtractedPriceMatch) => {
    const delta = match.newEkPrice - match.currentEkPrice;
    const pct = match.currentEkPrice > 0 ? (delta / match.currentEkPrice) * 100 : 0;
    return { delta, pct };
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Header summary */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm font-medium text-gray-700">
          {matches.length} product{matches.length !== 1 ? 's' : ''} found on invoice
        </p>
        <button
          onClick={() => onToggleAll(!allSelected)}
          className="text-xs font-medium text-brand-600 hover:text-brand-700"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      {/* Table — scrollable on mobile */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm min-w-[520px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="w-8 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={el => { if (el) el.indeterminate = someSelected; }}
                  onChange={e => onToggleAll(e.target.checked)}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-400"
                />
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600 text-xs uppercase tracking-wide">
                Product
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">
                Current EK
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-600 text-xs uppercase tracking-wide whitespace-nowrap">
                New EK
              </th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-600 text-xs uppercase tracking-wide">
                Change
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {matches.map(match => {
              const { delta, pct } = getDeltaInfo(match);
              const isIncrease = delta > 0.001;
              const isDecrease = delta < -0.001;
              const noChange = !isIncrease && !isDecrease;

              return (
                <tr
                  key={match.artikelNr}
                  className={`transition-colors ${
                    !match.selected
                      ? 'opacity-50 bg-white'
                      : isIncrease
                      ? 'bg-red-50'
                      : isDecrease
                      ? 'bg-green-50'
                      : 'bg-white'
                  }`}
                >
                  <td className="px-3 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={match.selected}
                      onChange={() => onToggleItem(match.artikelNr)}
                      className="rounded border-gray-300 text-brand-500 focus:ring-brand-400"
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-start gap-1.5">
                      {match.confidence === 'low' && (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 text-xs leading-tight line-clamp-2">
                          {match.productName}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{match.artikelNr}</p>
                        {match.invoiceDescription !== match.productName && (
                          <p className="text-[10px] text-gray-400 italic truncate max-w-[160px]">
                            "{match.invoiceDescription}"
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right text-gray-500 text-xs font-medium whitespace-nowrap">
                    {formatPrice(match.currentEkPrice)}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={match.newEkPrice}
                      onChange={e => onChangeNewPrice(match.artikelNr, parseFloat(e.target.value) || 0)}
                      className="w-20 text-right text-xs font-semibold text-gray-900 border border-gray-200 rounded px-1.5 py-1 focus:ring-1 focus:ring-brand-400 focus:border-transparent"
                    />
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    {noChange ? (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <Minus className="w-3 h-3" />
                        No change
                      </span>
                    ) : isIncrease ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{formatPrice(delta)} ({pct.toFixed(1)}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600">
                        <TrendingDown className="w-3.5 h-3.5" />
                        {formatPrice(delta)} ({pct.toFixed(1)}%)
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Unmatched items collapsible */}
      {unmatched.length > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setShowUnmatched(!showUnmatched)}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <span>Unmatched items ({unmatched.length}) — not in our catalog</span>
            {showUnmatched
              ? <ChevronDown className="w-4 h-4" />
              : <ChevronRight className="w-4 h-4" />
            }
          </button>
          {showUnmatched && (
            <ul className="divide-y divide-gray-100">
              {unmatched.map((item, i) => (
                <li key={i} className="flex items-center justify-between px-3 py-2 text-xs text-gray-500">
                  <span className="truncate flex-1">{item.invoiceDescription}</span>
                  <span className="ml-3 font-medium text-gray-700 flex-shrink-0">
                    {formatPrice(item.price)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
