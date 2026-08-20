# Rechnungsabgleich

Invoice price reconciliation for der Stern. Photograph the invoice, get a list of
what changed, tap approve.

The design principle throughout: **extraction is the model's job, verification is
arithmetic's job, mapping decisions are yours.** Nothing writes to the article
table without you pressing Übernehmen.

## Files

| Path | What it is |
|---|---|
| `db/001_schema.sql` | Supabase tables, RLS, storage policies, supplier seed |
| `shared/verifier.ts` | Pure arithmetic — the safety net |
| `shared/verifier.test.ts` | 26 tests, Bon 43413 |
| `supabase/functions/extract-invoice/` | Double extraction + verify |
| `src/InvoiceReview.tsx` | The one screen you touch daily |
| `src/pages/InvoicesPage.tsx` | Photograph and upload |

Standalone Vite + React + TypeScript app. It shares der Stern's Supabase project,
its users, and its `public.products` table; it shares no code and deploys
separately.

---

## Step 1 — Schema

Paste `db/001_schema.sql` into the Supabase SQL editor and run it. Then:

1. **Settings → API → Exposed schemas: add `rechnungsabgleich`.**
   Without this every query returns 404.
2. **Storage: create a private bucket named `invoices`**, then re-run the
   storage-policy block at the bottom of the SQL file.

The suppliers are seeded by the same file:

```sql
insert into rechnungsabgleich.suppliers (name, layout_key) values
  ('Hamberger Großmarkt Berlin', 'hamberger'),
  ('Gemex Handels GmbH',         'gemex');
```

Two things that were adapted to der Stern rather than left as placeholders:

- **`article_mappings.article_id` has a real FK** to `public.products(artikel_nr)`,
  as does `invoice_lines.article_id`.
- **RLS policies are written, not empty.** They mirror `public.products`: any
  authenticated user of the account may read and write. Empty policies with RLS on
  means nothing works at all. To scope per user instead, swap the `using (true)`
  clauses for `using (auth.uid() = created_by)`.

### Why a separate schema

der Stern already owns `public.suppliers`, with `company_name` and
`contact_person` NOT NULL and per-user RLS. A second `suppliers` in `public`
would collide with it, so every table here lives in the `rechnungsabgleich`
schema. der Stern's own tables are untouched, and `public.products` is reached
through `supabase.schema('public')` from the same client.

---

## Step 2 — Verifier

Do this before touching any API.

```bash
npm install
npm test        # tsx shared/verifier.test.ts
```

Expect `26 passed, 0 failed`. The fixture is Bon 43413 from Rechnung
26-008-6253214, which reconciles to 142,46 exactly. It covers the cases that
actually bite:

| Case | Line |
|---|---|
| Three-decimal prices, half-up rounding | `13 × 0,625 = 8,13` |
| Karton times inner count | `3 KTK × 6 DS × 2,890 = 52,02` |
| Weighed goods | `1 × 2,035 kg × 3,490 = 7,10` |
| Storno / credit lines | `12- × 0,680 = 8,16-` |
| Pfand excluded from the Warenwert | — |
| A single corrupted digit failing the whole report | — |

Plus half-away-from-zero on negatives (`toFixed` gets `-8,125` wrong), binary
float noise (`2,675` is stored as `2,674999…`), and the two-pass comparison.

The four lines above are the documented ones from the real Bon; the rest of the
fixture fills the Bon out to its printed total. Swapping in the actual scan is a
drop-in — the assertions read from the fixture, except 142,46 itself, which is
the number on the paper.

This file is worth more than the AI part. It is what makes a photo trustworthy.

---

## Step 3 — Extraction function

```bash
npm run sync:verifier            # copies shared/verifier.ts into supabase/functions/_shared/
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy extract-invoice
```

Uses the existing Anthropic key — same account Career-Ops runs on, so it is usage
on a bill you already have.

**Re-run `npm run sync:verifier` after any edit to `shared/verifier.ts`**, or the
deployed function will be checking arithmetic that the tests no longer cover.

Test against an invoice you have already reconciled by hand:

```bash
curl -X POST "$SUPABASE_URL/functions/v1/extract-invoice" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "content-type: application/json" \
  -d '{"invoice_id":"<uuid>"}'
```

Success looks like `{"ok":true,"lines":103,"warenwert":1300.78}`. If the Warenwert
does not match the paper, stop and fix before going further.

A failure returns `{"ok":false,"status":"needs_rescan","rescan_pages":[3],...}`
and the invoice is marked `needs_rescan`. No lines are written.

### One deviation from the spec: no `temperature: 0`

Sampling parameters were removed on this model generation — sending
`temperature: 0` to `claude-sonnet-5` is a 400, not a no-op. The two passes are
therefore two *independent* readings rather than two forced-identical ones.

This does not weaken the check; it strengthens it. At temperature 0 a confidently
mis-read digit reads the same way twice and sails through the comparison. Two
independent readings disagree exactly where the paper is genuinely ambiguous,
which is what the comparison is there to catch.

