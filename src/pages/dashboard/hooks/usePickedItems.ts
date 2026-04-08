import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { OrderItem } from '../../../types/order';

/**
 * Persists which articles have been "picked" for a given date.
 * State is stored in localStorage under `der-stern-picked-{date}`, so it:
 *  - survives page refresh
 *  - resets automatically when the date changes (different key)
 *  - requires zero network calls
 *
 * Design notes:
 *  - Uses useState + useEffect instead of useLocalStorage because React's
 *    useState initializer only runs ONCE on mount — useLocalStorage does NOT
 *    re-read from storage when the key changes between renders.
 *  - The write effect uses a ref for the storageKey (NOT a dep) so it never
 *    closes over a stale key. Without this, changing the date would write the
 *    OLD date's picks into the NEW date's localStorage slot before the read
 *    effect corrected the state, causing stale data and potential render loops.
 *  - The read effect skips the initial mount because the useState lazy
 *    initializer already loaded the correct value for the initial storageKey.
 */
export function usePickedItems(selectedDate: string) {
  const storageKey = `der-stern-picked-${selectedDate}`;

  // Always keep a ref in sync with the current storageKey.
  // The write effect reads from this ref instead of closing over storageKey
  // directly — this prevents writing OLD picks to a NEW date's slot when the
  // date changes and pickedArr hasn't updated yet.
  const storageKeyRef = useRef(storageKey);
  storageKeyRef.current = storageKey;

  // Read initial value from localStorage for the current (mount-time) date.
  const [pickedArr, setPickedArr] = useState<string[]>(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // Skip the read effect on the very first mount: the useState initializer
  // already loaded the correct value for the initial storageKey, so running
  // the effect immediately would just cause an unnecessary extra re-render.
  const isFirstMount = useRef(true);

  // When selectedDate changes → re-read from localStorage for the new date key.
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    try {
      const stored = window.localStorage.getItem(storageKey);
      const parsed = stored ? JSON.parse(stored) : [];
      setPickedArr(Array.isArray(parsed) ? parsed : []);
    } catch {
      setPickedArr([]);
    }
  }, [storageKey]);

  // Persist picks to localStorage whenever the array changes.
  // Intentionally depends ONLY on pickedArr (not storageKey) — the ref is used
  // for the key so this effect does not fire prematurely when the date changes.
  useEffect(() => {
    try {
      window.localStorage.setItem(storageKeyRef.current, JSON.stringify(pickedArr));
    } catch {
      // localStorage unavailable (private mode, quota exceeded, etc.) — silently ignore
    }
  }, [pickedArr]); // ← no storageKey dep; ref handles the current key

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
