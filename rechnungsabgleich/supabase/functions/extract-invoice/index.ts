/**
 * extract-invoice — double extraction, then arithmetic.
 *
 * POST { "invoice_id": "<uuid>" }
 *   -> { ok: true,  lines: 103, warenwert: 1300.78 }
 *   -> { ok: false, status: "needs_rescan", rescan_pages: [3], summary: "..." }
 *
 * The model transcribes. It never decides anything. Every number it returns is
 * put through shared/verifier.ts before it is written, and an invoice that does
 * not reconcile to its own printed Warenwert is marked needs_rescan and never
 * reaches the review screen.
 *
 * Deploy:
 *   npm run sync:verifier
 *   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
 *   supabase functions deploy extract-invoice
 */

import Anthropic from 'npm:@anthropic-ai/sdk@0.120.0';
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  comparePasses,
  verifyInvoice,
  type InvoiceExtraction,
  type InvoiceLine,
} from '../_shared/verifier.ts';

// Named by the user, and priced for this job: a page photo is ~1,600 input
// tokens, so a 5-page invoice read twice is cents. See README for the numbers.
const MODEL = 'claude-sonnet-5';

// A 5-page Hamberger invoice runs past 100 lines; leave room for all of it.
const MAX_TOKENS = 32_000;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });

// ---------------------------------------------------------------------------
// The extraction contract
// ---------------------------------------------------------------------------

// Forced tool use with a strict schema: the model cannot answer in prose, cannot
// add fields, and cannot omit one. Every numeric field is nullable so "I could
// not read this" has somewhere to go other than a plausible guess.
const nullableNumber = { type: ['number', 'null'] } as const;

const EXTRACTION_TOOL = {
  name: 'report_invoice',
  description: 'Report every line and total read off this supplier invoice.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['invoice_no', 'invoice_date', 'bon_totals', 'warenwert', 'lines'],
    properties: {
      invoice_no: { type: ['string', 'null'], description: 'Rechnungsnummer as printed, e.g. 26-008-6253214' },
      invoice_date: { type: ['string', 'null'], description: 'Invoice date as ISO yyyy-mm-dd' },
      bon_totals: {
        type: 'array',
        description: 'Printed per-Bon subtotals. Empty array if the invoice prints none.',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['bon_nr', 'subtotal'],
          properties: {
            bon_nr: { type: 'string' },
            subtotal: { type: 'number' },
          },
        },
      },
      warenwert: {
        ...nullableNumber,
        description: 'The printed Warenwert (goods total, excluding Pfand). Null only if it is not printed or not legible.',
      },
      lines: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'page', 'bon_nr', 'pos', 'supplier_article_nr', 'description',
            'a_kolli', 'inh_kolli', 'einheit', 'menge', 'preis', 'betrag', 'is_pfand',
          ],
          properties: {
            page: { type: 'number', description: '1-based page this line was read from' },
            bon_nr: { type: ['string', 'null'] },
            pos: { type: ['number', 'null'] },
            supplier_article_nr: { type: 'string', description: "The supplier's article number as printed" },
            description: { type: 'string', description: 'Article text exactly as printed' },
            a_kolli: { ...nullableNumber, description: 'Outer quantity. NEGATIVE for a Storno line (printed as "12-")' },
            inh_kolli: { ...nullableNumber, description: 'Inner count per Kolli, e.g. 6 for "6 DS". Null if not printed' },
            einheit: { type: ['string', 'null'], description: 'KTK, DS, ST, KG …' },
            menge: { ...nullableNumber, description: 'Weighed goods only: the kg billed, e.g. 2.035. Null otherwise' },
            preis: { ...nullableNumber, description: 'Unit price with ALL printed decimals, e.g. 0.625' },
            betrag: { ...nullableNumber, description: 'Line amount as printed. NEGATIVE for a Storno line' },
            is_pfand: { type: 'boolean', description: 'True for Pfand/Leergut deposit lines' },
          },
        },
      },
    },
  },
} as const;

