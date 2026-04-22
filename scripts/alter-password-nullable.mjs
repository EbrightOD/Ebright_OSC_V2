import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

try {
  await prisma.$executeRawUnsafe(`ALTER TABLE users ALTER COLUMN password DROP NOT NULL`);
  console.log('users.password is now nullable.');
} catch (e) {
  console.error('ERR', e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
