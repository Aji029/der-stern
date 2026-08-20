import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables — copy .env.example to .env');
}

/**
 * App tables live in the `rechnungsabgleich` schema so nothing here can collide
 * with der Stern's own tables in `public`. This schema must be listed under
 * Settings -> API -> Exposed schemas, or every query returns 404.
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
 * der Stern's article table. The one place this app reads and writes `public`.
 *
 * NOTE: if your articles live somewhere other than public.products, this constant
 * and the `Article` type in src/types.ts are the only two things to change.
 */
export const ARTICLES_TABLE = 'products';

/** Query der Stern's tables from the same authenticated client. */
export const sternDb = () => supabase.schema('public');

/** Invoke the extraction function with the signed-in user's token. */
export async function extractInvoice(invoiceId: string): Promise<{
  ok: boolean;
  lines?: number;
  warenwert?: number;
  status?: string;
  rescan_pages?: number[];
  summary?: string;
  error?: string;
}> {
  const { data, error } = await supabase.functions.invoke('extract-invoice', {
    body: { invoice_id: invoiceId },
  });

  if (error) {
    // A non-2xx from the function still carries a useful body; surface it.
    const body = await (error as any).context?.json?.().catch(() => null);
    return { ok: false, error: body?.error ?? error.message };
  }
  return data;
}
