import { supabase } from '../../lib/supabase';

// "Learned" Scan Bill matches: invoice text -> our artikelNr, per supplier.
//
// Source of truth is Supabase (table `bill_aliases`) so the learning syncs across
// all of the user's devices. localStorage is a fast, offline cache/fallback — and
// also keeps the feature working if the DB table hasn't been created yet (the calls
// degrade gracefully to cache-only).

const keyFor = (supplierId: string) => `der-stern-bill-aliases-${supplierId}`;

export function normalizeInvoiceText(text: string): string {
  return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function readCache(supplierId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(keyFor(supplierId));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(supplierId: string, aliases: Record<string, string>): void {
  try {
    localStorage.setItem(keyFor(supplierId), JSON.stringify(aliases));
  } catch {
    /* localStorage unavailable — best effort */
  }
}

export async function getAliases(supplierId: string): Promise<Record<string, string>> {
  if (!supplierId) return {};
  try {
    const { data, error } = await supabase
      .from('bill_aliases')
      .select('invoice_text, artikel_nr')
      .eq('supplier_id', supplierId);
    if (error) throw error;

    const map: Record<string, string> = {};
    for (const row of data ?? []) map[row.invoice_text] = row.artikel_nr;
    writeCache(supplierId, map); // refresh the offline cache
    return map;
  } catch {
    // DB unreachable or table not created yet → use the local cache.
    return readCache(supplierId);
  }
}

export async function saveAlias(
  supplierId: string,
  invoiceText: string,
  artikelNr: string
): Promise<void> {
  const norm = normalizeInvoiceText(invoiceText);
  if (!supplierId || !norm || !artikelNr) return;

  // Update the local cache immediately (instant + offline).
  const cache = readCache(supplierId);
  cache[norm] = artikelNr;
  writeCache(supplierId, cache);

  // Sync to Supabase so other devices learn it too (best effort).
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('bill_aliases').upsert(
      {
        supplier_id: supplierId,
        invoice_text: norm,
        artikel_nr: artikelNr,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,supplier_id,invoice_text' }
    );
  } catch {
    /* table missing / offline — the local cache still has it */
  }
}
