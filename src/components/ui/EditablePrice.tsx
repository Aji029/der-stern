import React, { useState, useEffect, useRef } from 'react';
import { Check, X, History, Loader } from 'lucide-react';
import { Button } from './Button';
import { formatPrice } from '../../utils/priceCalculations';
import { PriceHistoryPopup } from './PriceHistoryPopup';
import { usePriceHistory } from '../../hooks/usePriceHistory';
import { useCustomerProductPrice } from '../../hooks/useCustomerProductPrice';

interface EditablePriceProps {
  value: number;
  onChange: (value: number) => void;
  onCancel?: () => void;
  label?: string;
  customerId?: string;
  customerName?: string;
  productId?: string;
  productDefaultVK?: number;
  isVK?: boolean;
  isLoading?: boolean;
}

export function EditablePrice({
  value = 0,
  onChange,
  onCancel,
  label,
  customerId,
  customerName,
  productId,
  productDefaultVK,
  isVK = false,
  isLoading = false,
}: EditablePriceProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());
  const [showHistory, setShowHistory] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Price history (all orders for this product)
  const { history, isLoading: isHistoryLoading } = usePriceHistory(productId || '');

  // Customer-specific default VK (only when isVK + customer + product are provided)
  const {
    customVK,
    isLoading: isCustomerVKLoading,
    isSaving,
    saveCustomVK,
  } = useCustomerProductPrice(
    isVK && customerId && productId ? customerId : undefined,
    isVK && customerId && productId ? productId : undefined,
  );

  useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSave = () => {
    const newValue = parseFloat(tempValue);
    if (!isNaN(newValue) && newValue >= 0) {
      onChange(newValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setTempValue(value.toString());
    setIsEditing(false);
    onCancel?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  // Apply the customer default VK to the current field
  const handleApplyCustomerVK = () => {
    if (customVK !== null && customVK !== undefined) {
      onChange(customVK);
      setShowHistory(false);
    }
  };

  // Save current value as customer default
  const handleSaveAsCustomerVK = () => {
    saveCustomVK(value);
  };

  // Show the popup toggle button only for VK fields with a productId
  const showHistoryButton = isVK && productId;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-2">
        <Loader className="h-4 w-4 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isEditing) {
    return (
      <div className="relative" ref={containerRef}>
        <div
          className="cursor-pointer hover:bg-gray-50 px-4 py-3 rounded-xl border-2 border-gray-300 flex items-center justify-between group min-h-[48px] active:scale-95 transition-all"
          onClick={() => setIsEditing(true)}
        >
          <span className="font-medium">{formatPrice(value)}</span>
          {showHistoryButton && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHistory(!showHistory);
              }}
              className="ml-2 text-gray-400 group-hover:text-blue-600 transition-colors p-1"
              title="View price info & customer default"
            >
              <History className="h-5 w-5" />
            </button>
          )}
        </div>

        {showHistory && (
          <PriceHistoryPopup
            history={history}
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
            customerVK={customVK}
            isCustomerVKLoading={isCustomerVKLoading}
            isSaving={isSaving}
            productVK={productDefaultVK}
            customerName={customerName}
            onApplyCustomerVK={customerId ? handleApplyCustomerVK : undefined}
            onSaveAsCustomerVK={customerId ? handleSaveAsCustomerVK : undefined}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <input
        ref={inputRef}
        type="number"
        step="0.01"
        min="0"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full px-4 py-3 text-base border-2 border-blue-500 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
      />
      <div className="flex gap-1.5">
        <button
          onClick={handleSave}
          className="flex-1 py-2 text-white bg-green-600 hover:bg-green-700 rounded-xl active:scale-95 transition-all min-h-[40px] flex items-center justify-center"
        >
          <Check className="h-5 w-5" />
        </button>
        <button
          onClick={handleCancel}
          className="flex-1 py-2 text-white bg-red-600 hover:bg-red-700 rounded-xl active:scale-95 transition-all min-h-[40px] flex items-center justify-center"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
