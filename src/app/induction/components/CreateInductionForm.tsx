"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { createInduction } from "@/app/induction/actions";
import { WORKFLOW_TEMPLATE_NAMES } from "@/app/induction/templates";
import type { InductionEmployeeOption } from "@/app/induction/queries";

interface CreateInductionFormProps {
  employees: InductionEmployeeOption[];
}

export default function CreateInductionForm({ employees }: CreateInductionFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, startTransition] = useTransition();

  const [employeeId, setEmployeeId] = useState<string>("");
  const [inductionType, setInductionType] = useState<"Onboarding" | "Offboarding">("Onboarding");

  const selectedEmployee = useMemo(
    () => employees.find((e) => String(e.userId) === employeeId) ?? null,
    [employeeId, employees],
  );

  function handleAction(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createInduction(null, formData);
      if (result.ok) {
        setOpen(false);
        setEmployeeId("");
        setInductionType("Onboarding");
        router.refresh();
      } else {
        setError(result.error ?? "Failed to create induction.");
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
      >
        <UserPlus className="w-4 h-4" aria-hidden="true" />
        Create Induction Profile
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 px-4 py-10 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-induction-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) setOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-3 border-b border-slate-100">
              <div>
                <h2 id="create-induction-title" className="text-lg font-semibold text-slate-900">
                  Create Induction Profile
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Set up an onboarding or offboarding journey for an employee.
                </p>
              </div>
              <button
                type="button"
                onClick={() => !isSubmitting && setOpen(false)}
                className="rounded-md p-1 text-slate-400 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form action={handleAction} className="px-6 py-5 space-y-5">
              <div>
                <label htmlFor="user_id" className="block text-sm font-medium text-slate-800">
                  Employee <span className="text-red-500">*</span>
                </label>
                <select
                  id="user_id"
                  name="user_id"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an employee…</option>
                  {employees.map((emp) => (
                    <option key={emp.userId} value={emp.userId}>
                      {emp.fullName} ({emp.email})
                    </option>
                  ))}
                </select>
              </div>

              {selectedEmployee && (
                <div className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <span className="font-medium text-slate-700">Department:</span>{" "}
                  {selectedEmployee.departmentName ?? "—"}
                  {selectedEmployee.position ? ` · ${selectedEmployee.position}` : ""}
                </div>
              )}

              <fieldset>
                <legend className="block text-sm font-medium text-slate-800">
                  Induction Type <span className="text-red-500">*</span>
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["Onboarding", "Offboarding"] as const).map((type) => {
                    const active = inductionType === type;
                    return (
                      <label
                        key={type}
                        className={`flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-medium ${
                          active
                            ? "border-blue-600 bg-blue-50 text-blue-700"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="induction_type"
                          value={type}
                          checked={active}
                          onChange={() => setInductionType(type)}
                          className="sr-only"
                        />
                        {type === "Onboarding" ? "Onboarding (New Hire)" : "Offboarding (Exiting)"}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <label htmlFor="workflow_template" className="block text-sm font-medium text-slate-800">
                  Workflow Template <span className="text-red-500">*</span>
                </label>
                <select
                  id="workflow_template"
                  name="workflow_template"
                  required
                  defaultValue="Standard"
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {WORKFLOW_TEMPLATE_NAMES.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-slate-800">
                    {inductionType === "Onboarding" ? "Start Date" : "Last Working Day"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="start_date"
                    name="start_date"
                    type="date"
                    required
                    className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                {inductionType === "Offboarding" && (
                  <div>
                    <label htmlFor="exit_date" className="block text-sm font-medium text-slate-800">
                      Final Exit Date
                    </label>
                    <input
                      id="exit_date"
                      name="exit_date"
                      type="date"
                      className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="buddy_user_id" className="block text-sm font-medium text-slate-800">
                  Induction Buddy <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <select
                  id="buddy_user_id"
                  name="buddy_user_id"
                  defaultValue=""
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No buddy assigned</option>
                  {employees
                    .filter((emp) => String(emp.userId) !== employeeId)
                    .map((emp) => (
                      <option key={emp.userId} value={emp.userId}>
                        {emp.fullName} ({emp.email})
                      </option>
                    ))}
                </select>
              </div>

              {error && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Creating…" : "Create & Generate Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
