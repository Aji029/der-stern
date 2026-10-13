import { useCallback, useState } from 'react';
import { useProducts } from '../../../context/ProductContext';
import { useSuppliers } from '../../../context/SupplierContext';
import { updateProductPickPosition } from '../../../lib/db/products';
import { updateSupplierPickPositions } from '../../../lib/db/suppliers';
import { comparePickOrder, isMissingPickColumn, isStoreWalkSupplier, MIGRATION_HINT } from '../../../utils/pickOrder';

/**
 * Store-walk order for Today's Pick.
 *
 * Positions live in the database (products.pick_position and
 * suppliers.pick_position) so every device shows the same order. Both writes
 * are optimistic: the list re-sorts immediately and reverts if the save fails.
 */
export function usePickOrder() {
  const { products, patchPickPosition } = useProducts();
  const { suppliers, patchPickPositions } = useSuppliers();
  const [isSaving, setIsSaving] = useState(false);

  const toUserError = (err: any, fallback: string) =>
    new Error(isMissingPickColumn(err) ? MIGRATION_HINT : (err?.message || fallback));

  /** Give one article its place on the walk. null clears it. */
  const setArticlePosition = useCallback(async (artikelNr: string, position: number | null) => {
    const previous = products.find(p => p.artikelNr === artikelNr)?.pickPosition ?? null;
    patchPickPosition(artikelNr, position);
    try {
      await updateProductPickPosition(artikelNr, position);
    } catch (err: any) {
      patchPickPosition(artikelNr, previous);
      throw toUserError(err, 'Could not save the position.');
    }
  }, [products, patchPickPosition]);

  /**
   * Move the Hamberger group shown at `index` one step up (-1) or down (+1).
   * `displayedIds` are the Hamberger supplier ids in the order currently on
   * screen. Works on all Hamberger suppliers so groups that have no orders
   * today keep their place, then renumbers them 1..n and saves what changed.
   * Other suppliers are never touched.
   */
  const moveSupplierGroup = useCallback(async (displayedIds: string[], index: number, dir: -1 | 1) => {
    const a = displayedIds[index];
    const b = displayedIds[index + dir];
    if (!a || !b) return;

    const full = suppliers
      .filter(s => isStoreWalkSupplier(s.companyName))
      .sort((x, y) => comparePickOrder(x.pickPosition, x.companyName ?? '', y.pickPosition, y.companyName ?? ''));
    const ia = full.findIndex(s => s.id === a);
    const ib = full.findIndex(s => s.id === b);
    if (ia < 0 || ib < 0) return;
    [full[ia], full[ib]] = [full[ib], full[ia]];

    const current = new Map(suppliers.map(s => [s.id, s.pickPosition ?? null]));
    const changes = full
      .map((s, i) => ({ id: s.id, position: i + 1 }))
      .filter(c => current.get(c.id) !== c.position);
    if (changes.length === 0) return;
    const previous = changes.map(c => ({ id: c.id, position: current.get(c.id) ?? null }));

    setIsSaving(true);
    patchPickPositions(changes);
    try {
      await updateSupplierPickPositions(changes);
    } catch (err: any) {
      patchPickPositions(previous);
      throw toUserError(err, 'Could not save the supplier order.');
    } finally {
      setIsSaving(false);
    }
  }, [suppliers, patchPickPositions]);

  return { setArticlePosition, moveSupplierGroup, isSaving };
}
