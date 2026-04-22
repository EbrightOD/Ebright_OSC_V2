import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

try {
  const employees = await prisma.users.findMany({
    where: { user_profile: { isNot: null }, employment: { some: {} } },
    include: {
      user_profile: true,
      employment: { include: { branch: true, department: true }, orderBy: { start_date: 'desc' }, take: 1 },
    },
    orderBy: { created_at: 'desc' },
  });
  console.log('Employee rows:', employees.length);
  const branches = await prisma.branch.count();
  const depts = await prisma.department.count();
  console.log('Branches:', branches, 'Depts:', depts);
} catch (e) {
  console.error('ERR', e.message);
} finally {
  await prisma.$disconnect();
}
