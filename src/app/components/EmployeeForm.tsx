"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import { Home, ChevronRight, User, Briefcase, Landmark, HeartPulse, CircleAlert } from "lucide-react";
import type { CreateEmployeeResult } from "@/app/dashboard-employee-management/actions";
import type { EmployeeDetailFull } from "@/lib/employeeQueries";

const ROLE_OPTIONS = ["FT CEO", "FT HOD", "FT EXEC", "BM", "FT COACH", "PT COACH", "INTERN"];
const GENDER_OPTIONS = ["Male", "Female", "Other"];
const EMPLOYMENT_TYPE_OPTIONS = ["Full-time — Permanent", "Full-time — 24 months", "Full-time — 12 months", "Part-time", "Internship — 6 months", "Contract"];
const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];
const BANK_OPTIONS = ["Maybank", "CIMB", "Public Bank", "RHB", "HSBC", "Bank Islam", "AmBank", "Hong Leong Bank"];
const RELATION_OPTIONS = ["Father", "Mother", "Spouse", "Sibling", "Child", "Relative", "Friend", "Other"];

interface BranchOpt { id: number; code: string; name: string }
interface DepartmentOpt { id: number; code: string; name: string }

type FormAction = (state: CreateEmployeeResult | null, formData: FormData) => Promise<CreateEmployeeResult>;

