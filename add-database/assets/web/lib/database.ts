import { Pool } from "pg";

const globalForDatabase = globalThis as typeof globalThis & {
  databasePool?: Pool;
};

/**
 * The shared Postgres pool. Server-only: call it from server components,
 * server actions, and route handlers, never from client components.
 */
export function database() {
  if (globalForDatabase.databasePool) return globalForDatabase.databasePool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // `next build` imports server modules without querying. An unconnected pool
    // lets it finish without DATABASE_URL; it is not cached, so runtime still fails loudly.
    if (process.env.NEXT_PHASE === "phase-production-build") return new Pool();
    throw new Error("DATABASE_URL is not configured");
  }

  const pool = new Pool({ connectionString });
  // Reuse one pool across hot reloads in development and across requests in production.
  globalForDatabase.databasePool = pool;
  return pool;
}
