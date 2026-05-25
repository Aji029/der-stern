// Local-host test for the "Today's Pick EK price reverts on refresh" bug.
//
// It runs the SAME data-layer calls the app makes (updatePriceDirectly) against
// your LIVE Supabase, so we can see exactly what persists — without a browser.
//
// Setup: create a .env file next to package.json with:
//   VITE_SUPABASE_URL=...
//   VITE_SUPABASE_ANON_KEY=...        (this is the public key shipped in your site JS)
//   TEST_EMAIL=...                    (a test/login account)
//   TEST_PASSWORD=...
//   # optional: TEST_ARTIKEL_NR=...   (force a specific product; else one is auto-picked)
//
// Run:
//   node scripts/diagnose-ek-price.mjs           # read-only diagnosis (no writes)
//   node scripts/diagnose-ek-price.mjs --write   # write-test (auto-restores original value)

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

// --- minimal .env loader (no extra dependency) ---
try {
  const env = readFileSync(new URL('../.env', import.meta.url), 'utf8');
  for (const raw of env.split('\n')) {
    const m = raw.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env file; rely on real env */ }

const URL_ = process.env.VITE_SUPABASE_URL;
const KEY = process.env.VITE_SUPABASE_ANON_KEY;
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;
const ARTIKEL = process.env.TEST_ARTIKEL_NR;
const DO_WRITE = process.argv.includes('--write');

const need = (name, val) => {
  if (!val) { console.error(`Missing ${name} — set it in .env`); process.exit(1); }
};
need('VITE_SUPABASE_URL', URL_);
need('VITE_SUPABASE_ANON_KEY', KEY);
need('TEST_EMAIL', EMAIL);
need('TEST_PASSWORD', PASSWORD);

const supabase = createClient(URL_, KEY, { auth: { persistSession: false } });
const log = (s = '') => console.log(s);

async function snapshot(artikel, label) {
  const { data: prod } = await supabase
    .from('products').select('artikel_nr, ek_price, user_id').eq('artikel_nr', artikel).maybeSingle();
  const { data: items } = await supabase
    .from('order_items')
    .select('id, ek_price, user_id, order:orders!inner(status)')
    .eq('product_id', artikel)
    .in('order.status', ['Pending', 'Processing']);
  log(`-- ${label} --`);
  log(`  products.ek_price = ${prod?.ek_price}   products.user_id = ${prod?.user_id}`);
  log(`  order_items (${items?.length ?? 0}): ` +
    JSON.stringify((items ?? []).map(i => ({ ek: i.ek_price, user: i.user_id, status: i.order?.status }))));
  return { prod, items };
}

async function main() {
  log('== 1. Sign in ==');
  const { data: auth, error: authErr } =
    await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
  if (authErr) { console.error('LOGIN FAILED:', authErr.message); process.exit(1); }
  const uid = auth.user.id;
  log(`  logged in as ${auth.user.email}  (auth.uid = ${uid})\n`);

  log('== 2. Choose target product (on a Pending/Processing order) ==');
  let artikel = ARTIKEL;
  if (!artikel) {
    const { data: items, error } = await supabase
      .from('order_items')
      .select('product_id, order:orders!inner(status)')
      .in('order.status', ['Pending', 'Processing'])
      .limit(1);
    if (error) { console.error('  cannot read order_items:', error.message); process.exit(1); }
    if (!items?.length) { console.error('  no items on Pending/Processing orders found'); process.exit(1); }
    artikel = items[0].product_id;
  }
  log(`  artikel_nr = ${artikel}\n`);

  log('== 3. BEFORE ==');
  const before = await snapshot(artikel, 'before');
  const originalEk = before.prod?.ek_price;
  log('');

  if (!DO_WRITE) {
    log('Read-only mode. Re-run with --write to perform the update test (it restores the original value).');
    return;
  }

  const testEk = Number((Number(originalEk || 0) + 0.01).toFixed(2));
  log(`== 4. WRITE (same as updatePriceDirectly): products.ek_price ${originalEk} -> ${testEk} ==`);
  const { data: upd, error: updErr } = await supabase
    .from('products')
    .update({ ek_price: testEk, user_id: uid })
    .eq('artikel_nr', artikel)
    .select('artikel_nr, ek_price, user_id');
  log(`  update error: ${updErr?.message ?? 'none'}`);
  log(`  rows returned by update: ${upd?.length ?? 0}  ${JSON.stringify(upd ?? [])}\n`);

  await new Promise(r => setTimeout(r, 400)); // let any trigger settle

  log('== 5. AFTER ==');
  await snapshot(artikel, 'after');
  log('');

  log('== 6. Restore original price ==');
  const { error: restErr } = await supabase
    .from('products').update({ ek_price: originalEk }).eq('artikel_nr', artikel);
  log(`  restore error: ${restErr?.message ?? 'none'}\n`);

  log('== READ-OFF ==');
  log('  rows returned = 0          -> products write blocked (RLS / user_id mismatch)');
  log('  products changed, items NO -> products->order_items cascade trigger is missing/broken');
  log('  both changed               -> persistence works for THIS user (bug is a different session/user)');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
