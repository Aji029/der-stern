/**
 * The read-only wrapper is what stands between a coding mistake and der Stern's
 * live data, so it is worth a test that does not need a database.
 *
 *   npx tsx src/lib/readOnly.test.ts
 */

import { readOnlyTable, ReadOnlyViolation } from './readOnly.ts';

let passed = 0;
let failed = 0;

function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ok   ${name}`);
  } else {
    failed++;
    console.log(`  FAIL ${name} ${detail}`);
  }
}

function throws(fn: () => unknown): boolean {
  try {
    fn();
    return false;
  } catch (err) {
    return err instanceof ReadOnlyViolation;
  }
}

/** Stands in for a PostgREST query builder, chaining included. */
function fakeBuilder() {
  const calls: string[] = [];
  const builder = {
    calls,
    table: 'products',
    select(cols: string) { calls.push(`select:${cols}`); return builder; },
    eq(col: string, val: string) { calls.push(`eq:${col}=${val}`); return builder; },
    in(col: string, vals: string[]) { calls.push(`in:${col}=${vals.join(',')}`); return builder; },
    or(expr: string) { calls.push(`or:${expr}`); return builder; },
    order(col: string) { calls.push(`order:${col}`); return builder; },
    limit(n: number) { calls.push(`limit:${n}`); return builder; },
    single() { calls.push('single'); return builder; },
    insert(rows: unknown) { calls.push('insert'); return rows; },
    update(patch: unknown) { calls.push('update'); return patch; },
    upsert(rows: unknown) { calls.push('upsert'); return rows; },
    delete() { calls.push('delete'); return builder; },
  };
  return builder;
}

console.log('\nread-only wrapper');

for (const method of ['insert', 'update', 'upsert', 'delete'] as const) {
  const real = fakeBuilder();
  const guarded = readOnlyTable(real, "sternDb.from('products')");
  check(
    `${method}() throws`,
    throws(() => (guarded as unknown as Record<string, () => unknown>)[method]()),
  );
  check(`${method}() never reaches the builder`, real.calls.length === 0);
}

{
  const real = fakeBuilder();
  const guarded = readOnlyTable(real, "sternDb.from('products')");
  guarded.select('artikel_nr, name, ek_price').eq('artikel_nr', '1001').limit(25).single();
  check(
    'reads pass through, chaining intact',
    real.calls.join(' | ') ===
      'select:artikel_nr, name, ek_price | eq:artikel_nr=1001 | limit:25 | single',
    real.calls.join(' | '),
  );
}

{
  const real = fakeBuilder();
  const guarded = readOnlyTable(real, "sternDb.from('orders')");
  guarded.or('artikel_nr.ilike.%bohnen%').order('name').in('artikel_nr', ['1', '2']);
  check('search helpers pass through', real.calls.length === 3, real.calls.join(' | '));
}

{
  const guarded = readOnlyTable(fakeBuilder(), "sternDb.from('products')");
  let blocked = false;
  try {
    (guarded as unknown as Record<string, unknown>).insert = () => 'sneaky';
  } catch {
    blocked = true; // strict mode turns the failed set into a TypeError
  }
  const stillThrows = throws(() =>
    (guarded as unknown as Record<string, () => unknown>).insert(),
  );
  check('write methods cannot be reassigned', blocked || stillThrows);
}

{
  const real = fakeBuilder();
  const guarded = readOnlyTable(real, "sternDb.from('products')");
  check('non-function properties still readable', guarded.table === 'products');
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
