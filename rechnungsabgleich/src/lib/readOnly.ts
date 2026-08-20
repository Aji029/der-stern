/**
 * A read-only wrapper for der Stern's tables.
 *
 * der Stern's own RLS is the real guarantee: this app reads it through an
 * unauthenticated client, and every write policy on products, orders and
 * order_items requires `auth.role() = 'authenticated'`, so the database
 * refuses writes outright.
 *
 * This wrapper sits in front of that. Its job is to turn a mistake into a loud
 * local failure at the call site, instead of a request that silently depends on
 * a policy in another project staying the way it is today.
 */

/** Everything that could modify a row. Blocked outright. */
const WRITE_METHODS = ['insert', 'update', 'upsert', 'delete'] as const;

export class ReadOnlyViolation extends Error {
  constructor(method: string, label: string) {
    super(
      `${label}.${method}() is blocked: der Stern is read-only from this app. ` +
        `Write to Rechnungsabgleich's own project instead.`,
    );
    this.name = 'ReadOnlyViolation';
  }
}

/**
 * Wrap a PostgREST query builder so the write methods throw and everything
 * else — select, eq, in, or, order, limit, single — passes through untouched.
 */
export function readOnlyTable<T extends object>(builder: T, label: string): T {
  return new Proxy(builder, {
    get(target, prop, receiver) {
      if (typeof prop === 'string' && (WRITE_METHODS as readonly string[]).includes(prop)) {
        return () => {
          throw new ReadOnlyViolation(prop, label);
        };
      }
      const value = Reflect.get(target, prop, receiver);
      // Bind so the builder's own `this` survives the proxy.
      return typeof value === 'function' ? value.bind(target) : value;
    },
    set() {
      return false;
    },
  });
}
