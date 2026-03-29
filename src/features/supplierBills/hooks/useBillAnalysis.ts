import { useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Product } from '../../../types/product';
import type { BillAnalysisResult, ExtractedPriceMatch } from '../types';

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

function buildPrompt(supplierName: string, products: Product[]): string {
  const productList = products
    .map(p => `${p.artikelNr} | ${p.name} | Current EK: €${p.ekPrice.toFixed(2)}`)
    .join('\n');

  return `You are analysing a supplier invoice for ${supplierName}.

Here are all our products from this supplier:
${productList}

Extract ALL product prices from this invoice and match them to our product catalog above.
Return ONLY valid JSON with no explanation, markdown, or extra text:
{
  "matches": [
    {
      "artikelNr": "735881",
      "invoiceDescription": "Vio Wasser 18x500ml",
      "newEkPrice": 6.20,
      "confidence": "high"
    }
  ],
  "unmatched": [
    {
      "invoiceDescription": "Some product not in our catalog",
      "price": 0.00
    }
  ]
}

Rules:
- Match only by artikelNr (if visible) or product name similarity
- Use "low" confidence if you are unsure of the match
- newEkPrice must be the unit/carton price in EUR (number only, no currency symbol)
- Only include products you can find on the invoice
- If a product from the invoice is not in our catalog, add it to "unmatched"`;
}

export function useBillAnalysis() {
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [result, setResult] = useState<BillAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyse = async (
    file: File,
    supplierProducts: Product[],
    supplierName: string
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

      // Gemini supports both images and PDFs via the same inlineData API
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        },
        buildPrompt(supplierName, supplierProducts),
      ]);

      const rawText = result.response.text();

      // Extract JSON — handle any wrapping markdown code fences
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse AI response. Please try again.');
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

      const analysisResult: BillAnalysisResult = {
        matches: enrichedMatches,
        unmatched: parsed.unmatched || [],
      };

      setResult(analysisResult);
      return analysisResult;
    } catch (err: any) {
      const message =
        err?.message || 'Failed to analyse the bill. Please check your API key and try again.';
      setError(message);
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
