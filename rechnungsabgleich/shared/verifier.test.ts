/**
 * Verifier tests — run with `npm test` (npx tsx shared/verifier.test.ts).
 *
 * No test framework: this file is meant to be runnable before the app has any
 * dependencies installed beyond tsx, because the verifier has to be trustworthy
 * before a single line is sent to an API.
 *
 * The fixture is Bon 43413 from Rechnung 26-008-6253214 (Hamberger Großmarkt),
 * which reconciles to 142,46. The four lines called out below are the shapes that
 * actually bite in production; the rest of the Bon fills it out to the printed
 * total. Replacing any line with the real scan is a drop-in — the assertions read
 * the totals from the fixture rather than hard-coding them, except for 142,46
 * itself, which is the number printed on the paper.
 */

import {
  roundHalfUp,
  computeLineAmount,
  verifyLine,
  computeWarenwert,
  verifyInvoice,
  comparePasses,
  type InvoiceExtraction,
  type InvoiceLine,
} from './verifier';

// ---------------------------------------------------------------------------
// Fixture: Bon 43413, Rechnung 26-008-6253214
// ---------------------------------------------------------------------------

const BON_43413_LINES: InvoiceLine[] = [
  // 13 x 0,625 = 8,125 -> 8,13. Three-decimal price, rounded half up.
  { page: 1, bon_nr: '43413', pos: 1, supplier_article_nr: '225407',
    description: 'Butter Bohnen 1/1', a_kolli: 13, inh_kolli: null, einheit: 'ST',
    menge: null, preis: 0.625, betrag: 8.13 },

  // 3 KTK x 6 DS x 2,890 = 52,02. Karton times inner count.
  { page: 1, bon_nr: '43413', pos: 2, supplier_article_nr: '118902',
    description: 'Cola 0,33 Dose', a_kolli: 3, inh_kolli: 6, einheit: 'KTK',
    menge: null, preis: 2.890, betrag: 52.02 },

  // 1 x 2,035 kg x 3,490 = 7,10215 -> 7,10. Weighed goods.
  { page: 1, bon_nr: '43413', pos: 3, supplier_article_nr: '340117',
    description: 'Rinderhack frisch', a_kolli: 1, inh_kolli: null, einheit: 'KG',
    menge: 2.035, preis: 3.490, betrag: 7.10 },

  // 12- x 0,680 = 8,16-. Storno / credit line.
  { page: 1, bon_nr: '43413', pos: 4, supplier_article_nr: '771203',
    description: 'Joghurt Natur 500g', a_kolli: -12, inh_kolli: null, einheit: 'ST',
    menge: null, preis: 0.680, betrag: -8.16 },

  { page: 1, bon_nr: '43413', pos: 5, supplier_article_nr: '509614',
    description: 'Speiseoel 10L Kanister', a_kolli: 6, inh_kolli: null, einheit: 'ST',
    menge: null, preis: 4.990, betrag: 29.94 },

  { page: 1, bon_nr: '43413', pos: 6, supplier_article_nr: '662108',
    description: 'Mineralwasser Classic', a_kolli: 2, inh_kolli: 12, einheit: 'KTK',
    menge: null, preis: 1.150, betrag: 27.60 },

  { page: 1, bon_nr: '43413', pos: 7, supplier_article_nr: '340982',
    description: 'Gouda am Stueck', a_kolli: 1, inh_kolli: null, einheit: 'KG',
    menge: 3.745, preis: 5.900, betrag: 22.10 },

  // 5 x 0,745 = 3,725 -> 3,73. Second half-up case, different digit.
  { page: 1, bon_nr: '43413', pos: 8, supplier_article_nr: '883014',
    description: 'Baguette vorgebacken', a_kolli: 5, inh_kolli: null, einheit: 'ST',
    menge: null, preis: 0.745, betrag: 3.73 },

  // Pfand: verified like any other line, but never part of the Warenwert.
  { page: 1, bon_nr: '43413', pos: 9, supplier_article_nr: '900001',
    description: 'Leergut Kasten Pfand', a_kolli: 2, inh_kolli: null, einheit: 'ST',
    menge: null, preis: 1.500, betrag: 3.00, is_pfand: true },
];

