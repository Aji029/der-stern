import { createClient } from '@supabase/supabase-js';
import { readOnlyTable } from './readOnly';

/**
 * der Stern, read-only.
 *
 * A SEPARATE Supabase project from this app's own. Nothing here writes, and
 * nothing here can: this client never holds a session, and every write policy
 * on der Stern's tables requires `auth.role() = 'authenticated'`. An anonymous
 * caller is refused by Postgres itself, not by this code being careful.
 *
 * der Stern's own schema is never modified by this app — no migration, no
 * policy change, no table. It is only ever read.
 */

const sternUrl = import.meta.env.VITE_STERN_SUPABASE_URL;
const sternKey = import.meta.env.VITE_STERN_SUPABASE_ANON_KEY;

if (!sternUrl || !sternKey) {
  throw new Error(
    'Missing der Stern read credentials — set VITE_STERN_SUPABASE_URL and ' +
      'VITE_STERN_SUPABASE_ANON_KEY (see .env.example)',
  );
}

const sternClient = createClient(sternUrl, sternKey, {
  auth: {
    // Stay anonymous. Persisting or restoring a session here would make this
    // client authenticated, and der Stern's RLS lets authenticated users write.
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    // A key of its own, so it can never pick up this app's stored session.
    storageKey: 'stern-readonly-never-persisted',
  },
  global: { headers: { 'x-application-name': 'rechnungsabgleich-readonly' } },
});

/**
 * Read a der Stern table. Only `from` is exposed — no rpc, no storage, no auth
 * — and the builder it returns throws on insert/update/upsert/delete.
 */
export const sternDb = () => ({
  from: (table: string) => readOnlyTable(sternClient.from(table), `sternDb.from('${table}')`),
});

/**
 * der Stern's article table, keyed by artikel_nr (TEXT — there is no uuid id).
 * If the articles ever move, these two constants and the `Article` type in
 * src/types.ts are the only things to change.
 */
export const ARTICLES_TABLE = 'products';
export const ARTICLES_KEY = 'artikel_nr';
