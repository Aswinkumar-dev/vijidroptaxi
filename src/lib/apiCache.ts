/**
 * Simple in-memory API cache for Next.js API routes.
 *
 * Lives at module scope — persists across requests within the same
 * Node.js server process. Entries expire after `ttlMs` milliseconds.
 *
 * On Vercel/serverless the cache is per-function-instance, so it helps
 * most within a single session. The browser-side Cache-Control headers
 * complement this for back-navigation speed.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const store = new Map<string, CacheEntry<any>>();

/**
 * Retrieve a cached value. Returns `undefined` if missing or expired.
 */
export function getCache<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

/**
 * Store a value in the cache with a TTL.
 * @param key    Cache key
 * @param value  Value to cache
 * @param ttlMs  Time-to-live in milliseconds (default 15 000ms = 15s)
 */
export function setCache<T>(key: string, value: T, ttlMs = 15_000): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Delete one or more cache entries whose keys start with the given prefix.
 * Pass the full key to delete a single entry, or a prefix to bust a group.
 */
export function invalidateCache(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) {
      store.delete(key);
    }
  }
}
