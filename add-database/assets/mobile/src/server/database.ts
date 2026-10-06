import { neon, Pool } from '@neondatabase/serverless';

/**
 * Postgres access for API routes. Server-only: import it from
 * `src/app/**\/*+api.ts` routes, never from screens.
 *
 * Routes run on Cloudflare Workers, which can't keep a connection between
 * requests, so nothing here is created at module level.
 */

function connectionString() {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error('DATABASE_URL is not configured');
  return value;
}

/**
 * One query over HTTP. Each call is one Workers subrequest (10 per request on
 * the EAS Free plan), so use `withPool` when a request runs several queries.
 */
export function sql() {
  return neon(connectionString());
}

/**
 * A pool over one WebSocket for several queries or a transaction. Created for
 * this request and closed before the route returns.
 */
export async function withPool<T>(work: (pool: Pool) => Promise<T>) {
  const pool = new Pool({ connectionString: connectionString() });
  try {
    return await work(pool);
  } finally {
    await pool.end();
  }
}
