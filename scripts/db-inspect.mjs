import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

try {
  const [branches, depts, roles, empCount, userCount] = await Promise.all([
    prisma.branch.findMany({ select: { branch_id: true, branch_code: true, branch_name: true }, orderBy: { branch_id: 'asc' } }),
    prisma.department.findMany({ select: { department_id: true, department_code: true, department_name: true }, orderBy: { department_id: 'asc' } }),
    prisma.role.findMany({ select: { role_id: true, role_type: true }, orderBy: { role_id: 'asc' } }),
    prisma.employment.count(),
    prisma.users.count(),
  ]);
  console.log(JSON.stringify({ branches, depts, roles, empCount, userCount }, null, 2));
} catch (e) {
  console.error('ERR', e.message);
} finally {
  await prisma.$disconnect();
}
