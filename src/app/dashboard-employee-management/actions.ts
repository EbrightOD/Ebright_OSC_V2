"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { STAFF_ROLE_ID } from "@/lib/employeeQueries";
import { titleCaseName } from "@/lib/text";

export interface CreateEmployeeResult {
  ok: boolean;
  error?: string;
}

function s(formData: FormData, key: string): string {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function dateOrNull(v: string): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseDobParts(formData: FormData): { dob: Date | null; invalid: boolean } {
  const y = s(formData, "dobYear");
  const m = s(formData, "dobMonth");
  const d = s(formData, "dobDay");
  if (!y && !m && !d) return { dob: null, invalid: false };
  if (!y || !m || !d) return { dob: null, invalid: true };
  const year = parseInt(y, 10);
  const month = parseInt(m, 10);
  const day = parseInt(d, 10);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return { dob: null, invalid: true };
  const dt = new Date(Date.UTC(year, month - 1, day));
  const valid =
    dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
  return valid ? { dob: dt, invalid: false } : { dob: null, invalid: true };
}

export async function createEmployee(_: CreateEmployeeResult | null, formData: FormData): Promise<CreateEmployeeResult> {
  const fullName = s(formData, "fullName");
  const email = s(formData, "email");

  if (!fullName) return { ok: false, error: "Full Name is required." };
  if (!email) return { ok: false, error: "Email is required." };

  // Form sends Branch always; Department only when Branch is HQ.
  const branchIdRaw = s(formData, "branchId");
  const departmentIdRaw = s(formData, "departmentId");
  const branchId = branchIdRaw ? Number.parseInt(branchIdRaw, 10) : NaN;
  const departmentId = departmentIdRaw ? Number.parseInt(departmentIdRaw, 10) : NaN;
  const branchIdValue = Number.isFinite(branchId) ? branchId : null;
  const departmentIdValue = Number.isFinite(departmentId) ? departmentId : null;

  const employeeId = s(formData, "employeeId") || null;
  const role = s(formData, "role") || null;
  const employmentType = s(formData, "employmentType") || null;
  const startDate = dateOrNull(s(formData, "startDate"));
  const endDate = dateOrNull(s(formData, "endDate"));
  const statusField = s(formData, "status") || "active";
  const probation = formData.get("probation") === "on";
  const rate = role === "PT COACH" ? (s(formData, "rate") || null) : null;

  const nickName = s(formData, "nickName") || null;
  const phone = s(formData, "phone") || null;
  const gender = s(formData, "gender") || null;
  const { dob, invalid: dobInvalid } = parseDobParts(formData);
  if (dobInvalid) return { ok: false, error: "Date of Birth is incomplete or invalid." };
  const nric = s(formData, "nric") || null;
  const nationality = s(formData, "nationality") || null;
  const homeAddress = s(formData, "homeAddress") || null;

  const bankName = s(formData, "bankName") || null;
  const bankAccount = s(formData, "bankAccount") || null;
  const accountName = s(formData, "accountName") || null;

  const emergencyName = s(formData, "emergencyName") || null;
  const emergencyPhone = s(formData, "emergencyPhone") || null;
  const emergencyRelation = s(formData, "emergencyRelation") || null;

  const existing = await prisma.users.findUnique({ where: { email }, select: { user_id: true } });
  if (existing) return { ok: false, error: `Email "${email}" is already registered.` };

  if (employeeId) {
    const dupe = await prisma.employment.findUnique({ where: { employee_id: employeeId }, select: { employment_id: true } });
    if (dupe) return { ok: false, error: `Employee ID "${employeeId}" is already taken.` };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          email,
          password: null,
          role_id: STAFF_ROLE_ID,
          status: statusField,
        },
      });

      await tx.user_profile.create({
        data: {
          user_id: user.user_id,
          full_name: titleCaseName(fullName),
          nick_name: nickName ? titleCaseName(nickName) : null,
          gender,
          dob,
          phone,
          nationality,
          nric,
          home_address: homeAddress,
        },
      });

      await tx.employment.create({
        data: {
          user_id: user.user_id,
          employee_id: employeeId,
          branch_id: branchIdValue,
          department_id: departmentIdValue,
          position: role,
          start_date: startDate,
          end_date: endDate,
          employment_type: employmentType,
          status: statusField,
          probation,
          rate,
        },
      });

      if (bankName || bankAccount || accountName) {
        await tx.bank_details.create({
          data: {
            user_id: user.user_id,
            bank_name: bankName,
            bank_account: bankAccount,
            account_name: accountName,
          },
        });
      }

      if (emergencyName) {
        await tx.emergency_contact.create({
          data: {
            user_id: user.user_id,
            name: titleCaseName(emergencyName),
            phone: emergencyPhone,
            relation: emergencyRelation,
          },
        });
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown database error.";
    return { ok: false, error: `Could not save employee: ${msg}` };
  }

  revalidatePath("/dashboard-employee-management");
  redirect("/dashboard-employee-management");
}

