import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Package, Users, ShoppingCart, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SearchResult {
  type: 'product' | 'customer' | 'order';
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const TYPE_LABELS: Record<string, string> = {
  product: 'Products',
  customer: 'Customers',
  order: 'Orders',
};

const TYPE_ORDER = ['order', 'customer', 'product'];

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 280);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const isNumeric = /^\d+$/.test(q);

    const productQuery = supabase
      .from('products')
      .select('id, name, artikel_nr')
      .or(`name.ilike.%${q}%,artikel_nr.ilike.%${q}%`)
      .limit(4);

    const customerQuery = supabase
      .from('customers')
      .select('id, company_name, contact_person')
      .or(`company_name.ilike.%${q}%,contact_person.ilike.%${q}%`)
      .limit(4);

    // Search orders by ID if numeric, or by customer name
    const orderQuery = isNumeric
      ? supabase.from('orders').select('id, total_amount, customer:customers(company_name)').eq('id', parseInt(q)).limit(4)
      : supabase.from('orders').select('id, total_amount, customer:customers!inner(company_name)').ilike('customers.company_name', `%${q}%`).limit(4);

    Promise.all([productQuery, customerQuery, orderQuery]).then(
      ([products, customers, orders]) => {
        const all: SearchResult[] = [];

        (products.data || []).forEach(p =>
          all.push({
            type: 'product',
            id: String(p.id),
            title: p.name,
            subtitle: `Art. Nr: ${p.artikel_nr}`,
            href: '/dashboard/products',
          })
        );

        (customers.data || []).forEach(c =>
          all.push({
            type: 'customer',
            id: String(c.id),
            title: c.company_name,
            subtitle: c.contact_person || '',
            href: '/dashboard/customers',
          })
        );

        (orders.data || []).forEach(o =>
          all.push({
            type: 'order',
            id: String(o.id),
            title: `Order #${o.id}`,
            subtitle: `${(o.customer as any)?.company_name || ''} · €${parseFloat(String(o.total_amount || 0)).toFixed(2)}`,
            href: '/dashboard/orders',
          })
        );

        setResults(all);
        setLoading(false);
      }
    );
  }, [debouncedQuery]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.href);
    setQuery('');
    setResults([]);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  const icons: Record<string, React.ReactNode> = {
    product: <Package className="w-4 h-4 text-blue-500" />,
    customer: <Users className="w-4 h-4 text-green-500" />,
    order: <ShoppingCart className="w-4 h-4 text-yellow-500" />,
  };

  // Group results by type in fixed order
  const grouped = TYPE_ORDER.reduce((acc, type) => {
    const items = results.filter(r => r.type === type);
    if (items.length) acc[type] = items;
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const showDropdown = open && query.length >= 2;

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div className="flex items-center bg-gray-100 hover:bg-gray-200 transition-colors rounded-lg px-3 h-9 w-56 gap-2">
        <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search…"
          className="bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none w-full"
        />
        {query ? (
          <button onClick={handleClear} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X className="w-3 h-3" />
          </button>
        ) : (
          <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">⌘K</span>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full mt-2 left-0 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {loading ? (
            <div className="p-4 text-sm text-gray-400 text-center">Searching…</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              No results for <span className="font-medium">"{debouncedQuery}"</span>
            </div>
          ) : (
            <div className="py-2 max-h-96 overflow-y-auto">
              {Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <p className="px-3 pt-2 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {TYPE_LABELS[type]}
                  </p>
                  {items.map(r => (
                    <button
                      key={`${r.type}-${r.id}`}
                      onClick={() => handleSelect(r)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-amber-50 text-left transition-colors"
                    >
                      <div className="flex-shrink-0 w-7 h-7 bg-gray-100 rounded-md flex items-center justify-center">
                        {icons[r.type]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{r.title}</p>
                        {r.subtitle && (
                          <p className="text-xs text-gray-400 truncate">{r.subtitle}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ))}
              <p className="px-3 py-2 text-xs text-gray-300 border-t border-gray-100 mt-1">
                Press ↵ to navigate · Esc to close
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
