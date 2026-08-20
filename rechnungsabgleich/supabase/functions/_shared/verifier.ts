/**
 * Rechnungsabgleich — arithmetic verifier.
 *
 * The boundary this file defends: extraction is the model's job, verification is
 * arithmetic's job. Nothing in here calls an API, reads a clock, or knows what a
 * supplier is. It takes what the model claims it read off the paper and proves —
 * or disproves — that the numbers are internally consistent and add up to the
 * printed Warenwert.
 *
 * If a photo is smudged, folded, or a digit is misread, one of these checks fails
 * and the invoice is sent back for a rescan instead of reaching the review screen.
 *
 * No imports, no dependencies: this file is copied verbatim into
 * supabase/functions/_shared/verifier.ts so the edge function runs the exact same
 * arithmetic the tests cover (`npm run sync:verifier`).
 */

// ---------------------------------------------------------------------------
// Data shapes — one German wholesale invoice as the extractor returns it
// ---------------------------------------------------------------------------

export interface InvoiceLine {
  /** 1-based page of the photographed invoice this line was read from. */
  page: number;
  /** Bon (receipt) this line belongs to. Hamberger groups lines into Bons. */
  bon_nr?: string | null;
  /** Position number printed on the Bon. */
  pos?: number | null;
  /** The supplier's article number. The ONLY thing we ever join on. */
  supplier_article_nr: string;
  /** Free text as printed. Displayed to a human, never used for matching. */
  description: string;
  /** Outer quantity (Kolli/Karton/piece count). Negative on a Storno line. */
  a_kolli: number | null;
  /** Inner count per Kolli — the "6 DS" in "3 KTK x 6 DS". Absent means 1. */
  inh_kolli?: number | null;
  /** Unit as printed: KTK, DS, ST, KG … */
  einheit?: string | null;
  /** Weighed goods: the kg actually billed (2,035 kg), not the nominal count. */
  menge?: number | null;
  /** Unit price. Suppliers print three decimals (0,625) — keep all three. */
  preis: number | null;
  /** The line amount as printed. Negative on a Storno line. */
  betrag: number | null;
  /** Deposit line. Verified arithmetically, excluded from the Warenwert. */
  is_pfand?: boolean;
}

export interface BonTotal {
  bon_nr: string;
  /** Subtotal as printed under the Bon. */
  subtotal: number;
}

export interface InvoiceExtraction {
  invoice_no?: string | null;
  /** ISO date, or null when the extractor could not read it. */
  invoice_date?: string | null;
  /** Printed per-Bon subtotals, where the supplier prints them. */
  bon_totals?: BonTotal[];
  /** The printed Warenwert (goods total, Pfand excluded). */
  warenwert: number | null;
  lines: InvoiceLine[];
}

export type LineIssueCode =
  | 'line_mismatch'
  | 'missing_preis'
  | 'missing_quantity'
  | 'missing_betrag';

export interface LineIssue {
  /** Index into `extraction.lines`. */
  index: number;
  page: number;
  pos?: number | null;
  bon_nr?: string | null;
  supplier_article_nr: string;
  description: string;
  code: LineIssueCode;
  /** What the arithmetic says the line should come to, when computable. */
  expected: number | null;
  /** What the invoice prints. */
  printed: number | null;
  /** printed − expected, in euro. Null when the line is unverifiable. */
  delta: number | null;
  message: string;
}

export interface BonCheck {
  bon_nr: string;
  printed: number;
  computed: number;
  delta: number;
  ok: boolean;
  /** Pages this Bon's lines were read from. */
  pages: number[];
}

export interface WarenwertCheck {
  printed: number | null;
  computed: number;
  delta: number | null;
  ok: boolean;
}

export interface PassConflict {
  scope: 'line' | 'total' | 'structure';
  /** Which line the two passes disagree about, as bon/pos or page/index. */
  key: string;
  field: string;
  pass_a: unknown;
  pass_b: unknown;
  page: number | null;
  message: string;
}

export interface VerificationReport {
  ok: boolean;
  warenwert: WarenwertCheck;
  bons: BonCheck[];
  lineIssues: LineIssue[];
  /** Lines whose arithmetic could not be checked at all (e.g. no preis printed). */
  unverifiableCount: number;
  conflicts: PassConflict[];
  /** Pages to re-shoot. Empty when ok. */
  rescanPages: number[];
  summary: string;
}

