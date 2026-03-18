import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from './Button';
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

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      const newPrice = parseFloat(tempValue);
      
      if (isNaN(newPrice) || newPrice < 0) {
        setError('Please enter a valid price');
        return;
      }

      await onUpdate(newPrice);
      setDisplayValue(newPrice);
      setIsEditing(false);
    } catch (error: any) {
      console.error('Failed to update price:', error);
      setError(error.message || 'Failed to update price');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setTempValue(displayValue.toString());
      setIsEditing(false);
      setError(null);
    }
  };

  if (!isEditing) {
    return (
      <div 
        onClick={() => setIsEditing(true)}
        className="font-bold cursor-pointer hover:text-blue-600 transition-colors"
        title="Click to edit"
      >
        {formatPrice(displayValue)}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center space-x-2">
        <input
          type="number"
          step="0.01"
          min="0"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`w-24 px-2 py-1 border rounded focus:ring-1 focus:ring-blue-500 ${
            error ? 'border-red-500' : ''
          }`}
          autoFocus
        />
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={isSubmitting}
            className="p-1 text-green-600 hover:bg-green-50"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTempValue(displayValue.toString());
              setIsEditing(false);
              setError(null);
            }}
            disabled={isSubmitting}
            className="p-1 text-red-600 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}