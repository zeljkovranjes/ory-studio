/** Shared Postgres pool + one-time schema initialization for studio tables. */

import { Pool } from "pg";

declare global {
  var __studioPool: Pool | undefined;
  var __studioSchemaReady: Map<string, Promise<void>> | undefined;
}

export function getPool(): Pool {
  if (!globalThis.__studioPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not configured");
    }
    globalThis.__studioPool = new Pool({
      connectionString,
      max: 8,
      connectionTimeoutMillis: 4000,
    });
  }
  return globalThis.__studioPool;
}

/** Run a schema-init function exactly once per key, retrying on failure. */
export function ensureOnce(key: string, init: () => Promise<void>): Promise<void> {
  if (!globalThis.__studioSchemaReady) {
    globalThis.__studioSchemaReady = new Map();
  }
  const cache = globalThis.__studioSchemaReady;
  let p = cache.get(key);
  if (!p) {
    p = init().catch((err) => {
      cache.delete(key);
      throw err;
    });
    cache.set(key, p);
  }
  return p;
}
