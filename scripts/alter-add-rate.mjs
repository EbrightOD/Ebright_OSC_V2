import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

try {
  await prisma.$executeRawUnsafe(`ALTER TABLE employment ADD COLUMN IF NOT EXISTS rate VARCHAR(100)`);
  console.log('Added rate column (or already exists).');
} catch (e) {
  console.error('ERR', e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