export default function EmployeeForm({
  branches,
  departments,
  mode,
  employee,
  action,
  isSelfEdit = false,
}: {
  branches: BranchOpt[];
  departments: DepartmentOpt[];
  mode: "create" | "edit";
  employee?: EmployeeDetailFull;
  action: FormAction;
  isSelfEdit?: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<CreateEmployeeResult | null, FormData>(action, null);
  const [currentRole, setCurrentRole] = useState<string>(employee?.role ?? "");

  const isEdit = mode === "edit";
  const defaultOrgUnit = employee
    ? employee.branchId
      ? `branch:${employee.branchId}`
      : employee.departmentId
        ? `dept:${employee.departmentId}`
        : ""
    : "";

  const headingText = isSelfEdit ? "Edit My Profile" : isEdit ? "Edit Employee" : "Add Employee";
  const headingDesc = isSelfEdit
    ? "Update your personal, employment, bank, and emergency contact details."
    : isEdit
      ? `Update ${employee?.fullName ?? "this employee"}'s details across the four sections below.`
      : "Enter the new employee's details across the four sections below.";
  const saveButtonText = isSelfEdit ? "Save Profile" : isEdit ? "Save Changes" : "Save Employee";
  const savingText = "Saving...";

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 pt-4 pb-32">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/home" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          {isSelfEdit ? (
            <>
              <Link href="/profile" className="hover:text-slate-900 transition-colors">My Profile</Link>
              <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <span className="text-slate-900 font-medium">Edit</span>
            </>
          ) : (
            <>
              <Link href="/dashboards/hrms" className="hover:text-slate-900 transition-colors">HRMS</Link>
              <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <Link href="/dashboard-employee-management" className="hover:text-slate-900 transition-colors">Employees</Link>
              <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
              {isEdit && employee ? (
                <>
                  <Link href={`/dashboard-employee-management/${employee.id}`} className="hover:text-slate-900 transition-colors truncate max-w-[180px]">
                    {employee.fullName}
                  </Link>
                  <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  <span className="text-slate-900 font-medium">Edit</span>
                </>
              ) : (
                <span className="text-slate-900 font-medium">New</span>
              )}
            </>
          )}
        </nav>

        <header className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">{headingText}</h1>
          <p className="mt-1 text-sm text-slate-500">{headingDesc}</p>
        </header>

        {state?.error && (
          <div role="alert" className="mb-5 flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-red-50 text-sm text-red-800">
            <CircleAlert className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="space-y-6">
          {isEdit && employee && <input type="hidden" name="userId" value={employee.id} />}

          <Section Icon={User} title="User Profile" description="Personal identity and contact details.">
            <Field label="Full Name" required>
              <input name="fullName" type="text" placeholder="e.g. NIK NUR ATHIRAH NIK" className={inputCls} defaultValue={employee?.fullName ?? ""} required />
            </Field>
            <Field label="Nick Name">
              <input name="nickName" type="text" placeholder="e.g. ATHIRAH" className={inputCls} defaultValue={employee?.nickName ?? ""} />
            </Field>
            <Field label="Email" required hint={isSelfEdit ? "Change your email via Profile → Edit." : undefined}>
              <input
                name="email"
                type="email"
                placeholder="name@ebright.my"
                className={`${inputCls}${isSelfEdit ? " bg-slate-50 text-slate-600" : ""}`}
                defaultValue={employee?.email ?? ""}
                required
                readOnly={isSelfEdit}
              />
            </Field>
            <Field label="Phone">
              <input name="phone" type="tel" placeholder="+60 11-XXXX XXXX" className={inputCls} defaultValue={employee?.phone ?? ""} />
            </Field>
            <Field label="Gender">
              <Select name="gender" placeholder="Select gender" options={GENDER_OPTIONS} defaultValue={employee?.gender ?? ""} />
            </Field>
            <Field label="Date of Birth">
              <DobPicker defaultDob={employee?.dob ?? null} />
            </Field>
            <Field label="NRIC">
              <input name="nric" type="text" placeholder="YYMMDD-PB-XXXX" className={inputCls} defaultValue={employee?.nric ?? ""} />
            </Field>
            <Field label="Nationality">
              <input name="nationality" type="text" className={inputCls} defaultValue={employee?.nationality ?? "Malaysian"} />
            </Field>
            <Field label="Home Address" span={2}>
              <textarea
                name="homeAddress"
                rows={2}
                placeholder="Full home address"
                className={`${inputCls} h-auto py-2.5 resize-y min-h-[72px]`}
                defaultValue={employee?.homeAddress ?? ""}
              />
            </Field>
          </Section>

          <Section Icon={Briefcase} title="Employment" description="Role, branch, and contract terms.">
            <Field
              label="Employee ID"
              hint={isSelfEdit ? "Assigned by HR — read-only." : "Optional. Leave blank to assign later."}
            >
              <input
                name="employeeId"
                type="text"
                placeholder={isSelfEdit ? "—" : "e.g. 22030001"}
                className={`${inputCls}${isSelfEdit ? " bg-slate-50 text-slate-600" : ""}`}
                defaultValue={employee?.employeeId ?? ""}
                readOnly={isSelfEdit}
              />
            </Field>
            <Field label="Role" required>
              <div className="relative">
                <select
                  name="role"
                  defaultValue={employee?.role ?? ""}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  required
                  className={`${inputCls} pr-8 appearance-none cursor-pointer`}
                >
                  <option value="" disabled>Select role</option>
                  {ROLE_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" aria-hidden="true" />
              </div>
            </Field>
            <Field label="Branch / Department" required>
              <OrgUnitSelect branches={branches} departments={departments} defaultValue={defaultOrgUnit} required />
            </Field>
            <Field label="Employment Type">
              <Select name="employmentType" placeholder="Select type" options={EMPLOYMENT_TYPE_OPTIONS} defaultValue={employee?.employmentType ?? ""} />
            </Field>
            {currentRole === "PT COACH" && (
              <Field label="Rate" hint="e.g. RM 50/hour — shown only for PT COACH">
                <input
                  name="rate"
                  type="text"
                  placeholder="e.g. RM 50/hour"
                  className={inputCls}
                  defaultValue={employee?.rate ?? ""}
                />
              </Field>
            )}
            <Field label="Start Date">
              <input name="startDate" type="date" className={inputCls} defaultValue={employee?.startDate ?? ""} />
            </Field>
            <Field label="End Date" hint="Leave blank if ongoing">
              <input name="endDate" type="date" className={inputCls} defaultValue={employee?.endDate ?? ""} />
            </Field>
            <Field label="Status">
              <div className="relative">
                <select
                  name="status"
                  defaultValue={employee?.status ?? "active"}
                  className={`${inputCls} pr-8 appearance-none cursor-pointer`}
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" aria-hidden="true" />
              </div>
            </Field>
            <Field label="Probation">
              <label className="flex items-center gap-2 h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm cursor-pointer hover:bg-slate-50">
                <input name="probation" type="checkbox" className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" defaultChecked={employee?.probation ?? false} />
                <span className="text-slate-700">Currently on probation</span>
              </label>
            </Field>
          </Section>

          <Section Icon={Landmark} title="Bank Details" description="Used for salary disbursement.">
            <Field label="Bank Name">
              <Select name="bankName" placeholder="Select bank" options={BANK_OPTIONS} defaultValue={employee?.bankName ?? ""} />
            </Field>
            <Field label="Account Number">
              <input name="bankAccount" type="text" inputMode="numeric" placeholder="e.g. 1642-3344-9902" className={inputCls} defaultValue={employee?.bankAccount ?? ""} />
            </Field>
          </Section>

          <Section Icon={HeartPulse} title="Emergency Contact" description="Person to reach in case of emergency.">
            <Field label="Contact Name">
              <input name="emergencyName" type="text" placeholder="Full name" className={inputCls} defaultValue={employee?.emergencyName ?? ""} />
            </Field>
            <Field label="Contact Phone">
              <input name="emergencyPhone" type="tel" placeholder="+60 12-XXX XXXX" className={inputCls} defaultValue={employee?.emergencyPhone ?? ""} />
            </Field>
            <Field label="Relation">
              <Select name="emergencyRelation" placeholder="Select relation" options={RELATION_OPTIONS} defaultValue={employee?.emergencyRelation ?? ""} />
            </Field>
          </Section>

          <div className="sticky bottom-0 -mx-6 px-6 py-4 bg-slate-50/85 backdrop-blur border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => router.push(isSelfEdit ? "/profile" : isEdit && employee ? `/dashboard-employee-management/${employee.id}` : "/dashboard-employee-management")}
              disabled={pending}
              className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={pending}
              className="h-10 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {pending ? savingText : saveButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "block w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

function Section({
  Icon,
  title,
  description,
  children,
}: {
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <header className="flex items-start gap-3 px-6 py-5 border-b border-slate-100">
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-blue-600" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
      </header>
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  required = false,
  hint,
  span = 1,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  span?: 1 | 2;
  children: ReactNode;
}) {
  return (
    <label className={`block ${span === 2 ? "md:col-span-2" : ""}`}>
      <span className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
      </span>
      {children}
      {hint && <span className="block mt-1 text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

function Select({
  name,
  placeholder,
  options,
  defaultValue = "",
  required,
}: {
  name: string;
  placeholder: string;
  options: string[];
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className={`${inputCls} pr-8 appearance-none cursor-pointer`}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" aria-hidden="true" />
    </div>
  );
}

function DobPicker({ defaultDob }: { defaultDob: string | null }) {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear; y >= currentYear - 85; y--) years.push(y);
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const days: number[] = Array.from({ length: 31 }, (_, i) => i + 1);

  let defaultY = "";
  let defaultM = "";
  let defaultD = "";
  if (defaultDob) {
    const parts = defaultDob.split("-");
    if (parts.length === 3) {
      defaultY = parts[0];
      defaultM = String(parseInt(parts[1], 10));
      defaultD = String(parseInt(parts[2], 10));
    }
  }

  const selectCls = `${inputCls} pr-8 appearance-none cursor-pointer`;

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="relative">
        <select name="dobDay" defaultValue={defaultD} className={selectCls} aria-label="Day">
          <option value="">Day</option>
          {days.map((d) => (<option key={d} value={d}>{d}</option>))}
        </select>
        <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" aria-hidden="true" />
      </div>
      <div className="relative">
        <select name="dobMonth" defaultValue={defaultM} className={selectCls} aria-label="Month">
          <option value="">Month</option>
          {months.map((m, i) => (<option key={i + 1} value={i + 1}>{m}</option>))}
        </select>
        <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" aria-hidden="true" />
      </div>
      <div className="relative">
        <select name="dobYear" defaultValue={defaultY} className={selectCls} aria-label="Year">
          <option value="">Year</option>
          {years.map((y) => (<option key={y} value={y}>{y}</option>))}
        </select>
        <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" aria-hidden="true" />
      </div>
    </div>
  );
}

function OrgUnitSelect({
  branches,
  departments,
  defaultValue = "",
  required,
}: {
  branches: BranchOpt[];
  departments: DepartmentOpt[];
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <select
        name="orgUnit"
        defaultValue={defaultValue}
        required={required}
        className={`${inputCls} pr-8 appearance-none cursor-pointer`}
      >
        <option value="" disabled>Select branch or department</option>
        <optgroup label="Branches">
          {branches.map((b) => (
            <option key={`b-${b.id}`} value={`branch:${b.id}`}>{b.code} — {b.name}</option>
          ))}
        </optgroup>
        <optgroup label="Departments">
          {departments.map((d) => (
            <option key={`d-${d.id}`} value={`dept:${d.id}`}>{d.code} — {d.name}</option>
          ))}
        </optgroup>
      </select>
      <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" aria-hidden="true" />
    </div>
  );
}
