# Rechnungsabgleich — invoice price reconciliation for der Stern

Photograph the invoice, get a list of what changed, tap approve.

The design principle throughout: **extraction is the model's job, verification is
arithmetic's job, mapping decisions are yours.**

This app is **read-only against der Stern.** It reads `public.products` to match
articles and never writes to it. Confirming a price records it here, in this
app's own tables — der Stern is not modified, no trigger fires, and no open
order moves. Nothing about running this can disturb the live shop.

---

## Files

```
db/001_schema.sql                          Supabase tables
shared/verifier.ts                         pure arithmetic — the safety net
shared/verifier.test.ts                    26 tests, real Hamberger data
supabase/functions/extract-invoice/        double extraction + verify
src/InvoiceReview.tsx                      the one screen you touch daily
```

---

## Step 1 — Schema

Paste `db/001_schema.sql` into the Supabase SQL editor and run it, against the
**same project as der Stern**.

Then create a **private** Storage bucket called `invoices`.

Then add `rechnungsabgleich` under **Settings → API → Exposed schemas**.
Without this every query returns 404.

The three adaptations to der Stern are already applied in the SQL:

- **Own schema.** Tables live in `rechnungsabgleich`, not `public`. der Stern
  already owns `public.suppliers` — a bare `create table suppliers` would
  silently no-op against a table with entirely different columns, and every
  query would then fail in a confusing way.
- **`article_id` is TEXT with a real FK** to `public.products(artikel_nr)`.
  der Stern's articles have no uuid id; `artikel_nr` is the primary key.
- **RLS policies are filled in**, matching how der Stern scopes its own
  tables: signed in means allowed.

The two suppliers are seeded by the same file — no separate insert needed.

## Step 2 — Verifier (do this before touching any API)

```bash
npm i -D tsx typescript
npx tsx shared/verifier.test.ts
```

Expect `26 passed, 0 failed`. The tests use the real Bon 43413 from
Rechnung 26-008-6253214, which reconciles to 142,46 exactly. They cover the
cases that actually bite:

- `13 × 0,625 = 8,13` — three-decimal prices and half-up rounding
- `3 KTK × 6 DS × 2,890 = 52,02` — Karton times inner count
- `1 × 2,035 kg × 3,490 = 7,10` — weighed goods
- `12- × 0,680 = 8,16-` — Storno/credit lines
- Pfand excluded from the Warenwert
- a single corrupted digit failing the whole report

This file is worth more than the AI part. It is what makes a photo trustworthy.

## Step 3 — Extraction function

```bash
mkdir -p supabase/functions/_shared
cp shared/verifier.ts supabase/functions/_shared/verifier.ts

supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase functions deploy extract-invoice
```

Uses your existing Anthropic key — same account Career-Ops runs on, so it is
usage on a bill you already have, not a new subscription.

Test against an invoice you have already reconciled by hand:

```bash
curl -X POST "$SUPABASE_URL/functions/v1/extract-invoice" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "content-type: application/json" \
  -d '{"invoice_id":"<uuid>"}'
```

Success looks like `{"ok":true,"lines":103,"warenwert":1300.78}`.
A rescan looks like `{"ok":false,"needs_rescan":true,"pages":[2],"messages":[…]}`.
If `warenwert` does not match the paper, stop and fix before going further.

## Step 4 — Review screen

Already wired: `src/InvoiceReview.tsx` **reads** `public.products`
(`artikel_nr`, `name`, `ek_price`) through `sternDb()`, styled to match der
Stern. Only the articles referenced by this supplier's mappings are loaded, not
the whole product table.

Three behaviours worth knowing:

- **Confirming writes nothing to der Stern.** It records the accepted price in
  `price_change_log`, at full four-decimal precision.
- **The newest confirmed price becomes the baseline.** Otherwise the same change
  would resurface on every future invoice, since `products.ek_price` never
  moves. A row compared against a previous confirmation says so.
- Linking an article asks for *Einheiten pro Rechnungseinheit* — the
  `unit_factor`. 12 when the invoice bills a Karton and you stock the Stück.

## Step 5 — Backfill the mappings

The mapping table is what removes the daily work, so fill it from invoices you
have already checked. Run the last few weeks of Hamberger and Gemex through the
function and link the articles once each. After that, new-article prompts
approach zero and the morning job is: photograph, glance, approve.

---

## How a bad photo is caught

1. **Two passes.** The same photos go to Claude twice as independent readings.
   A smudged digit read two different ways shows up as a conflict.
   (Not `temperature: 0` — sampling parameters were removed on this model
   generation and sending one to `claude-sonnet-5` is a 400. Independent
   readings are the stronger check anyway: at temperature 0 a confidently
   misread digit reads the same way twice and sails through the comparison.)
2. **Line arithmetic.** `a_kolli × inh_kolli × preis = betrag` on every line.
3. **Bon subtotals.** Hamberger prints them; they must match.
4. **Warenwert.** All goods lines must sum to the printed total.

Any failure sets `status = needs_rescan` and returns the page numbers to
re-shoot. Bad numbers never reach the review screen.

Keep using CamScanner before upload — its deskew and contrast are doing real
work, and the fold line through the middle of a folded invoice is exactly the
kind of thing that degrades a raw phone photo.

---

## Cost

Sonnet 5 is $2 / $10 per million tokens. A page photo is roughly 1,600 input
tokens.

| | |
|---|---|
| 5-page Hamberger invoice, both passes | ~$0.12 |
| 1-page Gemex Lieferschein, both passes | ~$0.03 |
| Three suppliers daily | **~$5 / month** |

Storage for a few hundred photos a month is negligible on your existing
Supabase plan.

If you ever want to drop the API cost, swap a local OCR model (docling,
PaddleOCR on the Hetzner box) in behind the same interface. The verifier will
tell you immediately whether the free extractor is good enough, because it
either reconciles to the printed Warenwert or it does not. You measure it
instead of gambling on it.

---

## Two things to hold to

**Join on Artikel-Nr, never on name.** 225407 stays 225407 while the name flips
between "Butter Bohnen" and "Monte Castello". Every mapping bug in the manual
process came from names.

**Never auto-apply.** The model transcribes, arithmetic verifies, you decide.
Same boundary as the trading rule — and here the boundary is structural, not
just a habit: there is no code path that writes to der Stern at all.

---

## Known limits

- A line whose `betrag` is printed but whose `preis` is missing cannot be
  verified. The extractor returns null rather than back-computing it; the
  verifier will flag it.
- Weighed goods drift by design — invoices bill 2,545 kg where a list says
  3 kg. That is a stock-count question, not a price question, and this tool
  reports it without trying to resolve it.
- Prices are kept here at four decimals, so nothing is lost in this app. der
  Stern's own `ek_price` column holds two — if you transcribe a price across by
  hand, 0,625 becomes 0,63 there. Small, but systematic on high-volume articles.
- Because nothing is written back, der Stern's EK prices do not change. This
  tool tells you what the invoice says; updating the shop stays a separate,
  deliberate act.