export async function updateEmployee(_: CreateEmployeeResult | null, formData: FormData): Promise<CreateEmployeeResult> {
  const userIdRaw = s(formData, "userId");
  const userId = parseInt(userIdRaw, 10);
  if (!userIdRaw || Number.isNaN(userId)) return { ok: false, error: "Missing or invalid employee id." };

  const fullName = s(formData, "fullName");
  const email = s(formData, "email");
  if (!fullName) return { ok: false, error: "Full Name is required." };
  if (!email) return { ok: false, error: "Email is required." };

  // Form sends Branch always; Department only when Branch is HQ.
  const branchIdRaw = s(formData, "branchId");
  const departmentIdRaw = s(formData, "departmentId");
  const branchId = branchIdRaw ? Number.parseInt(branchIdRaw, 10) : NaN;
  const departmentId = departmentIdRaw ? Number.parseInt(departmentIdRaw, 10) : NaN;
  const branchIdValue = Number.isFinite(branchId) ? branchId : null;
  const departmentIdValue = Number.isFinite(departmentId) ? departmentId : null;

  const employeeId = s(formData, "employeeId") || null;
  const role = s(formData, "role") || null;
  const employmentType = s(formData, "employmentType") || null;
  const startDate = dateOrNull(s(formData, "startDate"));
  const endDate = dateOrNull(s(formData, "endDate"));
  const statusField = s(formData, "status") || "active";
  const probation = formData.get("probation") === "on";
  const rate = role === "PT COACH" ? (s(formData, "rate") || null) : null;

  const nickName = s(formData, "nickName") || null;
  const phone = s(formData, "phone") || null;
  const gender = s(formData, "gender") || null;
  const { dob, invalid: dobInvalid } = parseDobParts(formData);
  if (dobInvalid) return { ok: false, error: "Date of Birth is incomplete or invalid." };
  const nric = s(formData, "nric") || null;
  const nationality = s(formData, "nationality") || null;
  const homeAddress = s(formData, "homeAddress") || null;

  const bankName = s(formData, "bankName") || null;
  const bankAccount = s(formData, "bankAccount") || null;
  const accountName = s(formData, "accountName") || null;

  const emergencyName = s(formData, "emergencyName") || null;
  const emergencyPhone = s(formData, "emergencyPhone") || null;
  const emergencyRelation = s(formData, "emergencyRelation") || null;

  const existing = await prisma.users.findUnique({
    where: { user_id: userId },
    include: {
      employment: { orderBy: { start_date: "desc" }, take: 1 },
      emergency_contact: { take: 1 },
    },
  });
  if (!existing) return { ok: false, error: "Employee not found." };

  if (email !== existing.email) {
    const dupe = await prisma.users.findUnique({ where: { email }, select: { user_id: true } });
    if (dupe && dupe.user_id !== userId) return { ok: false, error: `Email "${email}" is already registered.` };
  }

  if (employeeId) {
    const dupe = await prisma.employment.findUnique({ where: { employee_id: employeeId }, select: { employment_id: true, user_id: true } });
    if (dupe && dupe.user_id !== userId) return { ok: false, error: `Employee ID "${employeeId}" is already taken.` };
  }

  const existingEmploymentId = existing.employment[0]?.employment_id ?? null;
  const existingEmergencyId = existing.emergency_contact[0]?.contract_id ?? null;

  try {
    await prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { user_id: userId },
        data: { email, status: statusField },
      });

      const cleanFullName = titleCaseName(fullName);
      const cleanNickName = nickName ? titleCaseName(nickName) : null;
      await tx.user_profile.upsert({
        where: { user_id: userId },
        create: {
          user_id: userId,
          full_name: cleanFullName,
          nick_name: cleanNickName,
          gender,
          dob,
          phone,
          nationality,
          nric,
          home_address: homeAddress,
        },
        update: {
          full_name: cleanFullName,
          nick_name: cleanNickName,
          gender,
          dob,
          phone,
          nationality,
          nric,
          home_address: homeAddress,
        },
      });

      const empScalars = {
        employee_id: employeeId,
        position: role,
        start_date: startDate,
        end_date: endDate,
        employment_type: employmentType,
        status: statusField,
        probation,
        rate,
      };
      const branchRel = branchIdValue !== null
        ? { connect: { branch_id: branchIdValue } }
        : { disconnect: true };
      const departmentRel = departmentIdValue !== null
        ? { connect: { department_id: departmentIdValue } }
        : { disconnect: true };

      if (existingEmploymentId) {
        await tx.employment.update({
          where: { employment_id: existingEmploymentId },
          data: { ...empScalars, branch: branchRel, department: departmentRel },
        });
      } else {
        await tx.employment.create({
          data: { user_id: userId, ...empScalars, branch_id: branchIdValue, department_id: departmentIdValue },
        });
      }

      if (bankName || bankAccount || accountName) {
        await tx.bank_details.upsert({
          where: { user_id: userId },
          create: { user_id: userId, bank_name: bankName, bank_account: bankAccount, account_name: accountName },
          update: { bank_name: bankName, bank_account: bankAccount, account_name: accountName },
        });
      } else {
        await tx.bank_details.deleteMany({ where: { user_id: userId } });
      }

      if (emergencyName) {
        const cleanEmergencyName = titleCaseName(emergencyName);
        if (existingEmergencyId) {
          await tx.emergency_contact.update({
            where: { contract_id: existingEmergencyId },
            data: { name: cleanEmergencyName, phone: emergencyPhone, relation: emergencyRelation },
          });
        } else {
          await tx.emergency_contact.create({
            data: { user_id: userId, name: cleanEmergencyName, phone: emergencyPhone, relation: emergencyRelation },
          });
        }
      } else if (existingEmergencyId) {
        await tx.emergency_contact.delete({ where: { contract_id: existingEmergencyId } });
      }
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown database error.";
    return { ok: false, error: `Could not update employee: ${msg}` };
  }

  revalidatePath("/dashboard-employee-management");
  revalidatePath(`/dashboard-employee-management/${userId}`);
  redirect(`/dashboard-employee-management/${userId}`);
}

export interface DeleteEmployeeResult {
  ok: boolean;
  error?: string;
}

export async function deleteEmployee(userId: number): Promise<DeleteEmployeeResult> {
  if (!Number.isFinite(userId) || userId <= 0) {
    return { ok: false, error: "Invalid employee id." };
  }
  try {
    await prisma.users.delete({ where: { user_id: userId } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown database error.";
    return { ok: false, error: `Could not delete employee: ${msg}` };
  }
  revalidatePath("/dashboard-employee-management");
  return { ok: true };
}
