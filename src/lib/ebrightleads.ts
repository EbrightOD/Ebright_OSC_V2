import "server-only";
import { Pool, type QueryResult, type QueryResultRow } from "pg";

type PoolCacheEntry = { signature: string; pool: Pool };
const globalForPool = globalThis as unknown as {
  __ebrightleads_pool?: PoolCacheEntry;
};

function configSignature(): string {
  return [
    process.env.EBRIGHTLEADS_HOST ?? "",
    process.env.EBRIGHTLEADS_PORT ?? "",
    process.env.EBRIGHTLEADS_USER ?? "",
    process.env.EBRIGHTLEADS_PASSWORD ?? "",
    process.env.EBRIGHTLEADS_DATABASE ?? "",
  ].join("|");
}

function makePool(): Pool {
  const host = process.env.EBRIGHTLEADS_HOST;
  const database = process.env.EBRIGHTLEADS_DATABASE;
  if (!host || !database) {
    throw new Error(
      `EBRIGHTLEADS_* env vars missing (host=${host ?? "undefined"}, database=${database ?? "undefined"}). Restart dev server after editing .env.`,
    );
  }
  return new Pool({
    host,
    port: parseInt(process.env.EBRIGHTLEADS_PORT || "5433", 10),
    user: process.env.EBRIGHTLEADS_USER,
    password: process.env.EBRIGHTLEADS_PASSWORD,
    database,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });
}

function getPool(): Pool {
  const signature = configSignature();
  const cached = globalForPool.__ebrightleads_pool;
  if (cached && cached.signature === signature) {
    return cached.pool;
  }
  if (cached) {
    cached.pool.end().catch(() => {});
  }
  const pool = makePool();
  if (process.env.NODE_ENV !== "production") {
    globalForPool.__ebrightleads_pool = { signature, pool };
  }
  return pool;
}

export async function queryEbrightLeads<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  try {
    return (await getPool().query(sql, params as never)) as QueryResult<T>;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[ebrightleads] Query error:", msg);
    throw new Error(`Failed to query ebrightleads_db: ${msg}`);
  }
}

export type StaffMovementFilter =
  | "onboarding"
  | "offboarding"
  | "recent_join"
  | "active";

export interface StaffMovementRow {
  id: number;
  name: string;
  position: string;
  department_branch: string;
  start_date: Date;
  end_date: Date | null;
}

export async function getStaffMovements(filters?: {
  type?: StaffMovementFilter;
}): Promise<StaffMovementRow[]> {
  let sql =
    "SELECT id, name, position, department_branch, start_date, end_date FROM hr_staff_movements WHERE 1=1";

  if (filters?.type === "onboarding") {
    sql += " AND start_date > NOW()";
  } else if (filters?.type === "offboarding") {
    sql += " AND end_date > NOW() AND end_date <= NOW() + INTERVAL '30 days'";
  } else if (filters?.type === "recent_join") {
    sql +=
      " AND start_date >= NOW() - INTERVAL '30 days' AND start_date <= NOW()";
  } else if (filters?.type === "active") {
    sql += " AND (end_date IS NULL OR end_date > NOW())";
  }

  sql += " ORDER BY start_date ASC LIMIT 1000";

  const result = await queryEbrightLeads<StaffMovementRow>(sql);
  return result.rows;
}

export async function closePool(): Promise<void> {
  const cached = globalForPool.__ebrightleads_pool;
  if (cached) {
    await cached.pool.end();
    globalForPool.__ebrightleads_pool = undefined;
  }
}
