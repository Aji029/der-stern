import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Product } from '../../../types/product';
import type { BillAnalysisResult, ExtractedPriceMatch, UnmatchedItem } from '../types';
import { getAliases, normalizeInvoiceText } from '../aliasStore';

// Gemini's free tier has per-minute and per-day caps. Short bursts (a few quick
// scans) trip the per-minute limit; retrying after a brief wait recovers from those.
const RETRYABLE = /RESOURCE_EXHAUSTED|rate.?limit|quota|overloaded|UNAVAILABLE|try again/i;

function isRetryable(err: any): boolean {
  const status = err?.status ?? err?.response?.status;
  return status === 429 || status === 503 || RETRYABLE.test(String(err?.message ?? ''));
}

function friendlyAiError(err: any): string {
  const msg = String(err?.message ?? '');
  const status = err?.status ?? err?.response?.status;
  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate.?limit/i.test(msg)) {
    return "The free AI limit was reached. Wait a minute and try again — if it keeps happening, you've likely used up today's free quota.";
  }
  if (status === 503 || /overloaded|UNAVAILABLE/i.test(msg)) {
    return 'The AI service is busy right now. Please try again in a moment.';
  }
  if (status === 400 || status === 401 || status === 403 || /API[_ ]?key|permission/i.test(msg)) {
    return 'There is a problem with the AI key configuration. Please check the Gemini API key in the deploy settings.';
  }
  return msg || 'Failed to analyse the bill. Please try again.';
}

async function generateWithRetry(
  model: { generateContent: (parts: any) => Promise<any> },
  parts: any,
  retries = 3
): Promise<any> {
  let lastErr: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await model.generateContent(parts);
    } catch (err) {
      lastErr = err;
      if (!isRetryable(err) || attempt === retries) throw err;
      // Backoff: 2s, 4s, 8s … (capped). The "analysing" spinner covers the wait.
      const waitMs = Math.min(2000 * 2 ** attempt, 30000);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    }
  }
  throw lastErr;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (e.g. "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function buildPrompt(
  supplierName: string,
  products: Product[],
  aliases: Record<string, string>
): string {
  // Format: artikelNr | supplierArticleNo | name — the supplier article number
  // (bestellnummer) is often printed on the invoice and is a near-exact key.
  const productList = products
    .map(p => `${p.artikelNr} | ${p.bestellnummer || '-'} | ${p.name}`)
    .join('\n');

  const aliasEntries = Object.entries(aliases);
  const aliasBlock = aliasEntries.length
    ? `\n\nPreviously CONFIRMED matches for this supplier (invoice text => our artikelNr). Trust these strongly when the invoice text is the same or very similar:\n${aliasEntries
        .map(([txt, art]) => `"${txt}" => ${art}`)
        .join('\n')}`
    : '';

  return `You are analysing a supplier invoice for ${supplierName}.

Our products from this supplier (format: artikelNr | supplierArticleNo | name):
${productList}${aliasBlock}

Extract EVERY product line item with its price from this invoice and match each one to ONE of our products above.

Matching rules, in priority order:
1. If a previously confirmed match applies, use that artikelNr.
2. If the invoice shows a supplier article number equal to our supplierArticleNo, match it — even if the product name is written differently.
3. Otherwise match by MEANING, not exact text. Treat these as the SAME product:
   - abbreviations and different word order ("Coca Cola 0,33 Dose" = "Cola 33cl can")
   - packaging / unit wording ("18x500ml" = "0,5L 18er", "Kiste" = "case")
   - brand + variant differences, accents, capitalisation, extra or missing words
   Be generous: if it is clearly the same article, match it. Use confidence "high", "medium", or "low".
4. Put an item in "unmatched" ONLY if it genuinely is not one of our products.

Return ONLY valid JSON, no markdown, no commentary:
{
  "matches": [
    { "artikelNr": "735881", "invoiceDescription": "Vio Wasser 18x500ml", "newEkPrice": 6.20, "confidence": "high" }
  ],
  "unmatched": [
    { "invoiceDescription": "Some product not in our catalog", "price": 0.00 }
  ]
}

Rules:
- "artikelNr" in every match MUST be one of ours from the list above
- newEkPrice must be the unit/carton price in EUR (number only, no currency symbol)
- Only include products you can find on the invoice`;
}

