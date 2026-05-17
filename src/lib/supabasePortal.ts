import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Separate client with its own storage key so portal and admin sessions
// can coexist in the same browser without overwriting each other.
export const supabasePortal = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storageKey: 'portal-auth-token',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: { 'x-application-name': 'der-stern-portal' },
  },
  db: { schema: 'public' },
});
