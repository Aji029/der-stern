import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { sternDb, ARTICLES_TABLE } from '../lib/supabase';
import { price } from '../lib/format';
import type { Article } from '../types';

/**
 * Search der Stern's articles and pick one.
 *
 * The search box is a convenience for finding the article; what gets stored is
 * always its Artikel-Nr. Names are for human eyes only — 225407 stays 225407
 * while its name flips between "Butter Bohnen" and "Monte Castello".
 */
export default function ArticlePicker({
  supplierArticleNr,
  description,
  onPick,
  onClose,
}: {
  supplierArticleNr: string;
  description: string;
  onPick: (article: Article) => void;
  onClose: () => void;
}) {
  // The supplier's own article number is the best first guess: many suppliers
  // print the number der Stern already stores as bestellnummer.
  const [query, setQuery] = useState(supplierArticleNr);
  const [results, setResults] = useState<Article[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const trimmed = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setIsSearching(true);

    const timer = setTimeout(async () => {
      const pattern = `%${trimmed}%`;
      const { data } = await sternDb()
        .from(ARTICLES_TABLE)
        .select('artikel_nr, name, ek_price, supplier_id')
        .or(`artikel_nr.ilike.${pattern},name.ilike.${pattern}`)
        .limit(25);
      if (!cancelled) {
        setResults((data ?? []) as Article[]);
        setIsSearching(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed]);

  return (
    <div className="fixed inset-0 z-20 bg-black/40 flex items-start justify-center p-4 sm:pt-24">
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-gray-200">
          <div className="min-w-0">
            <p className="font-medium text-gray-900">Artikel zuordnen</p>
            <p className="text-sm text-gray-500 truncate">
              {supplierArticleNr} · {description}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Artikel-Nr oder Name"
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>

        <ul className="max-h-80 overflow-y-auto divide-y divide-gray-100">
          {trimmed.length < 2 && (
            <li className="p-4 text-sm text-gray-500">Mindestens zwei Zeichen eingeben.</li>
          )}
          {trimmed.length >= 2 && !isSearching && results.length === 0 && (
            <li className="p-4 text-sm text-gray-500">Kein Artikel gefunden.</li>
          )}
          {results.map(article => (
            <li key={article.artikel_nr}>
              <button
                onClick={() => onPick(article)}
                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
              >
                <span className="tabular text-sm text-gray-500 w-20 shrink-0">{article.artikel_nr}</span>
                <span className="flex-1 text-sm text-gray-900 truncate">{article.name}</span>
                <span className="tabular text-sm text-gray-600">{price(article.ek_price)} €</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