What holds the extraction to the paper instead of a sampling parameter:

- A **forced tool call with a strict schema** — the model cannot answer in prose,
  cannot invent a field, and cannot omit one.
- **Every numeric field nullable**, so "I cannot read this" has somewhere to go
  other than a plausible guess.
- The **verifier**, which does not care how the numbers were produced.

Effort is set to `medium` in `extract-invoice/index.ts`. Raise it to `high` if a
supplier's layout proves hard; that is the knob to reach for, not temperature.

---

## Step 4 — Review screen

`src/InvoiceReview.tsx` is wired to `src/pages/InvoicesPage.tsx` and styled in der
Stern's brand green — not placeholders. It reads articles through
`ARTICLES_TABLE` in `src/lib/supabase.ts`; if the articles live somewhere other
than `public.products`, that constant and the `Article` type in `src/types.ts` are
the only two things to change.

```bash
cp .env.example .env    # VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev             # http://localhost:5173
npm run build
```

The `ANTHROPIC_API_KEY` never appears in a `VITE_` variable — anything with that
prefix is shipped to the browser in plain text. It lives only in the edge
function's secrets.

The screen shows, per line: what the invoice printed, which article it maps to,
the current EK price, the new one, and the delta. Unchanged lines are hidden
behind "Nur Änderungen". A line with no mapping is never pre-selected.

---

## Step 5 — Backfill the mappings

The mapping table is what removes the daily work, so fill it from invoices you
have already checked. Run the last few weeks of Hamberger and Gemex through the
function and link the articles once each. A mapping is saved the moment you
confirm it — you do not have to approve the invoice for the learning to stick,
and every other line on the invoice with the same Artikel-Nr follows immediately.

After that, new-article prompts approach zero and the morning job is: photograph,
glance, approve.

---

## How a bad photo is caught

1. **Two passes.** The same photos go to Claude twice. A smudged digit read two
   different ways shows up as a conflict.
2. **Line arithmetic.** `a_kolli × inh_kolli × menge × preis = betrag` on every line.
3. **Bon subtotals.** Hamberger prints them; they must match.
4. **Warenwert.** All goods lines must sum to the printed total.

Any failure sets `status = needs_rescan` and returns the page numbers to re-shoot.
Bad numbers never reach the review screen.

Keep using CamScanner before upload — its deskew and contrast are doing real work,
and the fold line through the middle of a folded invoice is exactly the kind of
thing that degrades a raw phone photo.

---

## Cost

Sonnet 5 is **$2 / $10** per million tokens on the introductory rate, which runs
**through 2026-08-31**; after that it is $3 / $15, so the figures below rise by
about half. A page photo is roughly 1,600 input tokens.

| | |
|---|---|
| 5-page Hamberger invoice, both passes | ~$0.12 |
| 1-page Gemex Lieferschein, both passes | ~$0.03 |
| Three suppliers daily | ~$5 / month |

Storage for a few hundred photos a month is negligible on the existing Supabase
plan.

If you ever want to drop the API cost, swap a local OCR model (docling,
PaddleOCR on the Hetzner box) in behind the same interface — `extractOnce()` in
`extract-invoice/index.ts` is the only thing that would change. The verifier will
tell you immediately whether the free extractor is good enough, because it either
reconciles to the printed Warenwert or it does not. You measure it instead of
gambling on it.

---

## Two things to hold to

**Join on Artikel-Nr, never on name.** 225407 stays 225407 while the name flips
between "Butter Bohnen" and "Monte Castello". Every mapping bug in the manual
process came from names. `comparePasses` does not even compare descriptions.

**Never auto-apply.** The model transcribes, arithmetic verifies, you decide.
Same boundary as the trading rule.

---

## Known limits

- A line whose `betrag` is printed but whose `preis` is missing cannot be
  verified. The extractor returns null rather than back-computing it, and the
  verifier flags it — a back-computed price always reconciles and therefore
  proves nothing.
- Weighed goods drift by design — invoices bill 2,545 kg where a list says 3 kg.
  That is a stock-count question, not a price question, and this tool reports it
  without trying to resolve it.
- `public.products.ek_price` is `numeric(10,2)`, so three-decimal supplier prices
  such as 0,625 round to 0,63 on the way in. Small, but systematic on
  high-volume articles. The review screen shows the rounding on every affected
  line, and `price_applications.invoice_price` keeps the unrounded figure.
- Applying a price writes `products.ek_price` only. der Stern additionally
  cascades an EK change to `order_items` on Pending/Processing orders; this app
  does not. Prices applied here take effect on new orders.
- The unit a price refers to is whatever the supplier prints per unit for that
  Artikel-Nr — for `3 KTK × 6 DS × 2,890` that is 2,890 per DS. The mapping is
  per supplier article number, so this stays consistent per supplier, but the
  full quantity breakdown is shown on every line so it is visible before you
  approve.
