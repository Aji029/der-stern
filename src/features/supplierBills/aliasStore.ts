// "Learned" matches for Scan Bill: a per-supplier map of invoice text -> our
// artikelNr, saved in localStorage. Every time the user applies/confirms a match
// we remember it, so future scans of the same supplier recognise their naming.
//
// Stored locally (no DB migration needed). It's per-device; that's fine for a
// single operator. A DB-backed version would be the upgrade if multi-device sync
// is ever needed.

const keyFor = (supplierId: string) => `der-stern-bill-aliases-${supplierId}`;

export function normalizeInvoiceText(text: string): string {
  return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

export function getAliases(supplierId: string): Record<string, string> {
  if (!supplierId) return {};
  try {
    const raw = localStorage.getItem(keyFor(supplierId));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function saveAlias(supplierId: string, invoiceText: string, artikelNr: string): void {
  const norm = normalizeInvoiceText(invoiceText);
  if (!supplierId || !norm || !artikelNr) return;
  try {
    const aliases = getAliases(supplierId);
    aliases[norm] = artikelNr;
    localStorage.setItem(keyFor(supplierId), JSON.stringify(aliases));
  } catch {
    // localStorage unavailable (private mode / quota) — learning is best-effort
  }
}