export function useBillAnalysis() {
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [result, setResult] = useState<BillAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyse = async (
    file: File,
    supplierProducts: Product[],
    supplierName: string,
    supplierId: string
  ): Promise<BillAnalysisResult | null> => {
    setIsAnalysing(true);
    setError(null);
    setResult(null);

    try {
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';

      if (!isImage && !isPDF) {
        throw new Error('Please upload an image (JPG, PNG) or PDF file.');
      }

      const base64Data = await fileToBase64(file);
      const aliases = getAliases(supplierId);

      // Gemini supports both images and PDFs via the same inlineData API
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

      const result = await generateWithRetry(model, [
        {
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        },
        buildPrompt(supplierName, supplierProducts, aliases),
      ]);

      // A quota-starved or safety-blocked call can come back with no candidates;
      // guard before reading .text() so it surfaces a clear message, not a crash.
      const response = result?.response;
      if (!response || !response.candidates || response.candidates.length === 0) {
        throw new Error(
          'The AI returned an empty response. This usually means the free limit was hit — wait a minute and try again.'
        );
      }

      const rawText = response.text();

      // Extract JSON — handle any wrapping markdown code fences
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not read the prices from this bill. Try a clearer photo or a different file.');
      }

      const parsed = JSON.parse(jsonMatch[0]) as {
        matches: { artikelNr: string; invoiceDescription: string; newEkPrice: number; confidence: string }[];
        unmatched: { invoiceDescription: string; price: number }[];
      };

      // Enrich matches with product names and current EK prices
      const enrichedMatches: ExtractedPriceMatch[] = (parsed.matches || [])
        .map(match => {
          const product = supplierProducts.find(p => p.artikelNr === match.artikelNr);
          if (!product) return null;
          return {
            artikelNr: match.artikelNr,
            productName: product.name,
            invoiceDescription: match.invoiceDescription,
            currentEkPrice: product.ekPrice,
            newEkPrice: Number(match.newEkPrice),
            confidence: (match.confidence as 'high' | 'medium' | 'low') || 'medium',
            selected: match.confidence !== 'low',
          };
        })
        .filter((m): m is ExtractedPriceMatch => m !== null);

      // Local alias recovery: catch confirmed mappings the model may have missed,
      // moving them out of "unmatched" into matches.
      const recovered: ExtractedPriceMatch[] = [];
      const stillUnmatched: UnmatchedItem[] = [];
      for (const u of (parsed.unmatched || [])) {
        const art = aliases[normalizeInvoiceText(u.invoiceDescription)];
        const product = art ? supplierProducts.find(p => p.artikelNr === art) : undefined;
        if (product && !enrichedMatches.some(m => m.artikelNr === product.artikelNr)) {
          recovered.push({
            artikelNr: product.artikelNr,
            productName: product.name,
            invoiceDescription: u.invoiceDescription,
            currentEkPrice: product.ekPrice,
            newEkPrice: Number(u.price) || product.ekPrice,
            confidence: 'high',
            selected: true,
          });
        } else {
          stillUnmatched.push(u);
        }
      }

      const analysisResult: BillAnalysisResult = {
        matches: [...enrichedMatches, ...recovered],
        unmatched: stillUnmatched,
      };

      setResult(analysisResult);
      return analysisResult;
    } catch (err: any) {
      setError(friendlyAiError(err));
      return null;
    } finally {
      setIsAnalysing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setIsAnalysing(false);
  };

  return { analyse, result, setResult, isAnalysing, error, reset };
}
