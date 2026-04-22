"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  Home,
  ChevronRight,
  Search,
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight as ChevronRightLg,
  UserPlus,
  CircleAlert,
} from "lucide-react";
import { deleteEmployee } from "@/app/dashboard-employee-management/actions";

const ROLE_OPTIONS = ["FT CEO", "FT HOD", "FT EXEC", "BM", "FT COACH", "PT COACH", "INTERN"] as const;
const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  inactive: "bg-slate-100 text-slate-600 ring-slate-500/20",
};
const STATUS_DOT: Record<string, string> = {
  active: "bg-emerald-500",
  inactive: "bg-slate-400",
};

export interface EmployeeRow {
  id: number;
  email: string;
  employeeId: string | null;
  fullName: string;
  nickName: string | null;
  role: string | null;
  branchCode: string | null;
  branchName: string | null;
  departmentCode: string | null;
  departmentName: string | null;
  status: string | null;
  startDate: string | null;
  pendingOnboarding: boolean;
}

export interface BranchOpt { id: number; code: string; name: string }
export interface DepartmentOpt { id: number; code: string; name: string }

const PAGE_SIZE = 10;

function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
}
function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function statusLabel(s: string | null): string {
  if (!s) return "—";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function EmployeeListView({
  employees,
  branches,
  departments,
}: {
  employees: EmployeeRow[];
  branches: BranchOpt[];
  departments: DepartmentOpt[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [orgUnit, setOrgUnit] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<EmployeeRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  const closeDeleteModal = () => {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setDeleteError(null);
    startDelete(async () => {
      const res = await deleteEmployee(targetId);
      if (res.ok) {
        setDeleteTarget(null);
        router.refresh();
      } else {
        setDeleteError(res.error ?? "Could not delete employee.");
      }
    });
  };

  useEffect(() => {
    if (!deleteTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDeleteModal();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteTarget, isDeleting]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      if (role && e.role !== role) return false;
      if (status && e.status !== status) return false;
      if (orgUnit.startsWith("branch:")) {
        const code = orgUnit.slice("branch:".length);
        if (e.branchCode !== code) return false;
      } else if (orgUnit.startsWith("dept:")) {
        const code = orgUnit.slice("dept:".length);
        if (e.departmentCode !== code) return false;
      }
      if (!q) return true;
      return (
        e.fullName.toLowerCase().includes(q) ||
        (e.nickName?.toLowerCase().includes(q) ?? false) ||
        (e.employeeId?.toLowerCase().includes(q) ?? false) ||
        e.email.toLowerCase().includes(q)
      );
    });
  }, [employees, search, orgUnit, role, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  const hasActiveFilters = Boolean(search || orgUnit || role || status);
  const clearFilters = () => {
    setSearch("");
    setOrgUnit("");
    setRole("");
    setStatus("");
    setPage(1);
  };

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/home" className="flex items-center gap-1 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded">
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link href="/dashboards/hrms" className="hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded">HRMS</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">Employees</span>
        </nav>

        <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">Employees</h1>
            <p className="mt-1 text-sm text-slate-500">
              {filtered.length} {filtered.length === 1 ? "employee" : "employees"}
              {hasActiveFilters && (
                <>
                  {" "}·{" "}
                  <button onClick={clearFilters} className="text-blue-600 hover:underline">Clear filters</button>
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
              Export
            </button>
            <Link
              href="/dashboard-employee-management/new"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 shadow-sm"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Add Employee
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search by name, nickname, ID, or email"
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <OrgUnitSelect value={orgUnit} onChange={(v) => { setOrgUnit(v); setPage(1); }} branches={branches} departments={departments} />

            <FilterSelect
              ariaLabel="Role"
              placeholder="All Roles"
              value={role}
              onChange={(v) => { setRole(v); setPage(1); }}
              options={ROLE_OPTIONS.map((r) => ({ value: r, label: r }))}
            />

            <FilterSelect
              ariaLabel="Status"
              placeholder="All Status"
              value={status}
              onChange={(v) => { setStatus(v); setPage(1); }}
              options={STATUS_OPTIONS}
            />
          </div>

          {pageRows.length === 0 ? (
            <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} totalInDb={employees.length} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th scope="col" className="px-6 py-3">Employee</th>
                    <th scope="col" className="px-6 py-3">Role</th>
                    <th scope="col" className="px-6 py-3">Branch / Dept</th>
                    <th scope="col" className="px-6 py-3">Status</th>
                    <th scope="col" className="px-6 py-3">Start Date</th>
                    <th scope="col" className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((e) => {
                    const statusKey = e.status ?? "";
                    return (
                      <tr key={e.id} className="group hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center shrink-0">
                              {getInitials(e.fullName)}
                            </span>
                            <div className="min-w-0">
                              <div className="font-medium text-slate-900 truncate">{e.fullName}</div>
                              {e.pendingOnboarding ? (
                                <span className="inline-flex items-center mt-0.5 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-inset ring-amber-600/20">
                                  Pending onboarding
                                </span>
                              ) : (
                                <div className="text-xs text-slate-500 tabular-nums truncate">
                                  {e.employeeId ?? "—"}{e.nickName ? ` · ${e.nickName}` : ""}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          {e.role ? (
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200 whitespace-nowrap">
                              {e.role}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="text-slate-900 font-medium">{e.branchCode ?? e.departmentCode ?? "—"}</div>
                          <div className="text-xs text-slate-500 truncate">{e.branchName ?? e.departmentName ?? ""}</div>
                        </td>
                        <td className="px-6 py-3">
                          {statusKey ? (
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[statusKey] ?? STATUS_STYLES.inactive}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[statusKey] ?? STATUS_DOT.inactive}`} aria-hidden="true" />
                              {statusLabel(statusKey)}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-slate-700 tabular-nums whitespace-nowrap">
                          {formatDate(e.startDate)}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                            <RowIconLink href={`/dashboard-employee-management/${e.id}`} label={`View ${e.fullName}`} Icon={Eye} />
                            <RowIconLink href={`/dashboard-employee-management/${e.id}/edit`} label={`Edit ${e.fullName}`} Icon={Pencil} />
                            <RowIconButton label={`Delete ${e.fullName}`} Icon={Trash2} danger onClick={() => setDeleteTarget(e)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 text-sm text-slate-600">
              <span className="tabular-nums">
                {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <span className="tabular-nums px-2">Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRightLg className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteTarget && (
        <DeleteEmployeeModal
          target={deleteTarget}
          isDeleting={isDeleting}
          error={deleteError}
          onCancel={closeDeleteModal}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}

function DeleteEmployeeModal({
  target,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}: {
  target: EmployeeRow;
  isDeleting: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onCancel}
        disabled={isDeleting}
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm focus:outline-none"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
        aria-describedby="delete-modal-desc"
        className="relative w-full max-w-md bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
              <CircleAlert className="w-5 h-5 text-red-600" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2 id="delete-modal-title" className="text-base font-semibold text-slate-900">Delete employee?</h2>
              <p id="delete-modal-desc" className="mt-1 text-sm text-slate-600">
                Confirm to delete employee <span className="font-semibold text-slate-900">{target.fullName}</span>. This permanently removes their profile, employment, bank, and emergency contact records. This cannot be undone.
              </p>
              {error && (
                <p role="alert" className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                  {error}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-10 px-4 rounded-lg border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-10 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function OrgUnitSelect({
  value,
  onChange,
  branches,
  departments,
}: {
  value: string;
  onChange: (v: string) => void;
  branches: BranchOpt[];
  departments: DepartmentOpt[];
}) {
  return (
    <label className="relative">
      <span className="sr-only">Branch / Department</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer min-w-[200px]"
      >
        <option value="">All Branch / Dept</option>
        <optgroup label="Branches">
          {branches.map((b) => (
            <option key={`b-${b.id}`} value={`branch:${b.code}`}>{b.code} — {b.name}</option>
          ))}
        </optgroup>
        <optgroup label="Departments">
          {departments.map((d) => (
            <option key={`d-${d.id}`} value={`dept:${d.code}`}>{d.code} — {d.name}</option>
          ))}
        </optgroup>
      </select>
      <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" aria-hidden="true" />
    </label>
  );
}

function FilterSelect({
  ariaLabel,
  placeholder,
  value,
  onChange,
  options,
}: {
  ariaLabel: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="relative">
      <span className="sr-only">{ariaLabel}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none cursor-pointer min-w-[160px]"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronRight className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 rotate-90" aria-hidden="true" />
    </label>
  );
}

function RowIconLink({ href, label, Icon }: { href: string; label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </Link>
  );
}

function RowIconButton({ label, Icon, danger = false, onClick }: { label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; danger?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-500 hover:bg-white hover:shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${danger ? "hover:text-red-600" : "hover:text-slate-900"}`}
    >
      <Icon className="w-4 h-4" aria-hidden="true" />
    </button>
  );
}

function EmptyState({ hasFilters, onClear, totalInDb }: { hasFilters: boolean; onClear: () => void; totalInDb: number }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
        <UserPlus className="w-6 h-6 text-slate-500" aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">
        {hasFilters ? "No employees match these filters" : "No employees yet"}
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        {hasFilters
          ? "Try adjusting your search or filters."
          : totalInDb === 0
            ? "Get started by adding your first employee."
            : "The employees we found don't have a matching profile yet."}
      </p>
      {hasFilters ? (
        <button onClick={onClear} className="mt-4 text-sm text-blue-600 font-medium hover:underline">
          Clear filters
        </button>
      ) : (
        <Link
          href="/dashboard-employee-management/new"
          className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Add Employee
        </Link>
      )}
    </div>
  );
}