// ---------------------------------------------------------------------------
// Rounding
// ---------------------------------------------------------------------------

/**
 * Round half away from zero, the way an invoice does it.
 *
 * Two traps this avoids:
 *  - `toFixed` rounds half toward +Infinity, so a Storno line's −8,125 becomes
 *    −8,12 where the paper says 8,16− … the sign must not change the magnitude.
 *  - binary floats: 2.675 is stored as 2.67499999…, so a naive `Math.round(x*100)`
 *    rounds it down. Trimming to 15 significant digits restores the decimal the
 *    number was written as, and shifting via a decimal string adds no new noise.
 */
export function roundHalfUp(value: number, dp = 2): number {
  if (!Number.isFinite(value)) return NaN;
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);

  const clean = Number(abs.toPrecision(15));
  const asString = clean.toString();

  // Exponential notation ("1e-7") cannot be string-shifted; such magnitudes never
  // appear on an invoice, so plain float scaling is good enough there.
  if (asString.includes('e') || asString.includes('E')) {
    return (sign * Math.round(clean * 10 ** dp)) / 10 ** dp;
  }

  const shifted = Number(`${asString}e${dp}`);
  if (!Number.isFinite(shifted)) return sign * clean;
  return sign * Number(`${Math.round(shifted)}e-${dp}`);
}

/** Euro equality: two amounts are the same only if they are the same cent. */
function sameCent(a: number, b: number): boolean {
  return Math.round(roundHalfUp(a, 2) * 100) === Math.round(roundHalfUp(b, 2) * 100);
}

// ---------------------------------------------------------------------------
// Line arithmetic
// ---------------------------------------------------------------------------

/**
 * What a line should come to: a_kolli x inh_kolli x menge x preis.
 *
 * The three quantity factors collapse every shape the suppliers print:
 *   13 x 0,625                    -> 13 x 1 x 1     x 0,625 = 8,13
 *   3 KTK x 6 DS x 2,890          -> 3  x 6 x 1     x 2,890 = 52,02
 *   1 x 2,035 kg x 3,490          -> 1  x 1 x 2,035 x 3,490 = 7,10
 *   12- x 0,680                   -> -12 x 1 x 1    x 0,680 = 8,16-
 *
 * Returns null when a factor is missing. It never back-computes a missing preis
 * from the printed betrag — that would make the line agree with itself by
 * construction and verify nothing.
 */
export function computeLineAmount(line: InvoiceLine): number | null {
  if (line.preis === null || line.preis === undefined) return null;
  if (line.a_kolli === null || line.a_kolli === undefined) return null;

  const inner = line.inh_kolli === null || line.inh_kolli === undefined ? 1 : line.inh_kolli;
  const weight = line.menge === null || line.menge === undefined ? 1 : line.menge;

  return roundHalfUp(line.a_kolli * inner * weight * line.preis, 2);
}

function describeLine(line: InvoiceLine, index: number, code: LineIssueCode,
                      expected: number | null, message: string): LineIssue {
  const printed = line.betrag ?? null;
  return {
    index,
    page: line.page,
    pos: line.pos ?? null,
    bon_nr: line.bon_nr ?? null,
    supplier_article_nr: line.supplier_article_nr,
    description: line.description,
    code,
    expected,
    printed,
    delta: expected !== null && printed !== null ? roundHalfUp(printed - expected, 2) : null,
    message,
  };
}

/** Check one line. Returns null when the line reconciles. */
export function verifyLine(line: InvoiceLine, index: number): LineIssue | null {
  if (line.betrag === null || line.betrag === undefined) {
    return describeLine(line, index, 'missing_betrag', computeLineAmount(line),
      'No line amount was read from this line.');
  }

  if (line.a_kolli === null || line.a_kolli === undefined) {
    return describeLine(line, index, 'missing_quantity', null,
      'No quantity was read, so this line cannot be checked.');
  }

  if (line.preis === null || line.preis === undefined) {
    return describeLine(line, index, 'missing_preis', null,
      'No unit price was read, so this line cannot be checked.');
  }

  const expected = computeLineAmount(line) as number;
  if (sameCent(expected, line.betrag)) return null;

  return describeLine(line, index, 'line_mismatch', expected,
    `Line comes to ${expected.toFixed(2)} but the invoice prints ${line.betrag.toFixed(2)}.`);
}

