/**
 * extract-invoice
 *
 * POST { invoice_id }
 *
 * Reads the invoice's photo pages from Storage, sends them to Claude twice,
 * compares the two passes, runs the arithmetic verifier, and writes the
 * lines only if everything holds. Otherwise sets status = needs_rescan and
 * returns exactly which page and line to re-shoot.
 *
 * Deploy:
 *   supabase functions deploy extract-invoice
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import {
  verifyInvoice,
  compareExtractions,
  type RawLine,
} from '../_shared/verifier.ts';

const MODEL = 'claude-sonnet-5';
const BUCKET = 'invoices';

const SYSTEM = `You transcribe German wholesale invoices (Großmarkt Rechnungen / Lieferscheine) into JSON.

You are a transcriber, not an interpreter. Copy what is printed. Never compute a
value that is missing, never correct a value that looks wrong, never skip a line
because it looks like a duplicate — Storno/credit lines legitimately repeat an
article with a minus sign.

Column mapping for Hamberger-style layouts:
  A. Kolli   -> a_kolli    outer count. A trailing minus means a credit: use a negative number.
  Verp.      -> ignore
  Inh. Kolli -> inh_kolli  inner count, OR a weight in kg for weighed goods (e.g. 2,035)
  Einh.      -> einheit
  Preis pro Einheit -> preis   keep ALL decimals as printed (0,625 stays 0,625)
  Gesamtpreis Netto -> betrag  a trailing minus means negative
  UST        -> ust_code
  Artikel-Nr -> supplier_art_nr   (strip any trailing letter such as W)

For Lieferschein layouts with Menge / Einheit / Preis / Betrag, put Menge into
a_kolli and leave inh_kolli null.

Rules:
- German decimal commas become JSON numbers: "11,500" -> 11.5
- Section headings (Öle, Gewürze, Molkereiprodukte…) are not lines. Skip them.
- A "Bon: 43413 … Bonbetrag" row is a subtotal, not a line. Put it in bon_totals.
- Every line after a Bon subtotal belongs to the NEXT bon. Carry the current bon
  number onto each line in the "bon" field. Null if the invoice has no Bons.
- Pfand / Leergut / Pfandkisten lines: set is_leergut true.
- Description continuation on a second physical row belongs to the same line.
- If a character is genuinely unreadable, set the field to null. Do not guess.

Return ONLY this JSON object, no prose, no markdown fences:

{
  "invoice_no": string|null,
  "invoice_date": "YYYY-MM-DD"|null,
  "lines": [{
    "page_no": number, "line_no": number, "bon": string|null,
    "supplier_art_nr": string|null, "description": string,
    "a_kolli": number|null, "inh_kolli": number|null, "einheit": string|null,
    "preis": number, "betrag": number, "ust_code": string|null,
    "is_leergut": boolean
  }],
  "bon_totals": [{ "bon": string, "betrag": number }],
  "totals": { "warenwert": number|null, "endbetrag": number|null, "leergut": number|null }
}

line_no restarts at 0 on each page. Only fill "totals" from a page that actually
prints them — a page footer saying "Übertrag" means the totals continue, so leave
them null there.`;

interface ExtractResult {
  invoice_no: string | null;
  invoice_date: string | null;
  lines: RawLine[];
  bon_totals: Array<{ bon: string; betrag: number }>;
  totals: {
    warenwert: number | null;
    endbetrag: number | null;
    leergut: number | null;
  };
}

async function callClaude(
  images: Array<{ media_type: string; data: string }>,
  apiKey: string,
): Promise<ExtractResult> {
  const content: unknown[] = [];
  images.forEach((img, i) => {
    content.push({ type: 'text', text: `--- Seite ${i + 1} ---` });
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: img.media_type, data: img.data },
    });
  });
  content.push({
    type: 'text',
    text: 'Transcribe every line from every page. Return the JSON object only.',
  });

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 16000,
      // No temperature: sampling parameters were removed on this model
      // generation — sending `temperature: 0` to claude-sonnet-5 is a 400,
      // not a no-op. The two passes are independent readings instead, which
      // strengthens the consensus check rather than weakening it: at
      // temperature 0 a confidently misread digit reads the same way twice
      // and sails through the comparison, while independent readings disagree
      // exactly where the paper is genuinely ambiguous.
      system: SYSTEM,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();
  const text = data.content
    .filter((c: { type: string }) => c.type === 'text')
    .map((c: { text: string }) => c.text)
    .join('\n')
    .replace(/```json|```/g, '')
    .trim();

  return JSON.parse(text) as ExtractResult;
}

function mediaTypeFor(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  return 'image/jpeg';
}

Deno.serve(async (req) => {
  try {
    const { invoice_id } = await req.json();
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

    // This app's tables live in the `rechnungsabgleich` schema — der Stern
    // already owns public.suppliers, so the two cannot share `public`.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { db: { schema: 'rechnungsabgleich' } },
    );

    const { data: invoice, error } = await supabase
      .from('supplier_invoices')
      .select('*')
      .eq('id', invoice_id)
      .single();
    if (error || !invoice) throw new Error('Invoice not found');

    await supabase
      .from('supplier_invoices')
      .update({ status: 'extracting' })
      .eq('id', invoice_id);

    // ---- load the photos -------------------------------------------------
    const images: Array<{ media_type: string; data: string }> = [];
    for (const path of invoice.page_paths as string[]) {
      const { data: blob, error: dlErr } = await supabase.storage
        .from(BUCKET)
        .download(path);
      if (dlErr || !blob) throw new Error(`Cannot read page ${path}`);
      const buf = new Uint8Array(await blob.arrayBuffer());
      let bin = '';
      for (let i = 0; i < buf.length; i += 8192) {
        bin += String.fromCharCode(...buf.subarray(i, i + 8192));
      }
      images.push({ media_type: mediaTypeFor(path), data: btoa(bin) });
    }

    // ---- two independent passes -----------------------------------------
    const [passA, passB] = await Promise.all([
      callClaude(images, apiKey),
      callClaude(images, apiKey),
    ]);

    const consensus = compareExtractions(passA.lines, passB.lines);
    const report = verifyInvoice(
      passA.lines,
      passA.bon_totals ?? [],
      passA.totals ?? {},
    );

    const clean = consensus.agree && report.ok;

    if (!clean) {
      await supabase
        .from('supplier_invoices')
        .update({
          status: 'needs_rescan',
          verify_report: { report, consensus },
        })
        .eq('id', invoice_id);

      return Response.json({
        ok: false,
        needs_rescan: true,
        // pages worth re-shooting
        pages: [
          ...new Set([
            ...report.failed_lines.map((l) => l.page_no),
            ...consensus.conflicts.map((c) => c.page_no).filter((p) => p > 0),
          ]),
        ],
        messages: report.messages,
        conflicts: consensus.conflicts,
      });
    }

    // ---- persist ---------------------------------------------------------
    await supabase.from('invoice_lines').delete().eq('invoice_id', invoice_id);
    await supabase.from('invoice_lines').insert(
      report.lines.map((l) => ({
        invoice_id,
        page_no: l.page_no,
        line_no: l.line_no,
        bon: l.bon ?? null,
        supplier_art_nr: l.supplier_art_nr ?? null,
        description: l.description,
        a_kolli: l.a_kolli,
        inh_kolli: l.inh_kolli,
        einheit: l.einheit ?? null,
        preis: l.preis,
        betrag: l.betrag,
        ust_code: l.ust_code ?? null,
        // must be persisted: the review screen excludes Pfand from price diffs
        is_leergut: l.is_leergut ?? false,
        effective_menge: l.effective_menge,
        math_ok: l.math_ok,
      })),
    );

    await supabase
      .from('supplier_invoices')
      .update({
        status: 'verified',
        invoice_no: passA.invoice_no,
        invoice_date: passA.invoice_date,
        printed_warenwert: passA.totals?.warenwert ?? null,
        printed_endbetrag: passA.totals?.endbetrag ?? null,
        verify_report: { report, consensus },
      })
      .eq('id', invoice_id);

    return Response.json({
      ok: true,
      lines: report.lines.length,
      warenwert: report.total_check.printed,
    });
  } catch (err) {
    return Response.json(
      { ok: false, error: String(err) },
      { status: 500 },
    );
  }
});
