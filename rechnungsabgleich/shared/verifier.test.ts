/**
 * Ground truth: Hamberger Rechnung 26-008-6253214, 18.08.2026.
 * These numbers were reconciled by hand -- Bon subtotals and the
 * Warenwert of 1300,78 all matched. If the verifier ever stops
 * agreeing with them, the verifier is wrong, not the invoice.
 *
 *   npx tsx shared/verifier.test.ts
 */

import {
  round2,
  verifyLines,
  verifyBons,
  verifyInvoice,
  compareExtractions,
  diffPrices,
  type RawLine,
} from './verifier.ts';

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

function line(p: Partial<RawLine> & Pick<RawLine, 'preis' | 'betrag'>): RawLine {
  return {
    page_no: 1,
    line_no: 0,
    description: 'x',
    a_kolli: 1,
    inh_kolli: 1,
    ...p,
  } as RawLine;
}

console.log('\nround2');
check('8.125 rounds up to 8.13', round2(8.125) === 8.13, `got ${round2(8.125)}`);
check('8.015 rounds up to 8.02', round2(8.015) === 8.02, `got ${round2(8.015)}`);
check('3.1773 -> 3.18', round2(3.1773) === 3.18);
check('7.10215 -> 7.10', round2(7.10215) === 7.1);

console.log('\nline arithmetic');
{
  // 13 PAA x 1 PA Ita-San Ramen @ 0,625 = 8,13
  const r = verifyLines([
    line({ a_kolli: 13, inh_kolli: 1, preis: 0.625, betrag: 8.13 }),
  ]);
  check('Ramen 13 x 0,625 = 8,13', r[0].math_ok);
}
{
  // 3 KTK x 6 DS geschaelte Tomaten @ 2,890 = 52,02
  const r = verifyLines([
    line({ a_kolli: 3, inh_kolli: 6, preis: 2.89, betrag: 52.02 }),
  ]);
  check('Karton x inner: 18 x 2,89 = 52,02', r[0].math_ok);
  check('effective menge is 18', r[0].effective_menge === 18);
}
{
  // 1 KTK x 4 PG Passiertuch @ 28,700 = 114,80
  const r = verifyLines([
    line({ a_kolli: 1, inh_kolli: 4, preis: 28.7, betrag: 114.8 }),
  ]);
  check('Passiertuch 4 x 28,70 = 114,80', r[0].math_ok);
}
{
  // weighed: 1 x 2,035 KG Pakchoi @ 3,490 = 7,10
  const r = verifyLines([
    line({ a_kolli: 1, inh_kolli: 2.035, preis: 3.49, betrag: 7.1 }),
  ]);
  check('Pakchoi 2,035 kg x 3,49 = 7,10', r[0].math_ok);
}
{
  // the credit line: 12- SL Physalis @ 0,680 = 8,16-
  const r = verifyLines([
    line({ a_kolli: -12, inh_kolli: 1, preis: 0.68, betrag: -8.16 }),
  ]);
  check('negative credit line verifies', r[0].math_ok);
}
{
  // a deliberately misread digit must be caught
  const r = verifyLines([
    line({ a_kolli: 3, inh_kolli: 1, preis: 24.5, betrag: 63.5 }),
  ]);
  check('wrong betrag is rejected', !r[0].math_ok);
}

console.log('\nBon 43413 (printed 142,46)');
const bon43413: RawLine[] = [
  ['KARTOFFEL UEG MEHLIGKOCHEND', 1, 1, 6.79, 6.79],
  ['KARTOFFEL BACK & GRILL', 1, 1, 2.99, 2.99],
  ['SPINAT-BLATT BEUTEL', 4, 1, 1.95, 7.8],
  ['KAROTTEN SCHALE', 2, 1, 1.05, 2.1],
  ['ANANAS EXTRA SWEET', 1, 1, 2.09, 2.09],
  ['ZWIEBEL ROT 1KG NETZ', 1, 1, 1.02, 1.02],
  ['ZWIEBELSCHOTEN BUND', 10, 1, 0.62, 6.2],
  ['PAKCHOI SHANGHAI', 1, 2.035, 3.49, 7.1],
  ['BLUMENKOHL STUECK', 12, 1, 1.99, 23.88],
  ['FENCHEL', 1, 1.335, 2.38, 3.18],
  ['JOHANNISBEEREN ROT SCHALE', 3, 1, 1.95, 5.85],
  ['KNOBLAUCH 1KG NETZ/STRANG', 1, 1, 4.48, 4.48],
  ['PHYSALIS SCHALE', 12, 1, 0.68, 8.16],
  ['KNOBLAUCH FRISCH', 1, 0.505, 6.49, 3.28],
  ['PEPERONI BRATPEPERONI GRUEN', 10, 1, 1.25, 12.5],
  ['INGWER', 1, 3.5, 2.29, 8.02],
  ['KNOBLAUCH GESCHAELT 1000G', 3, 1, 3.99, 11.97],
  ['BEETE ROT GEGART', 8, 1, 1.28, 10.24],
  ['PHYSALIS SCHALE (Storno)', -12, 1, 0.68, -8.16],
  ['PHYSALIS SCHALE', 10, 1, 0.62, 6.2],
  ['SPINAT 1 KG KISTE', 3, 1, 5.59, 16.77],
].map(([description, a, i, preis, betrag], idx) =>
  line({
    line_no: idx,
    bon: '43413',
    description: description as string,
    a_kolli: a as number,
    inh_kolli: i as number,
    preis: preis as number,
    betrag: betrag as number,
  }),
);

