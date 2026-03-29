import React, { useRef, useState } from 'react';
import { X, Upload, Camera, FileText, Loader, CheckCircle, AlertCircle, ScanLine } from 'lucide-react';
import { useProducts } from '../../../context/ProductContext';
import { useEKPriceUpdate } from '../../../hooks/useEKPriceUpdate';
import { useBillAnalysis } from '../hooks/useBillAnalysis';
import { PriceReviewTable } from './PriceReviewTable';
import type { BillScanStep } from '../types';

interface BillScanSheetProps {
  supplierId: string;
  supplierName: string;
  onClose: () => void;
}

export function BillScanSheet({ supplierId, supplierName, onClose }: BillScanSheetProps) {
  const { products } = useProducts();
  const { updatePriceAndOrders } = useEKPriceUpdate();
  const { analyse, result, setResult, isAnalysing, error, reset } = useBillAnalysis();

  const [step, setStep] = useState<BillScanStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [appliedCount, setAppliedCount] = useState(0);
  const [applyError, setApplyError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Only products that belong to this supplier
  const supplierProducts = products.filter(p => p.supplierId === supplierId);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    reset();
    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFileSelect(dropped);
  };

  const handleAnalyse = async () => {
    if (!file) return;
    setStep('analysing');
    const analysisResult = await analyse(file, supplierProducts, supplierName);
    if (analysisResult) {
      setStep('review');
    } else {
      setStep('upload');
    }
  };

  const handleToggleItem = (artikelNr: string) => {
    if (!result) return;
    setResult({
      ...result,
      matches: result.matches.map(m =>
        m.artikelNr === artikelNr ? { ...m, selected: !m.selected } : m
      ),
    });
  };

  const handleToggleAll = (selected: boolean) => {
    if (!result) return;
    setResult({
      ...result,
      matches: result.matches.map(m => ({ ...m, selected })),
    });
  };

  const handleChangeNewPrice = (artikelNr: string, price: number) => {
    if (!result) return;
    setResult({
      ...result,
      matches: result.matches.map(m =>
        m.artikelNr === artikelNr ? { ...m, newEkPrice: price } : m
      ),
    });
  };

  const handleApply = async () => {
    if (!result) return;
    const selected = result.matches.filter(m => m.selected);
    if (selected.length === 0) return;

    setIsApplying(true);
    setApplyError(null);
    setStep('applying');

    let count = 0;
    try {
      for (const match of selected) {
        await updatePriceAndOrders(match.artikelNr, match.newEkPrice);
        count++;
      }
      setAppliedCount(count);
      setStep('done');
    } catch (err: any) {
      setApplyError(err?.message || 'Some prices could not be updated.');
      setStep('review');
    } finally {
      setIsApplying(false);
    }
  };

  const selectedCount = result?.matches.filter(m => m.selected).length ?? 0;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Sheet */}
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-yellow-500" />
            <div>
              <h2 className="font-bold text-gray-900 text-base leading-tight">Scan Supplier Bill</h2>
              <p className="text-xs text-gray-500">{supplierName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-4 py-2 bg-gray-50 border-b border-gray-100 flex-shrink-0">
          {(['upload', 'review', 'done'] as const).map((s, i) => {
            const stepLabels = ['Upload', 'Review', 'Done'];
            const stepIndex = ['upload', 'analysing', 'review', 'applying', 'done'].indexOf(step);
            const thisIndex = ['upload', 'review', 'done'].indexOf(s);
            const isDone = stepIndex > ['upload', 'analysing', 'review', 'applying', 'done'].indexOf(
              s === 'upload' ? 'analysing' : s === 'review' ? 'applying' : 'done'
            );
            const isCurrent = s === 'upload'
              ? step === 'upload' || step === 'analysing'
              : s === 'review'
              ? step === 'review' || step === 'applying'
              : step === 'done';

            return (
              <React.Fragment key={s}>
                <div className="flex items-center gap-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors ${
                    isCurrent ? 'bg-yellow-400 text-gray-900' :
                    isDone ? 'bg-green-500 text-white' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {i + 1}
                  </div>
                  <span className={`text-xs font-medium ${isCurrent ? 'text-gray-900' : 'text-gray-400'}`}>
                    {stepLabels[i]}
                  </span>
                </div>
                {i < 2 && <div className="flex-1 h-px bg-gray-200 mx-1" />}
              </React.Fragment>
            );
          })}
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-4 py-4">

          {/* STEP: upload */}
          {(step === 'upload') && (
            <div className="space-y-4">
              {supplierProducts.length === 0 && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>No products are linked to {supplierName} yet. Assign products to this supplier first for best matching results.</p>
                </div>
              )}

              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                  file ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 hover:border-yellow-300 hover:bg-yellow-50/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                {file ? (
                  <div className="space-y-2">
                    {preview ? (
                      <img src={preview} alt="Bill preview" className="max-h-40 mx-auto rounded-lg object-contain" />
                    ) : (
                      <FileText className="w-10 h-10 text-yellow-500 mx-auto" />
                    )}
                    <p className="text-sm font-medium text-gray-700 truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB · Tap to change</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-10 h-10 text-gray-300 mx-auto" />
                    <p className="text-sm font-medium text-gray-600">Drop invoice here or tap to browse</p>
                    <p className="text-xs text-gray-400">JPG, PNG, or PDF</p>
                  </div>
                )}
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />
              {/* Camera input (triggers camera on mobile) */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />

              {/* Camera shortcut button for mobile */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Camera className="w-4 h-4" />
                Take Photo with Camera
              </button>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          )}

          {/* STEP: analysing */}
          {step === 'analysing' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <ScanLine className="w-12 h-12 text-yellow-400" />
                <div className="absolute -inset-2 border-2 border-yellow-300 rounded-full animate-ping opacity-40" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-900">Reading invoice with Gemini AI…</p>
                <p className="text-sm text-gray-500 mt-1">Matching products and extracting prices</p>
              </div>
              <Loader className="w-5 h-5 text-gray-400 animate-spin" />
            </div>
          )}

          {/* STEP: review */}
          {step === 'review' && result && (
            <div className="space-y-3">
              {result.matches.length === 0 ? (
                <div className="flex flex-col items-center py-10 gap-3 text-center">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <p className="font-medium text-gray-700">No matching products found</p>
                  <p className="text-sm text-gray-500">
                    Claude couldn't match any products from this invoice to {supplierName}'s catalog.
                    Make sure products are linked to this supplier.
                  </p>
                </div>
              ) : (
                <PriceReviewTable
                  matches={result.matches}
                  unmatched={result.unmatched}
                  onToggleItem={handleToggleItem}
                  onToggleAll={handleToggleAll}
                  onChangeNewPrice={handleChangeNewPrice}
                />
              )}
              {applyError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{applyError}</p>
                </div>
              )}
            </div>
          )}

          {/* STEP: applying */}
          {step === 'applying' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader className="w-10 h-10 text-yellow-400 animate-spin" />
              <p className="font-semibold text-gray-900">Updating EK prices…</p>
              <p className="text-sm text-gray-500">Saving changes to products and open orders</p>
            </div>
          )}

          {/* STEP: done */}
          {step === 'done' && (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <CheckCircle className="w-14 h-14 text-green-500" />
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {appliedCount} price{appliedCount !== 1 ? 's' : ''} updated!
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  EK prices have been updated for {supplierName} and all open orders.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex-shrink-0 border-t border-gray-200 px-4 py-3 bg-white">
          {step === 'upload' && (
            <button
              onClick={handleAnalyse}
              disabled={!file || isAnalysing}
              className="w-full py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Analyse Bill with Gemini AI
            </button>
          )}

          {step === 'review' && result && (
            <div className="flex gap-3">
              <button
                onClick={() => { reset(); setFile(null); setPreview(null); setStep('upload'); }}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 active:scale-95 transition-all text-sm"
              >
                ← Scan Again
              </button>
              <button
                onClick={handleApply}
                disabled={selectedCount === 0 || isApplying}
                className="flex-2 px-6 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm whitespace-nowrap"
              >
                Apply {selectedCount} Change{selectedCount !== 1 ? 's' : ''}
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="flex gap-3">
              <button
                onClick={() => { reset(); setFile(null); setPreview(null); setStep('upload'); setAppliedCount(0); }}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-all text-sm"
              >
                Scan Another
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-3 bg-yellow-400 text-gray-900 font-bold rounded-xl hover:bg-yellow-500 transition-all text-sm"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