const SYSTEM_PROMPT = `You transcribe German wholesale invoices (Großmarkt Rechnungen, Lieferscheine). You are a transcriber, not an accountant.

Rules that matter more than anything else:

1. Report what is printed. Never compute a missing value from the others. If a line prints a Betrag but the Preis is smudged or absent, report preis as null — do NOT divide the Betrag by the quantity to fill it in. A back-computed price always "reconciles" and therefore proves nothing.
2. If a digit is not clearly legible, report null for that field rather than your best guess.
3. German number format: "1.234,56" is 1234.56 and "0,625" is 0.625. Report all decimals that are printed — a price of 0,625 is 0.625, never 0.63.
4. A trailing minus ("12-", "8,16-") is a Storno/credit. Report BOTH a_kolli and betrag as negative numbers.
5. "3 KTK x 6 DS" means a_kolli = 3, inh_kolli = 6, einheit = "KTK". Weighed goods ("2,035 kg") go in menge, with a_kolli = 1.
6. Pfand, Leergut and Kasten deposit lines: set is_pfand = true. They are not part of the Warenwert.
7. Transcribe every line item, on every page, including ones you think are duplicates.
8. Report the Artikel-Nr exactly as printed, including leading zeros. It is the only field used to identify the article.`;

function userPrompt(supplierName: string, layoutKey: string, pageCount: number): string {
  const layoutHint =
    layoutKey === 'hamberger'
      ? 'This supplier groups line items into Bons. Each Bon has a Bon number and a printed subtotal — report every one of those subtotals in bon_totals.'
      : layoutKey === 'gemex'
        ? 'This supplier prints a single-page Lieferschein with no Bon grouping. Leave bon_nr null and bon_totals empty.'
        : 'Report Bon numbers and Bon subtotals if this layout prints them; otherwise leave them null/empty.';

  return `Supplier: ${supplierName}
${pageCount === 1 ? 'One page' : `${pageCount} pages, in order`} of an invoice ${pageCount === 1 ? 'is' : 'are'} attached.

${layoutHint}

Transcribe every line item with its Artikel-Nr, quantities, unit price and line amount, plus the printed Warenwert. Use the report_invoice tool.`;
}

// ---------------------------------------------------------------------------
// Coercion — believe the schema, but not the formatting
// ---------------------------------------------------------------------------

/** "1.234,56" / "0,625" / 8.13 -> number. Anything unreadable -> null. */
function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  let text = value.trim().replace(/\s|€/g, '');
  const trailingMinus = text.endsWith('-');
  if (trailingMinus) text = text.slice(0, -1);

  // German thousands separator only if a decimal comma is also present.
  text = text.includes(',') ? text.replace(/\./g, '').replace(',', '.') : text;

  const parsed = Number(text);
  if (!Number.isFinite(parsed)) return null;
  return trailingMinus ? -parsed : parsed;
}

function toText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text === '' ? null : text;
}

function normalizeExtraction(raw: any): InvoiceExtraction {
  const lines: InvoiceLine[] = (raw?.lines ?? []).map((line: any) => ({
    page: toNumber(line?.page) ?? 1,
    bon_nr: toText(line?.bon_nr),
    pos: toNumber(line?.pos),
    supplier_article_nr: toText(line?.supplier_article_nr) ?? '',
    description: toText(line?.description) ?? '',
    a_kolli: toNumber(line?.a_kolli),
    inh_kolli: toNumber(line?.inh_kolli),
    einheit: toText(line?.einheit),
    menge: toNumber(line?.menge),
    preis: toNumber(line?.preis),
    betrag: toNumber(line?.betrag),
    is_pfand: line?.is_pfand === true,
  }));

  return {
    invoice_no: toText(raw?.invoice_no),
    invoice_date: toText(raw?.invoice_date),
    bon_totals: (raw?.bon_totals ?? [])
      .map((total: any) => ({ bon_nr: toText(total?.bon_nr) ?? '', subtotal: toNumber(total?.subtotal) }))
      .filter((total: any) => total.bon_nr !== '' && total.subtotal !== null),
    warenwert: toNumber(raw?.warenwert),
    lines,
  };
}

