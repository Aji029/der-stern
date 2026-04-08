import { useState, useEffect, useCallback, useMemo } from 'react';
import type { OrderItem } from '../../../types/order';

/**
 * Persists which articles have been "picked" for a given date.
 * State is stored in localStorage under `der-stern-picked-{date}`, so it:
 *  - survives page refresh
 *  - resets automatically when the date changes (different key)
 *  - requires zero network calls
 *
 * NOTE: Uses direct useState + useEffect instead of useLocalStorage because
 * React's useState initializer only runs ONCE on mount — useLocalStorage does
 * NOT re-read from storage when the key prop changes between renders.
 */
export function usePickedItems(selectedDate: string) {
  const storageKey = `der-stern-picked-${selectedDate}`;

  // Read initial value from localStorage for the current date
  const [pickedArr, setPickedArr] = useState<string[]>(() => {
    try {
      const item = window.localStorage.getItem(storageKey);
      const parsed = item ? JSON.parse(item) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // When selectedDate changes → re-read from localStorage for the new date key.
  // This is the critical fix: useState initializer only runs once on mount, so
  // a key change requires an explicit useEffect to sync state with the new key.
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(storageKey);
      const parsed = item ? JSON.parse(item) : [];
      setPickedArr(Array.isArray(parsed) ? parsed : []);
    } catch {
      setPickedArr([]);
    }
  }, [storageKey]);

  // Keep localStorage in sync whenever the array changes
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(pickedArr));
    } catch {
      // localStorage unavailable (private mode, quota exceeded, etc.) — silently ignore
    }
  }, [storageKey, pickedArr]);

  // Set for O(1) lookups during render — rebuilt only when the stored array changes
  const pickedItems = useMemo(() => new Set(pickedArr), [pickedArr]);

  /** Toggle a single article picked / un-picked */
  const toggleItem = useCallback((artikelNr: string) => {
    setPickedArr(prev => {
      const next = new Set(prev);
      next.has(artikelNr) ? next.delete(artikelNr) : next.add(artikelNr);
      return Array.from(next);
    });
  }, []);

  /** Mark every item in a supplier group as picked */
  const markAllForSupplier = useCallback((items: OrderItem[]) => {
    setPickedArr(prev => {
      const next = new Set(prev);
      items.forEach(item => item.product?.artikelNr && next.add(item.product.artikelNr));
      return Array.from(next);
    });
  }, []);

  /** Remove all picks for a supplier group */
  const unmarkAllForSupplier = useCallback((items: OrderItem[]) => {
    setPickedArr(prev => {
      const next = new Set(prev);
      items.forEach(item => item.product?.artikelNr && next.delete(item.product.artikelNr));
      return Array.from(next);
    });
  }, []);

  /** Reset all picks for the selected date */
  const clearAll = useCallback(() => setPickedArr([]), []);

  return {
    pickedItems,
    toggleItem,
    markAllForSupplier,
    unmarkAllForSupplier,
    clearAll,
  };
}
