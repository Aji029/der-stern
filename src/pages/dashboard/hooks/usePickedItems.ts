import { useMemo, useCallback } from 'react';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import type { OrderItem } from '../../../types/order';

/**
 * Persists which articles have been "picked" for a given date.
 * State is stored in localStorage under `der-stern-picked-{date}`, so it:
 *  - survives page refresh
 *  - resets automatically when the date changes (different key)
 *  - requires zero network calls
 */
export function usePickedItems(selectedDate: string) {
  const storageKey = `der-stern-picked-${selectedDate}`;
  const [pickedArr, setPickedArr] = useLocalStorage<string[]>(storageKey, []);

  // Set for O(1) lookups during render — rebuilt only when the stored array changes
  const pickedItems = useMemo(() => new Set(pickedArr), [pickedArr]);

  /** Toggle a single article picked / un-picked */
  const toggleItem = useCallback((artikelNr: string) => {
    setPickedArr(prev => {
      const next = new Set(prev);
      next.has(artikelNr) ? next.delete(artikelNr) : next.add(artikelNr);
      return Array.from(next);
    });
  }, [setPickedArr]);

  /** Mark every item in a supplier group as picked */
  const markAllForSupplier = useCallback((items: OrderItem[]) => {
    setPickedArr(prev => {
      const next = new Set(prev);
      items.forEach(item => item.product?.artikelNr && next.add(item.product.artikelNr));
      return Array.from(next);
    });
  }, [setPickedArr]);

  /** Remove all picks for a supplier group */
  const unmarkAllForSupplier = useCallback((items: OrderItem[]) => {
    setPickedArr(prev => {
      const next = new Set(prev);
      items.forEach(item => item.product?.artikelNr && next.delete(item.product.artikelNr));
      return Array.from(next);
    });
  }, [setPickedArr]);

  /** Reset all picks for the selected date */
  const clearAll = useCallback(() => setPickedArr([]), [setPickedArr]);

  return {
    pickedItems,
    toggleItem,
    markAllForSupplier,
    unmarkAllForSupplier,
    clearAll,
  };
}