// Pfand sits in the line list but outside the Warenwert
const pfand = line({
  line_no: 99,
  bon: '43413',
  description: 'PFANDKISTEN-POOL GRUEN',
  preis: 3.86,
  betrag: 3.86,
  is_leergut: true,
});

{
  const lines = verifyLines([...bon43413, pfand]);
  check('all 21 goods lines verify', lines.every((l) => l.math_ok));

  const bons = verifyBons(lines, [{ bon: '43413', betrag: 142.46 }]);
  check(
    'Bon 43413 sums to 142,46',
    bons[0].ok,
    `computed ${bons[0].computed}`,
  );
  check('Pfand excluded from the Bon sum', bons[0].computed === 142.46);
}

console.log('\nfull invoice report');
{
  const report = verifyInvoice(
    [...bon43413, pfand],
    [{ bon: '43413', betrag: 142.46 }],
    { warenwert: 142.46, leergut: 3.86 },
  );
  check('report ok', report.ok, report.messages.join(' | '));

  // now corrupt one digit, as a bad photo would
  const corrupted = [...bon43413];
  corrupted[16] = { ...corrupted[16], betrag: 11.07 }; // 11,97 misread
  const bad = verifyInvoice(
    [...corrupted, pfand],
    [{ bon: '43413', betrag: 142.46 }],
    { warenwert: 142.46 },
  );
  check('a single misread digit fails the report', !bad.ok);
  check('the failing line is named', bad.failed_lines.length === 1);
  check('the Bon check also fails', bad.bon_checks.some((b) => !b.ok));
}

console.log('\nmissing totals page');
{
  const report = verifyInvoice(bon43413, [], {});
  check('unverifiable without a Warenwert', !report.ok);
  check(
    'and says so',
    report.messages.some((m) => m.includes('cannot be fully verified')),
  );
}

console.log('\ndouble-extraction consensus');
{
  const a = bon43413.slice(0, 5);
  const b = bon43413.slice(0, 5).map((l, i) =>
    i === 2 ? { ...l, preis: 1.85 } : l, // second pass reads 1,95 as 1,85
  );
  const c = compareExtractions(a, b);
  check('disagreement detected', !c.agree);
  check('conflict names the field', c.conflicts[0].field === 'preis');
  check('identical passes agree', compareExtractions(a, a).agree);
}

console.log('\nprice diff');
{
  const lines = verifyLines([
    line({ supplier_art_nr: '287739', preis: 11.99, betrag: 11.99 }),
    line({ supplier_art_nr: '112000', preis: 1.89, betrag: 1.89 }),
    line({ supplier_art_nr: '999999', preis: 4.5, betrag: 4.5,
           description: 'BRAND NEW ARTICLE' }),
  ]);
  const diff = diffPrices(
    lines,
    [
      { supplier_art_nr: '287739', article_id: 'a1', unit_factor: 12 },
      { supplier_art_nr: '112000', article_id: 'a2', unit_factor: 1 },
    ],
    [
      { article_id: 'a1', name: 'Gurken pro Stueck', ek_price: 1.06 },
      { article_id: 'a2', name: 'Oro di Parma Tomatenmark', ek_price: 1.89 },
    ],
  );
  const gurke = diff.find((d) => d.art_nr === '287739');
  check(
    'unit_factor 12 turns 11,99 Karton into 0,9992 per Stueck',
    gurke?.kind === 'price_change' && gurke.new_price === 0.9992,
    JSON.stringify(gurke),
  );
  check(
    'unchanged price is not flagged',
    diff.find((d) => d.art_nr === '112000')?.kind === 'unchanged',
  );
  check(
    'unknown Art.Nr surfaces for mapping',
    diff.find((d) => d.art_nr === '999999')?.kind === 'unmapped',
  );
}

console.log(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
