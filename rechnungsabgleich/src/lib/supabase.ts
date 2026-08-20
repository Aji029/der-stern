import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables — copy .env.example to .env');
}

/**
 * Rechnungsabgleich's OWN Supabase project — a different database from der
 * Stern's. Everything this app writes (invoices, extracted lines, article
 * mappings, confirmed prices) lives here, so no mistake in this app can reach
 * the live shop.
 *
 * der Stern is read through a separate client; see ./sternDb.
 */
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: { headers: { 'x-application-name': 'rechnungsabgleich' } },
});

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
