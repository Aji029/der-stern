/**
 * verifier.ts
 *
 * Pure arithmetic. No AI, no network, no database.
 *
 * This is the safety net. Vision extraction can misread a digit on a folded
 * or shadowed photo; arithmetic cannot. If a photo is bad, these checks fail
 * and the invoice is sent back for a rescan -- it never reaches the review
 * screen with silently wrong numbers.
 *
 * Three levels, cheapest first:
 *   1. line   -- a_kolli * inh_kolli * preis == betrag
 *   2. bon    -- lines in a Bon sum to the printed Bonbetrag
 *   3. total  -- all goods lines sum to the printed Warenwert
 */

export interface RawLine {
  page_no: number;
  line_no: number;
  bon?: string | null;
  supplier_art_nr?: string | null;
  description: string;
  a_kolli: number | null;   // outer count. null -> treated as 1
  inh_kolli: number | null; // inner count, OR a weight in kg. null -> treated as 1
  einheit?: string | null;
  preis: number;            // price per unit, up to 4 decimals
  betrag: number;           // line total as printed
  ust_code?: string | null;
  is_leergut?: boolean;     // Pfand / deposit, sits outside Warenwert
}

export interface BonTotal {
  bon: string;
  betrag: number;
}

export interface InvoiceTotals {
  warenwert?: number | null;   // goods net, excluding Leergut
  endbetrag?: number | null;   // Rechnungsendbetrag, incl. tax + Leergut
  leergut?: number | null;
}

export interface LineResult extends RawLine {
  effective_menge: number;
  expected_betrag: number;
  delta: number;
  math_ok: boolean;
}

export interface VerifyReport {
  ok: boolean;
  lines: LineResult[];
  failed_lines: LineResult[];
  bon_checks: Array<{
    bon: string;
    printed: number;
    computed: number;
    delta: number;
    ok: boolean;
  }>;
  total_check: {
    printed: number | null;
    computed: number;
    delta: number;
    ok: boolean;
    checked: boolean;
  };
  messages: string[];
}

/** Commercial rounding to 2 decimals, half away from zero, FP-safe. */
export function round2(n: number): number {
  const scaled = n * 100;
  // nudge past the float representation error before rounding
  const eps = Math.sign(scaled) * 1e-9;
  return Math.round(scaled + eps) / 100;
}

/**
 * Effective quantity billed on a line.
 *
 * Hamberger prints outer count in A.Kolli and inner count in Inh.Kolli:
 *   3 KTK x 6 DS @ 2,890 = 52,02   (18 cans)
 *   1 KTK x 4 PG @ 28,700 = 114,80 (4 packs)
 * For weighed goods, Inh.Kolli carries the weight instead:
 *   1 x 2,035 KG @ 3,490 = 7,10
 * Multiplying the two covers both cases.
 */
export function effectiveMenge(l: RawLine): number {
  const a = l.a_kolli ?? 1;
  const i = l.inh_kolli ?? 1;
  return a * i;
}

/** Level 1: every line's own arithmetic. */
export function verifyLines(lines: RawLine[], tolerance = 0.01): LineResult[] {
  return lines.map((l) => {
    const menge = effectiveMenge(l);
    const expected = round2(menge * l.preis);
    const delta = round2(expected - l.betrag);
    return {
      ...l,
      effective_menge: menge,
      expected_betrag: expected,
      delta,
      math_ok: Math.abs(delta) <= tolerance + 1e-9,
    };
  });
}

/** Level 2: Bon subtotals. Only Bons present in `printed` are checked. */
export function verifyBons(
  lines: LineResult[],
  printed: BonTotal[],
  tolerance = 0.01,
) {
  return printed.map((p) => {
    const computed = round2(
      lines
        .filter((l) => l.bon === p.bon && !l.is_leergut)
        .reduce((s, l) => s + l.betrag, 0),
    );
    const delta = round2(computed - p.betrag);
    return {
      bon: p.bon,
      printed: p.betrag,
      computed,
      delta,
      ok: Math.abs(delta) <= tolerance + 1e-9,
    };
  });
}

/** Level 3: all goods lines against the printed Warenwert. */
export function verifyTotal(
  lines: LineResult[],
  totals: InvoiceTotals,
  tolerance = 0.02,
) {
  const computed = round2(
    lines.filter((l) => !l.is_leergut).reduce((s, l) => s + l.betrag, 0),
  );
  const printed = totals.warenwert ?? null;
  if (printed == null) {
    return { printed: null, computed, delta: 0, ok: false, checked: false };
  }
  const delta = round2(computed - printed);
  return {
    printed,
    computed,
    delta,
    ok: Math.abs(delta) <= tolerance + 1e-9,
    checked: true,
  };
}

