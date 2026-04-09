import { useState, useEffect, useCallback } from 'react';
import type { OrderItem } from '../../../types/order';

/**
 * Persists which articles have been "picked" for a given date.
 * State is stored in localStorage under `der-stern-picked-{date}`, so it:
 *  - survives page refresh
 *  - resets automatically when the date changes (different key)
 *  - requires zero network calls
 *
 * Design notes:
 *  - State is Set<string> directly — no intermediate array, no useMemo overhead.
 *  - Re-reads from localStorage via useEffect([storageKey]) when the date changes.
 *  - Writes happen synchronously INSIDE each callback — no separate write effect,
 *    no timing races, no stale-key issues.
 *  - Callbacks depend on [storageKey] so they always write to the correct date slot.
 */

const readStorage = (key: string): Set<string> => {
  try {
    const raw = window.localStorage.getItem(key);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const writeStorage = (key: string, items: Set<string>): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify([...items]));
  } catch {
    // localStorage unavailable (private mode, quota exceeded, etc.) — silently ignore
  }
};

export function usePickedItems(selectedDate: string) {
  const storageKey = `der-stern-picked-${selectedDate}`;

  // Read initial value from localStorage for the current (mount-time) date.
  const [picked, setPicked] = useState<Set<string>>(() => readStorage(storageKey));

  // When selectedDate changes → re-read from localStorage for the new date key.
  useEffect(() => {
    setPicked(readStorage(storageKey));
  }, [storageKey]);

  /** Toggle a single article picked / un-picked */
  const toggleItem = useCallback((artikelNr: string) => {
    setPicked(prev => {
      const next = new Set(prev);
      next.has(artikelNr) ? next.delete(artikelNr) : next.add(artikelNr);
      writeStorage(storageKey, next);
      return next;
    });
  }, [storageKey]);

  /** Mark every item in a supplier group as picked */
  const markAllForSupplier = useCallback((items: OrderItem[]) => {
    setPicked(prev => {
      const next = new Set(prev);
      items.forEach(item => item.product?.artikelNr && next.add(item.product.artikelNr));
      writeStorage(storageKey, next);
      return next;
    });
  }, [storageKey]);

  /** Remove all picks for a supplier group */
  const unmarkAllForSupplier = useCallback((items: OrderItem[]) => {
    setPicked(prev => {
      const next = new Set(prev);
      items.forEach(item => item.product?.artikelNr && next.delete(item.product.artikelNr));
      writeStorage(storageKey, next);
      return next;
    });
  }, [storageKey]);

  /** Reset all picks for the selected date */
  const clearAll = useCallback(() => {
    const empty = new Set<string>();
    setPicked(empty);
    writeStorage(storageKey, empty);
  }, [storageKey]);

  return {
    pickedItems: picked,
    toggleItem,
    markAllForSupplier,
    unmarkAllForSupplier,
    clearAll,
  };
}