const BON_43413: InvoiceExtraction = {
  invoice_no: '26-008-6253214',
  invoice_date: '2026-08-11',
  bon_totals: [{ bon_nr: '43413', subtotal: 142.46 }],
  warenwert: 142.46,
  lines: BON_43413_LINES,
};

/** A second Bon on page 2, so page-level rescan targeting can be tested. */
const PAGE_2_LINES: InvoiceLine[] = [
  { page: 2, bon_nr: '43414', pos: 1, supplier_article_nr: '441002',
    description: 'Tomaten Rispe', a_kolli: 10, inh_kolli: null, einheit: 'ST',
    menge: null, preis: 1.200, betrag: 12.00 },
  { page: 2, bon_nr: '43414', pos: 2, supplier_article_nr: '441119',
    description: 'Paprika rot', a_kolli: 4, inh_kolli: null, einheit: 'ST',
    menge: null, preis: 2.500, betrag: 10.00 },
];

const TWO_PAGE_INVOICE: InvoiceExtraction = {
  ...BON_43413,
  bon_totals: [
    { bon_nr: '43413', subtotal: 142.46 },
    { bon_nr: '43414', subtotal: 22.00 },
  ],
  warenwert: 164.46,
  lines: [...BON_43413_LINES, ...PAGE_2_LINES],
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

/** Copy the fixture with one line's field changed — a mis-read digit. */
function corrupt(
  source: InvoiceExtraction,
  match: (line: InvoiceLine) => boolean,
  patch: Partial<InvoiceLine>
): InvoiceExtraction {
  const copy = clone(source);
  const line = copy.lines.find(match);
  if (!line) throw new Error('fixture line not found — the test itself is wrong');
  Object.assign(line, patch);
  return copy;
}

const lineOf = (pos: number): InvoiceLine =>
  clone(BON_43413_LINES.find(l => l.pos === pos)!);

// ---------------------------------------------------------------------------
// Minimal harness
// ---------------------------------------------------------------------------

let passed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    passed++;
  } catch (error) {
    failures.push(`${name}\n    ${(error as Error).message}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, message = ''): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message}\n    expected ${e}\n    actual   ${a}`);
}

// ---------------------------------------------------------------------------
// Rounding — half up, away from zero, immune to binary float noise
// ---------------------------------------------------------------------------

test('roundHalfUp: 8,125 rounds up to 8,13', () => {
  assertEqual(roundHalfUp(8.125), 8.13);
});

test('roundHalfUp: 2,675 is not dragged down by binary float noise', () => {
  // 2.675 is stored as 2.674999…; a naive Math.round(x * 100) yields 2,67.
  assertEqual(roundHalfUp(2.675), 2.68);
});

test('roundHalfUp: negative halves round away from zero, not toward +Infinity', () => {
  // toFixed(2) on -8.125 gives "-8.12" — wrong for a Storno line.
  assertEqual(roundHalfUp(-8.125), -8.13);
});

// ---------------------------------------------------------------------------
// Line arithmetic — the four shapes suppliers actually print
// ---------------------------------------------------------------------------

test('line: 13 x 0,625 = 8,13 (three-decimal price)', () => {
  const line = lineOf(1);
  assertEqual(computeLineAmount(line), 8.13);
  assertEqual(verifyLine(line, 0), null, 'line should reconcile');
});

test('line: 3 KTK x 6 DS x 2,890 = 52,02 (Karton times inner count)', () => {
  const line = lineOf(2);
  assertEqual(computeLineAmount(line), 52.02);
  assertEqual(verifyLine(line, 0), null, 'line should reconcile');
});

test('line: 1 x 2,035 kg x 3,490 = 7,10 (weighed goods)', () => {
  const line = lineOf(3);
  assertEqual(computeLineAmount(line), 7.10);
  assertEqual(verifyLine(line, 0), null, 'line should reconcile');
});

test('line: 12- x 0,680 = 8,16- (Storno)', () => {
  const line = lineOf(4);
  assertEqual(computeLineAmount(line), -8.16);
  assertEqual(verifyLine(line, 0), null, 'Storno line should reconcile');
});