export function verifyInvoice(
  raw: RawLine[],
  printedBons: BonTotal[],
  totals: InvoiceTotals,
): VerifyReport {
  const lines = verifyLines(raw);
  const failed_lines = lines.filter((l) => !l.math_ok);
  const bon_checks = verifyBons(lines, printedBons);
  const total_check = verifyTotal(lines, totals);
  const messages: string[] = [];

  for (const l of failed_lines) {
    messages.push(
      `Page ${l.page_no} line ${l.line_no} "${l.description}": ` +
        `${l.effective_menge} x ${l.preis} = ${l.expected_betrag}, ` +
        `invoice says ${l.betrag}. Rescan this page.`,
    );
  }
  for (const b of bon_checks.filter((b) => !b.ok)) {
    messages.push(
      `Bon ${b.bon}: lines add to ${b.computed}, invoice says ${b.printed} ` +
        `(off by ${b.delta}). A line is missing or misread.`,
    );
  }
  if (!total_check.checked) {
    messages.push(
      'No Warenwert found. The last page with the totals is missing, ' +
        'so the invoice cannot be fully verified.',
    );
  } else if (!total_check.ok) {
    messages.push(
      `Total: lines add to ${total_check.computed}, invoice says ` +
        `${total_check.printed} (off by ${total_check.delta}).`,
    );
  }

  const ok =
    failed_lines.length === 0 &&
    bon_checks.every((b) => b.ok) &&
    total_check.checked &&
    total_check.ok;

  return { ok, lines, failed_lines, bon_checks, total_check, messages };
}

/* ---------------------------------------------------------------
 * Consensus between two independent extractions of the same photo.
 * Cheap insurance against a digit misread on a folded or shadowed page.
 * ------------------------------------------------------------- */

export interface ConsensusResult {
  agree: boolean;
  conflicts: Array<{
    page_no: number;
    line_no: number;
    field: string;
    a: unknown;
    b: unknown;
  }>;
}

const COMPARED_FIELDS: (keyof RawLine)[] = [
  'supplier_art_nr',
  'a_kolli',
  'inh_kolli',
  'preis',
  'betrag',
];

export function compareExtractions(
  a: RawLine[],
  b: RawLine[],
): ConsensusResult {
  const conflicts: ConsensusResult['conflicts'] = [];
  const key = (l: RawLine) => `${l.page_no}:${l.line_no}`;
  const mapB = new Map(b.map((l) => [key(l), l]));

  if (a.length !== b.length) {
    conflicts.push({
      page_no: -1,
      line_no: -1,
      field: 'line_count',
      a: a.length,
      b: b.length,
    });
  }

  for (const la of a) {
    const lb = mapB.get(key(la));
    if (!lb) {
      conflicts.push({
        page_no: la.page_no,
        line_no: la.line_no,
        field: 'missing_in_second_pass',
        a: la.description,
        b: null,
      });
      continue;
    }
    for (const f of COMPARED_FIELDS) {
      if (la[f] !== lb[f]) {
        conflicts.push({
          page_no: la.page_no,
          line_no: la.line_no,
          field: f,
          a: la[f],
          b: lb[f],
        });
      }
    }
  }
  return { agree: conflicts.length === 0, conflicts };
}

/* ---------------------------------------------------------------
 * Diff against your stored prices -> what the review screen shows.
 * ------------------------------------------------------------- */

export interface StoredArticle {
  article_id: string;
  name: string;
  ek_price: number;
}

export interface Mapping {
  supplier_art_nr: string;
  article_id: string;
  unit_factor: number;
}

export type DiffRow =
  | {
      kind: 'price_change';
      art_nr: string;
      article_id: string;
      name: string;
      old_price: number;
      new_price: number;
      delta: number;
    }
  | { kind: 'unmapped'; art_nr: string; description: string; preis: number }
  | { kind: 'unchanged'; art_nr: string; article_id: string; name: string };

export function diffPrices(
  lines: LineResult[],
  mappings: Mapping[],
  articles: StoredArticle[],
  tolerance = 0.005,
): DiffRow[] {
  const mapByArt = new Map(mappings.map((m) => [m.supplier_art_nr, m]));
  const artById = new Map(articles.map((a) => [a.article_id, a]));
  const out: DiffRow[] = [];
  const seen = new Set<string>();

  for (const l of lines) {
    const art = l.supplier_art_nr;
    if (!art || l.is_leergut || seen.has(art)) continue;
    seen.add(art);

    const m = mapByArt.get(art);
    if (!m) {
      out.push({
        kind: 'unmapped',
        art_nr: art,
        description: l.description,
        preis: l.preis,
      });
      continue;
    }
    const stored = artById.get(m.article_id);
    if (!stored) continue;

    // unit_factor: invoice bills a Karton of 12, you stock the single piece
    const newPrice = round4(l.preis / m.unit_factor);
    const delta = round4(newPrice - stored.ek_price);

    if (Math.abs(delta) > tolerance) {
      out.push({
        kind: 'price_change',
        art_nr: art,
        article_id: m.article_id,
        name: stored.name,
        old_price: stored.ek_price,
        new_price: newPrice,
        delta,
      });
    } else {
      out.push({
        kind: 'unchanged',
        art_nr: art,
        article_id: m.article_id,
        name: stored.name,
      });
    }
  }
  return out;
}

export function round4(n: number): number {
  const scaled = n * 10000;
  const eps = Math.sign(scaled) * 1e-9;
  return Math.round(scaled + eps) / 10000;
}