// ---------------------------------------------------------------------------
// Anthropic call
// ---------------------------------------------------------------------------

type PageAttachment = { base64: string; mediaType: string; path: string };

function contentBlocks(pages: PageAttachment[], text: string): any[] {
  const blocks: any[] = [];
  pages.forEach((page, index) => {
    if (page.mediaType === 'application/pdf') {
      blocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: page.base64 },
      });
    } else {
      // Label each image so `page` in the output means the same thing we do.
      blocks.push({ type: 'text', text: `--- page ${index + 1} ---` });
      blocks.push({
        type: 'image',
        source: { type: 'base64', media_type: page.mediaType, data: page.base64 },
      });
    }
  });
  blocks.push({ type: 'text', text });
  return blocks;
}

async function extractOnce(
  client: Anthropic,
  pages: PageAttachment[],
  supplierName: string,
  layoutKey: string
): Promise<InvoiceExtraction> {
  // NOTE: no `temperature`. Sampling parameters were removed on this model
  // generation and sending temperature: 0 is a 400. The two passes are
  // independent readings rather than forced-identical ones, which is what makes
  // a genuinely ambiguous digit show up as a conflict instead of a stable
  // mis-read repeated twice.
  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: SYSTEM_PROMPT,
    // Enough deliberation to read a folded digit carefully, not enough to write
    // an essay about it. Raise to 'high' if a supplier's layout proves hard.
    output_config: { effort: 'medium' },
    tools: [EXTRACTION_TOOL as any],
    tool_choice: { type: 'tool', name: 'report_invoice' },
    messages: [
      {
        role: 'user',
        content: contentBlocks(pages, userPrompt(supplierName, layoutKey, pages.length)),
      },
    ],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === 'max_tokens') {
    throw new Error(
      'The invoice was cut off before it was fully transcribed. Split it into fewer pages per upload.'
    );
  }

  const toolUse = message.content.find(
    (block: any) => block.type === 'tool_use' && block.name === 'report_invoice'
  ) as any;

  if (!toolUse) {
    const refusal = message.stop_reason === 'refusal' ? ` (${message.stop_details?.explanation ?? 'refused'})` : '';
    throw new Error(`The model returned no transcription${refusal}.`);
  }

  return normalizeExtraction(toolUse.input);
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: 'POST only' }, 405);

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) return json({ ok: false, error: 'ANTHROPIC_API_KEY is not set' }, 500);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { db: { schema: 'rechnungsabgleich' }, auth: { persistSession: false } }
  );

  let invoiceId: string;
  try {
    invoiceId = (await req.json()).invoice_id;
    if (!invoiceId) throw new Error('missing');
  } catch {
    return json({ ok: false, error: 'Body must be {"invoice_id": "<uuid>"}' }, 400);
  }

  // --- load ---------------------------------------------------------------
  const { data: invoice, error: loadError } = await supabase
    .from('invoices')
    .select('id, supplier_id, storage_paths, suppliers ( name, layout_key )')
    .eq('id', invoiceId)
    .single();

  if (loadError || !invoice) {
    return json({ ok: false, error: `Invoice ${invoiceId} not found: ${loadError?.message ?? ''}` }, 404);
  }

  const supplier = (invoice as any).suppliers as { name: string; layout_key: string } | null;
  if (!supplier) return json({ ok: false, error: 'Invoice has no supplier' }, 400);

  await supabase.from('invoices')
    .update({ status: 'extracting', extraction_error: null })
    .eq('id', invoiceId);

  const fail = async (message: string, status = 500) => {
    await supabase.from('invoices')
      .update({ status: 'failed', extraction_error: message })
      .eq('id', invoiceId);
    return json({ ok: false, error: message }, status);
  };

  try {
    // --- fetch the photos -------------------------------------------------
    const pages: PageAttachment[] = [];
    for (const path of invoice.storage_paths as string[]) {
      const { data: file, error } = await supabase.storage.from('invoices').download(path);
      if (error || !file) throw new Error(`Could not read ${path}: ${error?.message ?? 'no file'}`);

      const bytes = new Uint8Array(await file.arrayBuffer());
      // Chunked so a multi-megabyte scan does not blow the argument limit.
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      pages.push({
        base64: btoa(binary),
        mediaType: file.type || guessMediaType(path),
        path,
      });
    }

    // --- two independent readings ----------------------------------------
    const client = new Anthropic({ apiKey: anthropicKey });
    const [passA, passB] = await Promise.all([
      extractOnce(client, pages, supplier.name, supplier.layout_key),
      extractOnce(client, pages, supplier.name, supplier.layout_key),
    ]);

    // --- arithmetic -------------------------------------------------------
    const conflicts = comparePasses(passA, passB);
    const report = verifyInvoice(passA, conflicts);

    // A failed report is written down but never turned into lines to approve.
    if (!report.ok) {
      await supabase.from('invoices').update({
        status: 'needs_rescan',
        warenwert_printed: passA.warenwert,
        warenwert_computed: report.warenwert.computed,
        rescan_pages: report.rescanPages,
        verification: report,
        extracted_at: new Date().toISOString(),
        invoice_no: passA.invoice_no,
        invoice_date: passA.invoice_date,
      }).eq('id', invoiceId);

      return json({
        ok: false,
        status: 'needs_rescan',
        rescan_pages: report.rescanPages,
        summary: report.summary,
      });
    }

    // --- resolve articles from the mapping table --------------------------
    const { data: mappings } = await supabase
      .from('article_mappings')
      .select('supplier_article_nr, article_id')
      .eq('supplier_id', invoice.supplier_id);

    const mapped = new Map<string, string>(
      (mappings ?? []).map((m: any) => [m.supplier_article_nr, m.article_id])
    );

    // --- write ------------------------------------------------------------
    // Re-extraction replaces the previous reading wholesale; nothing is merged.
    await supabase.from('invoice_lines').delete().eq('invoice_id', invoiceId);

    const rows = passA.lines.map(line => ({
      invoice_id: invoiceId,
      page: line.page,
      bon_nr: line.bon_nr,
      pos: line.pos,
      supplier_article_nr: line.supplier_article_nr,
      description: line.description,
      a_kolli: line.a_kolli,
      inh_kolli: line.inh_kolli,
      einheit: line.einheit,
      menge: line.menge,
      preis: line.preis,
      betrag: line.betrag,
      is_pfand: line.is_pfand ?? false,
      line_ok: true,
      line_issue: null,
      article_id: mapped.get(line.supplier_article_nr) ?? null,
    }));

    for (let i = 0; i < rows.length; i += 200) {
      const { error } = await supabase.from('invoice_lines').insert(rows.slice(i, i + 200));
      if (error) throw new Error(`Could not save lines: ${error.message}`);
    }

    await supabase.from('invoices').update({
      status: 'review',
      invoice_no: passA.invoice_no,
      invoice_date: passA.invoice_date,
      warenwert_printed: passA.warenwert,
      warenwert_computed: report.warenwert.computed,
      rescan_pages: [],
      verification: report,
      extraction_error: null,
      extracted_at: new Date().toISOString(),
    }).eq('id', invoiceId);

    return json({ ok: true, lines: rows.length, warenwert: report.warenwert.computed });
  } catch (error) {
    return await fail((error as Error).message ?? 'Extraction failed');
  }
});

function guessMediaType(path: string): string {
  const extension = path.split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  return 'image/jpeg';
}
