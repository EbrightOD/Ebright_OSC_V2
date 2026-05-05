import type { ProblemArea } from "@/app/induction/queries";

export function ProblemAreasSection({ areas }: { areas: ProblemArea[] }) {
  if (areas.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-6 shadow">
        <h3 className="text-lg font-semibold">Problem Areas</h3>
        <p className="mt-2 text-gray-600">No issues detected.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-6 shadow">
      <h3 className="mb-4 text-lg font-semibold">Problem Areas</h3>
      <div className="space-y-3">
        {areas.map((area) => (
          <div
            key={area.metricName}
            className="rounded-lg border border-red-200 bg-red-50 p-4"
          >
            <p className="font-semibold text-red-900">{area.metricName}</p>
            <p className="mt-1 text-sm text-red-800">{area.evidence}</p>
            <p className="mt-2 text-xs text-red-700">
              Score: {area.currentScore}/100
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