// ---------------------------------------------------------------------------
// Full invoice
// ---------------------------------------------------------------------------

/** Goods total: every non-Pfand line's printed amount. Pfand is not Warenwert. */
export function computeWarenwert(lines: InvoiceLine[]): number {
  const sum = lines.reduce((acc, line) => {
    if (line.is_pfand) return acc;
    if (line.betrag === null || line.betrag === undefined) return acc;
    return acc + line.betrag;
  }, 0);
  return roundHalfUp(sum, 2);
}

function verifyBons(extraction: InvoiceExtraction): BonCheck[] {
  const printedTotals = extraction.bon_totals ?? [];
  return printedTotals.map(({ bon_nr, subtotal }) => {
    const lines = extraction.lines.filter(l => (l.bon_nr ?? null) === bon_nr);
    const computed = computeWarenwert(lines);
    const delta = roundHalfUp(subtotal - computed, 2);
    return {
      bon_nr,
      printed: subtotal,
      computed,
      delta,
      ok: sameCent(subtotal, computed),
      pages: uniqueSorted(lines.map(l => l.page)),
    };
  });
}

function uniqueSorted(values: number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

/**
 * Verify an extracted invoice.
 *
 * `conflicts` comes from comparePasses() — pass it in so a disagreement between
 * the two extraction passes lands in the same report (and the same rescan page
 * list) as an arithmetic failure. They are the same kind of problem: the photo
 * could not be read with confidence.
 */
export function verifyInvoice(
  extraction: InvoiceExtraction,
  conflicts: PassConflict[] = []
): VerificationReport {
  const lineIssues: LineIssue[] = [];
  for (let i = 0; i < extraction.lines.length; i++) {
    const issue = verifyLine(extraction.lines[i], i);
    if (issue) lineIssues.push(issue);
  }

  const unverifiableCount = lineIssues.filter(
    i => i.code === 'missing_preis' || i.code === 'missing_quantity' || i.code === 'missing_betrag'
  ).length;

  const bons = verifyBons(extraction);

  const computedWarenwert = computeWarenwert(extraction.lines);
  const printedWarenwert = extraction.warenwert ?? null;
  const warenwert: WarenwertCheck = {
    printed: printedWarenwert,
    computed: computedWarenwert,
    delta: printedWarenwert === null ? null : roundHalfUp(printedWarenwert - computedWarenwert, 2),
    // No printed Warenwert means nothing anchors the extraction to the paper.
    ok: printedWarenwert !== null && sameCent(printedWarenwert, computedWarenwert),
  };

  const ok =
    lineIssues.length === 0 &&
    bons.every(b => b.ok) &&
    warenwert.ok &&
    conflicts.length === 0;

  // Which pages to re-shoot. A line or Bon failure points at its own pages; a
  // Warenwert that is off with every line reconciling means a line was missed
  // entirely, and we cannot say where — so the whole invoice goes back.
  const pages = new Set<number>();
  for (const issue of lineIssues) pages.add(issue.page);
  for (const bon of bons) if (!bon.ok) for (const p of bon.pages) pages.add(p);
  for (const conflict of conflicts) if (conflict.page !== null) pages.add(conflict.page);
  if (!warenwert.ok && pages.size === 0) {
    for (const line of extraction.lines) pages.add(line.page);
  }

  return {
    ok,
    warenwert,
    bons,
    lineIssues,
    unverifiableCount,
    conflicts,
    rescanPages: ok ? [] : uniqueSorted(Array.from(pages)),
    summary: buildSummary(ok, extraction, warenwert, bons, lineIssues, conflicts),
  };
}

function buildSummary(
  ok: boolean,
  extraction: InvoiceExtraction,
  warenwert: WarenwertCheck,
  bons: BonCheck[],
  lineIssues: LineIssue[],
  conflicts: PassConflict[]
): string {
  if (ok) {
    return `${extraction.lines.length} lines reconcile to ${warenwert.computed.toFixed(2)}.`;
  }
  const parts: string[] = [];
  if (conflicts.length) parts.push(`${conflicts.length} disagreement(s) between the two readings`);
  if (lineIssues.length) parts.push(`${lineIssues.length} line(s) do not add up`);
  const badBons = bons.filter(b => !b.ok);
  if (badBons.length) parts.push(`${badBons.length} Bon subtotal(s) off`);
  if (!warenwert.ok) {
    parts.push(
      warenwert.printed === null
        ? 'no printed Warenwert to check against'
        : `Warenwert off by ${(warenwert.delta ?? 0).toFixed(2)}`
    );
  }
  return `Not verified: ${parts.join('; ')}.`;
}

// ---------------------------------------------------------------------------
// Two-pass comparison
// ---------------------------------------------------------------------------

/** Fields compared between passes. Description is free text and is left out. */
const COMPARED_FIELDS: (keyof InvoiceLine)[] = [
  'supplier_article_nr',
  'a_kolli',
  'inh_kolli',
  'menge',
  'preis',
  'betrag',
  'is_pfand',
];

function lineKey(line: InvoiceLine, index: number): string {
  if (line.bon_nr && line.pos !== null && line.pos !== undefined) {
    return `Bon ${line.bon_nr} Pos ${line.pos}`;
  }
  return `page ${line.page} line ${index + 1}`;
}

function normalize(value: unknown): unknown {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number') return roundHalfUp(value, 3);
  if (typeof value === 'string') return value.trim();
  return value;
}

/**
 * Compare two independent readings of the same photos.
 *
 * A digit that is legible reads the same twice. A digit smudged by a fold reads
 * two different ways, and that shows up here — before any of it is believed.
 */
export function comparePasses(a: InvoiceExtraction, b: InvoiceExtraction): PassConflict[] {
  const conflicts: PassConflict[] = [];

  if (a.lines.length !== b.lines.length) {
    conflicts.push({
      scope: 'structure',
      key: 'lines',
      field: 'count',
      pass_a: a.lines.length,
      pass_b: b.lines.length,
      page: null,
      message: `The two readings found a different number of lines (${a.lines.length} vs ${b.lines.length}).`,
    });
  }

  const byKeyB = new Map<string, InvoiceLine>();
  b.lines.forEach((line, i) => byKeyB.set(lineKey(line, i), line));

  a.lines.forEach((lineA, i) => {
    const key = lineKey(lineA, i);
    const lineB = byKeyB.get(key);
    if (!lineB) {
      conflicts.push({
        scope: 'structure',
        key,
        field: 'line',
        pass_a: lineA.description,
        pass_b: null,
        page: lineA.page,
        message: `${key} was only read on one of the two passes.`,
      });
      return;
    }
    for (const field of COMPARED_FIELDS) {
      const va = normalize(lineA[field]);
      const vb = normalize(lineB[field]);
      if (va !== vb) {
        conflicts.push({
          scope: 'line',
          key,
          field,
          pass_a: va,
          pass_b: vb,
          page: lineA.page,
          message: `${key}: "${field}" was read as ${String(va)} and as ${String(vb)}.`,
        });
      }
    }
  });

  if (normalize(a.warenwert) !== normalize(b.warenwert)) {
    conflicts.push({
      scope: 'total',
      key: 'warenwert',
      field: 'warenwert',
      pass_a: a.warenwert,
      pass_b: b.warenwert,
      page: null,
      message: `The printed Warenwert was read as ${String(a.warenwert)} and as ${String(b.warenwert)}.`,
    });
  }

  const totalsA = new Map((a.bon_totals ?? []).map(t => [t.bon_nr, t.subtotal]));
  const totalsB = new Map((b.bon_totals ?? []).map(t => [t.bon_nr, t.subtotal]));
  for (const bon of new Set([...totalsA.keys(), ...totalsB.keys()])) {
    const va = normalize(totalsA.get(bon));
    const vb = normalize(totalsB.get(bon));
    if (va !== vb) {
      conflicts.push({
        scope: 'total',
        key: `Bon ${bon}`,
        field: 'subtotal',
        pass_a: va,
        pass_b: vb,
        page: null,
        message: `Bon ${bon} subtotal was read as ${String(va)} and as ${String(vb)}.`,
      });
    }
  }

  return conflicts;
}
