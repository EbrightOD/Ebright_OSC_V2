import { ClipboardList } from "lucide-react";
import type { PendingInductionRequestRow } from "@/app/induction/queries";
import { RequestCard } from "./RequestCard";

interface Props {
  requests: PendingInductionRequestRow[];
}

export function RequestList({ requests }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden mb-8">
      <header className="px-6 py-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-slate-500" aria-hidden="true" />
            Pending Induction Requests
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Queued from the HR dashboard. Review and accept to generate an induction link.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-blue-600 px-2.5 py-0.5 text-xs font-semibold text-white">
          {requests.length}
        </span>
      </header>

      {requests.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-sm text-slate-500">No pending requests.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {requests.map((req) => (
            <RequestCard key={req.id} request={req} />
          ))}
        </ul>
      )}
    </section>
  );
}
