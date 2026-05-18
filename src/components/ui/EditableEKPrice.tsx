import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Check, Loader } from 'lucide-react';
import { formatPrice } from '../../utils/priceCalculations';

interface EditableEKPriceProps {
  value: number;
  artikelNr: string;
  orderId?: string;
  onUpdate: (newPrice: number) => Promise<void>;
}

export function EditableEKPrice({ value, artikelNr, orderId, onUpdate }: EditableEKPriceProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayValue, setDisplayValue] = useState(value);
  // Track whether a save is already in-flight so onBlur doesn't double-fire
  const savingRef = useRef(false);

  useEffect(() => {
    if (!isEditing) {
      setDisplayValue(value);
      setTempValue(value.toString());
    }
  }, [value, isEditing]);

  const handleSave = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    try {
      setIsSubmitting(true);
      setError(null);
      const newPrice = parseFloat(tempValue);
      if (isNaN(newPrice) || newPrice < 0) {
        setError('Invalid price');
        return;
      }
      await onUpdate(newPrice);
      setDisplayValue(newPrice);
      setIsEditing(false);
    } catch (err: any) {
      console.error('Failed to update price:', err);
      setError(err.message || 'Save failed');
    } finally {
      setIsSubmitting(false);
      savingRef.current = false;
    }
  };

  const handleCancel = () => {
    savingRef.current = true; // prevent onBlur from saving
    setTempValue(displayValue.toString());
    setIsEditing(false);
    setError(null);
    setTimeout(() => { savingRef.current = false; }, 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
    else if (e.key === 'Escape') handleCancel();
  };

  // ── Display mode ────────────────────────────────────────────────────────────
  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md border border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 transition-colors group cursor-pointer"
        title="Tap to edit EK price"
      >
        <span className="text-sm font-bold text-gray-800 group-hover:text-blue-600 whitespace-nowrap">
          {formatPrice(displayValue)}
        </span>
        <Pencil className="h-3 w-3 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
      </button>
    );
  }

  // ── Edit mode ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          step="0.01"
          min="0"
          value={tempValue}
          onChange={e => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="w-20 px-2 py-1.5 text-sm font-semibold border-2 border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
          autoFocus
        />
        {isSubmitting ? (
          <Loader className="h-4 w-4 animate-spin text-blue-500 flex-shrink-0" />
        ) : (
          <button
            type="button"
            onMouseDown={e => e.preventDefault()} // prevent onBlur from firing before click
            onClick={handleSave}
            className="p-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors flex-shrink-0"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
