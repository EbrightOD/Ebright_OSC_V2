import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // Force the PG session timezone to UTC. The PG server's default is
  // Asia/Kuala_Lumpur, so without this it sends timestamptz values as
  // "...+08", which @prisma/adapter-pg's normalize_timestamptz rewrites to
  // "+00:00" *without* converting the wall clock — silently shifting every
  // read by +8h.
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    options: "-c TimeZone=UTC",
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