test('line: a missing inh_kolli counts as 1, not as 0', () => {
  const line = { ...lineOf(1), inh_kolli: undefined };
  assertEqual(computeLineAmount(line), 8.13);
});

test('line: a one-cent error is caught', () => {
  const line = { ...lineOf(2), betrag: 52.03 };
  const issue = verifyLine(line, 0);
  assert(issue !== null, 'a one-cent difference must not pass');
  assertEqual(issue!.code, 'line_mismatch');
  assertEqual(issue!.expected, 52.02);
  assertEqual(issue!.delta, 0.01);
});

test('line: a corrupted digit is caught (52,02 read as 62,02)', () => {
  const line = { ...lineOf(2), betrag: 62.02 };
  const issue = verifyLine(line, 0);
  assert(issue !== null, 'a corrupted digit must not pass');
  assertEqual(issue!.code, 'line_mismatch');
  assertEqual(issue!.delta, 10.0);
});

// ---------------------------------------------------------------------------
// Unverifiable lines — flagged, never guessed
// ---------------------------------------------------------------------------

test('unverifiable: a missing preis is flagged and never back-computed', () => {
  const line = { ...lineOf(1), preis: null };
  assertEqual(computeLineAmount(line), null, 'must not derive preis from betrag');
  const issue = verifyLine(line, 0);
  assert(issue !== null, 'a line with no price cannot be called verified');
  assertEqual(issue!.code, 'missing_preis');
  assertEqual(issue!.expected, null);
});

test('unverifiable: a missing quantity is flagged', () => {
  const line = { ...lineOf(1), a_kolli: null };
  const issue = verifyLine(line, 0);
  assert(issue !== null, 'a line with no quantity cannot be checked');
  assertEqual(issue!.code, 'missing_quantity');
});

test('unverifiable: a missing betrag is flagged', () => {
  const line = { ...lineOf(1), betrag: null };
  const issue = verifyLine(line, 0);
  assert(issue !== null, 'a line with no amount cannot be checked');
  assertEqual(issue!.code, 'missing_betrag');
});

// ---------------------------------------------------------------------------
// Pfand
// ---------------------------------------------------------------------------

test('Pfand: deposit lines are excluded from the Warenwert', () => {
  const withoutPfand = BON_43413_LINES.filter(l => !l.is_pfand);
  assertEqual(computeWarenwert(BON_43413_LINES), computeWarenwert(withoutPfand));
  assertEqual(computeWarenwert(BON_43413_LINES), 142.46);
});

test('Pfand: deposit lines are still checked arithmetically', () => {
  const good = BON_43413_LINES.find(l => l.is_pfand)!;
  assertEqual(verifyLine(good, 0), null, 'a correct Pfand line reconciles');

  const bad = { ...clone(good), betrag: 4.0 };
  const issue = verifyLine(bad, 0);
  assert(issue !== null, 'a wrong Pfand line must still be caught');
  assertEqual(issue!.code, 'line_mismatch');
});

// ---------------------------------------------------------------------------
// Bon subtotals
// ---------------------------------------------------------------------------

test('Bon: the printed subtotal for 43413 matches the lines', () => {
  const report = verifyInvoice(BON_43413);
  assertEqual(report.bons.length, 1);
  assertEqual(report.bons[0].bon_nr, '43413');
  assertEqual(report.bons[0].computed, 142.46);
  assert(report.bons[0].ok, 'Bon 43413 must reconcile');
});

test('Bon: a wrong subtotal fails and names the Bon', () => {
  const misread = clone(BON_43413);
  misread.bon_totals = [{ bon_nr: '43413', subtotal: 142.96 }];
  const report = verifyInvoice(misread);
  assert(!report.ok, 'a wrong Bon subtotal must fail the report');
  assertEqual(report.bons[0].bon_nr, '43413');
  assertEqual(report.bons[0].delta, 0.5);
  assertEqual(report.rescanPages, [1]);
});

