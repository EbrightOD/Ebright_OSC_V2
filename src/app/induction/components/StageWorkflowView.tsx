"use client";

import { useState } from "react";
import type { StageEmployee, StageMetrics, StageName } from "@/app/induction/queries";

export function StageWorkflowView({
  metrics,
  employeesByStage,
}: {
  metrics: StageMetrics[];
  employeesByStage: Record<StageName, StageEmployee[]>;
}) {
  const [selected, setSelected] = useState<StageName | null>(null);
  const employees = selected ? employeesByStage[selected] ?? [] : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Onboarding Pipeline</h2>
        <p className="text-gray-600">Track employees across induction stages</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {metrics.map((metric) => {
          const isActive = selected === metric.stageName;
          return (
            <button
              key={metric.stageName}
              type="button"
              onClick={() =>
                setSelected(isActive ? null : metric.stageName)
              }
              className={`rounded-lg border-2 p-4 text-left transition ${
                isActive
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-400"
              }`}
            >
              <p className="font-semibold text-gray-800">{metric.stageName}</p>
              <p className="mt-2 text-2xl font-bold">{metric.employeeCount}</p>
              <div className="mt-4 h-2 rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-blue-600 transition-all"
                  style={{ width: `${metric.completionPercentage}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-600">
                {metric.completionPercentage}% complete
              </p>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="rounded-lg border bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-semibold">
            Employees in {selected}
          </h3>
          {employees.length === 0 ? (
            <p className="text-gray-500">No employees in this stage.</p>
          ) : (
            <div className="space-y-3">
              {employees.map((emp) => (
                <div key={emp.id} className="rounded-lg border p-4 hover:bg-gray-50">
                  <p className="font-semibold">{emp.fullName}</p>
                  <p className="text-sm text-gray-600">{emp.departmentName}</p>
                  <p className="text-sm text-gray-600">{emp.email}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-2 flex-1 rounded-full bg-gray-200">
                      <div
                        className="h-2 rounded-full bg-green-600"
                        style={{ width: `${emp.progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">
                      {emp.stepsCompleted}/{emp.totalSteps} ({emp.progressPercentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
