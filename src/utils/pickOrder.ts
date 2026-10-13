// Store-walk order for Today's Pick.
//
// Both supplier groups and the articles inside them carry an optional
// pick_position. Lower numbers come first; anything without a number keeps
// its alphabetical place at the end, so the order can be filled in gradually.

export const NO_POSITION = Number.POSITIVE_INFINITY;

/**
 * The store-walk order is only used for the Hamberger cash & carry groups
 * (Hamberger Gemüse, Fleisch, Mopro, Milch, Tiefkühl, Getränke, GmbH & Co. KG).
 * Every other supplier keeps the plain alphabetical list.
 */
export function isStoreWalkSupplier(name: string | null | undefined): boolean {
  return /hamberger/i.test(name ?? '');
}

/** Sort key that keeps the Hamberger groups together in their alphabetical place. */
export const STORE_WALK_BLOCK = 'Hamberger';

export function positionOf(value: number | null | undefined): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : NO_POSITION;
}

/** Sort by position (unset last), then by name. */
export function comparePickOrder(
  aPos: number | null | undefined,
  aName: string,
  bPos: number | null | undefined,
  bName: string
): number {
  const pa = positionOf(aPos);
  const pb = positionOf(bPos);
  if (pa !== pb) return pa < pb ? -1 : 1;
  return (aName ?? '').localeCompare(bName ?? '');
}

/** Parse what the user typed into a position field: '' -> null, otherwise an integer >= 0. */
export function parsePosition(raw: string): number | null | undefined {
  const text = raw.trim();
  if (text === '') return null;
  const n = Number(text);
  if (!Number.isInteger(n) || n < 0) return undefined; // invalid
  return n;
}

/** True when a Supabase error says the pick_position column is missing (migration not run yet). */
export function isMissingPickColumn(err: any): boolean {
  const msg = String(err?.message ?? '');
  return err?.code === 'PGRST204' || err?.code === '42703' || /pick_position/i.test(msg);
}

export const MIGRATION_HINT =
  'The database does not have the pick order columns yet. ' +
  'Run supabase/migrations/20261013000000_pick_positions.sql in the Supabase SQL editor, then try again.';