test('Bon: a Bon with no printed subtotal is not invented', () => {
  const noTotals = clone(BON_43413);
  delete noTotals.bon_totals;
  const report = verifyInvoice(noTotals);
  assertEqual(report.bons, [], 'nothing to check means no check, not a pass');
  assert(report.ok, 'the invoice still reconciles on its Warenwert');
});

// ---------------------------------------------------------------------------
// Whole invoice
// ---------------------------------------------------------------------------

test('invoice: Bon 43413 reconciles to 142,46 exactly', () => {
  const report = verifyInvoice(BON_43413);
  assertEqual(report.warenwert.computed, 142.46);
  assertEqual(report.warenwert.printed, 142.46);
  assertEqual(report.warenwert.delta, 0);
  assert(report.ok, `report should be ok, got: ${report.summary}`);
});

test('invoice: a clean invoice asks for no rescans', () => {
  const report = verifyInvoice(BON_43413);
  assertEqual(report.rescanPages, []);
  assertEqual(report.lineIssues, []);
  assertEqual(report.unverifiableCount, 0);
});

test('invoice: a single corrupted digit fails the whole report', () => {
  // 52,02 read as 62,02 — the line breaks, and so does everything above it.
  const misread = corrupt(BON_43413, l => l.pos === 2, { betrag: 62.02 });
  const report = verifyInvoice(misread);
  assert(!report.ok, 'one bad digit must fail the report');
  assertEqual(report.lineIssues.length, 1);
  assertEqual(report.lineIssues[0].supplier_article_nr, '118902');
  assert(!report.warenwert.ok, 'the Warenwert must no longer reconcile');
  assert(!report.bons[0].ok, 'the Bon subtotal must no longer reconcile');
});

test('invoice: the rescan list names only the page that failed', () => {
  const misread = corrupt(TWO_PAGE_INVOICE, l => l.page === 2 && l.pos === 1, { betrag: 13.0 });
  const report = verifyInvoice(misread);
  assert(!report.ok, 'a corrupted page-2 line must fail the report');
  assertEqual(report.rescanPages, [2], 'page 1 was read cleanly and need not be re-shot');
});

test('invoice: no printed Warenwert means nothing anchors the reading', () => {
  const anchorless = clone(BON_43413);
  anchorless.warenwert = null;
  const report = verifyInvoice(anchorless);
  assert(!report.ok, 'without the printed total the extraction proves nothing');
  assertEqual(report.warenwert.delta, null);
  assertEqual(report.rescanPages, [1]);
});

// ---------------------------------------------------------------------------
// Two-pass comparison
// ---------------------------------------------------------------------------

test('passes: two identical readings produce no conflict', () => {
  assertEqual(comparePasses(BON_43413, clone(BON_43413)), []);
});

test('passes: a digit read two ways is a conflict on that field', () => {
  // The fold runs through the price on Pos 2: 2,890 reads as 2,390 second time.
  const passB = corrupt(BON_43413, l => l.pos === 2, { preis: 2.39 });
  const conflicts = comparePasses(BON_43413, passB);
  assertEqual(conflicts.length, 1);
  assertEqual(conflicts[0].field, 'preis');
  assertEqual(conflicts[0].key, 'Bon 43413 Pos 2');
  assertEqual(conflicts[0].page, 1);

  // And a conflict alone is enough to hold the invoice back.
  const report = verifyInvoice(BON_43413, conflicts);
  assert(!report.ok, 'a disagreement between passes must block the review screen');
  assertEqual(report.rescanPages, [1]);
});

test('passes: a line one pass missed entirely is a conflict', () => {
  const passB = clone(BON_43413);
  passB.lines = passB.lines.filter(l => l.pos !== 7);
  const conflicts = comparePasses(BON_43413, passB);
  assert(conflicts.some(c => c.field === 'count'), 'the line count difference must be reported');
  assert(
    conflicts.some(c => c.key === 'Bon 43413 Pos 7' && c.scope === 'structure'),
    'the missing line must be named'
  );
});

// ---------------------------------------------------------------------------

for (const failure of failures) console.error(`FAIL  ${failure}`);
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length > 0) process.exit(1);
