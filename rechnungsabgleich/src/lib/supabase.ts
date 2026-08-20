import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables — copy .env.example to .env');
}

/**
 * App tables live in the `rechnungsabgleich` schema. der Stern already owns
 * `public.suppliers`, so sharing `public` would collide. This schema must be
 * listed under Settings -> API -> Exposed schemas, or every query returns 404.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: { schema: 'rechnungsabgleich' },
  global: { headers: { 'x-application-name': 'rechnungsabgleich' } },
});

/**
 * der Stern's article table. The one place this app touches `public` — and it
 * only ever READS. No price update, no cascade into open orders, nothing that
 * can disturb the live shop.
 *
 * Keyed by `artikel_nr` (TEXT). If your articles live somewhere other than
 * public.products, this constant, ARTICLES_KEY and the `Article` type in
 * src/types.ts are the only things to change.
 */
export const ARTICLES_TABLE = 'products';
export const ARTICLES_KEY = 'artikel_nr';

/** Read der Stern's tables from the same authenticated client. Reads only. */
export const sternDb = () => supabase.schema('public');

/** Invoke the extraction function with the signed-in user's token. */
export async function extractInvoice(invoiceId: string): Promise<{
  ok: boolean;
  needs_rescan?: boolean;
  lines?: number;
  warenwert?: number | null;
  pages?: number[];
  messages?: string[];
  error?: string;
}> {
  const { data, error } = await supabase.functions.invoke('extract-invoice', {
    body: { invoice_id: invoiceId },
  });

  if (error) {
    // A non-2xx from the function still carries a useful body; surface it.
    const body = await (error as { context?: { json?: () => Promise<{ error?: string }> } })
      .context?.json?.()
      .catch(() => null);
    return { ok: false, error: body?.error ?? error.message };
  }
  return data;
}
