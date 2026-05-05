import "server-only";
import { Pool, type QueryResult, type QueryResultRow } from "pg";

type PoolCacheEntry = { signature: string; pool: Pool };
const globalForPool = globalThis as unknown as {
  __ebright_hrfs_pool?: PoolCacheEntry;
};

function configSignature(): string {
  return [
    process.env.EBRIGHT_HRFS_HOST ?? "",
    process.env.EBRIGHT_HRFS_PORT ?? "",
    process.env.EBRIGHT_HRFS_USER ?? "",
    process.env.EBRIGHT_HRFS_PASSWORD ?? "",
    process.env.EBRIGHT_HRFS_DATABASE ?? "",
  ].join("|");
}

function makePool(): Pool {
  const host = process.env.EBRIGHT_HRFS_HOST;
  const database = process.env.EBRIGHT_HRFS_DATABASE;
  if (!host || !database) {
    throw new Error(
      `EBRIGHT_HRFS_* env vars missing (host=${host ?? "undefined"}, database=${database ?? "undefined"}). Restart dev server after editing .env.`,
    );
  }
  return new Pool({
    host,
    port: parseInt(process.env.EBRIGHT_HRFS_PORT || "5433", 10),
    user: process.env.EBRIGHT_HRFS_USER,
    password: process.env.EBRIGHT_HRFS_PASSWORD,
    database,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

function getPool(): Pool {
  const signature = configSignature();
  const cached = globalForPool.__ebright_hrfs_pool;
  if (cached && cached.signature === signature) {
    return cached.pool;
  }
  if (cached) {
    cached.pool.end().catch(() => {});
  }
  const pool = makePool();
  if (process.env.NODE_ENV !== "production") {
    globalForPool.__ebright_hrfs_pool = { signature, pool };
  }
  return pool;
}

export async function queryEbrightHrfs<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[],
): Promise<QueryResult<T>> {
  try {
    return (await getPool().query(sql, params as never)) as QueryResult<T>;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[ebright_hrfs] Query error:", msg);
    throw new Error(`Failed to query ebright_hrfs: ${msg}`);
  }
}
