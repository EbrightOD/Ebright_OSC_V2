"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { Home as HomeIcon, ChevronRight } from "lucide-react";
import AppShell from "@/app/components/AppShell";
import {
  ALL_BRANCHES,
  COLUMNS,
  getTimeSlotsForDay,
  getWorkingDaysForBranch,
  isOpeningClosingSlot,
  isManagerOnDutySlot,
  getStaffColorByIndex,
  SELECT_ARROW_WHITE,
  SELECT_ARROW_DARK,
} from "@/lib/manpowerUtils";

// ─── Demo data (no backend yet) ───────────────────────────────────────────────

const DEMO_STAFF = [
  "AISHAH NURFITRI",
  "AIDIL",
  "FARHAN ZAKI",
  "NUR AINA",
  "HAKIM HASSAN",
  "SARAH IZZATI",
  "DANISH HARITH",
  "AMIRA SOFEA",
];

const DEMO_MANAGERS = ["SITI HAJAR", "MOHD AZHAR"];

const SUMMARY_DATA = DEMO_STAFF.map(name => ({
  name,
  coachHrs: 0,
  execHrs: 0,
  total: 0,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateForDay(startISO: string | null, day: string): string {
  if (!startISO) return "";
  const start = parseISO(startISO);
  const dayOrder = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const idx = dayOrder.indexOf(day);
  if (idx === -1) return "";
  const d = new Date(start);
  d.setDate(d.getDate() + idx);
  return format(d, "dd MMM yyyy").toUpperCase();
}

// ─── Summary Table ────────────────────────────────────────────────────────────

function SummaryTable({
  title,
  data,
}: {
  title: string;
  data: { name: string; coachHrs: number; execHrs: number; total: number }[];
}) {
  const fmt = (h: number) => {
    const hrs = Math.floor(h);
    const min = Math.round((h - hrs) * 60);
    return { h: hrs.toString(), m: min.toString().padStart(2, "0") };
  };
  return (
    <div className="mt-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-md overflow-hidden text-slate-800">
      <header className="border-b border-slate-200 pb-4 mb-4 text-center">
        <h2 className="m-0 text-xl font-black uppercase tracking-widest text-slate-800">
          {title}
        </h2>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="w-[60px] border border-slate-300 bg-[#2D3F50] p-3 text-white font-bold text-center">No.</th>
              <th className="w-[250px] border border-slate-300 bg-[#2D3F50] p-3 text-white font-bold text-left">Name</th>
              <th className="w-[240px] border border-slate-300 bg-[#2D3F50] p-3 text-white font-bold text-center">Class (Coach)</th>
              <th className="w-[240px] border border-slate-300 bg-[#2D3F50] p-3 text-white font-bold text-center">Executive</th>
              <th className="w-[240px] border border-slate-300 bg-[#2D3F50] p-3 text-white font-bold text-center">Total (hrs:min)</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const c = fmt(row.coachHrs);
              const e = fmt(row.execHrs);
              const t = fmt(row.total);
              return (
                <tr key={row.name} className="even:bg-slate-50 hover:bg-slate-100 transition-colors">
                  <td className="border border-slate-300 px-3 py-3 text-center font-bold text-slate-500">{i + 1}</td>
                  <td className="border border-slate-300 px-3 py-3 font-black text-slate-800">{row.name}</td>
                  {[c, e, t].map((time, j) => (
                    <td key={j} className={`border border-slate-300 px-2 py-3 ${j === 2 ? "bg-blue-50/50" : ""}`}>
                      <div className="flex flex-row gap-4 items-center justify-center">
                        <div className="flex items-baseline gap-1 bg-white border border-slate-200 px-2 py-1 rounded">
                          <span className="text-sm font-bold text-slate-700">{time.h}</span>
                          <span className="text-[9px] uppercase font-black text-slate-400">hrs</span>
                        </div>
                        <div className="flex items-baseline gap-1 bg-white border border-slate-200 px-2 py-1 rounded">
                          <span className="text-sm font-bold text-slate-700">{time.m}</span>
                          <span className="text-[9px] uppercase font-black text-slate-400">min</span>
                        </div>
                      </div>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page Content ─────────────────────────────────────────────────────────────

function PlanNewWeekGridContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const branch = searchParams.get("branch") ?? "Bandar Seri Putra";
  const startStr = searchParams.get("start");
  const endStr = searchParams.get("end");

  const workingDays = useMemo(() => getWorkingDaysForBranch(branch), [branch]);
  const [selectedDay, setSelectedDay] = useState<string>(workingDays[0] ?? "Thursday");
  const [editingDays, setEditingDays] = useState<Record<string, boolean>>(() =>
    workingDays.reduce((acc, d) => ({ ...acc, [d]: true }), {} as Record<string, boolean>)
  );
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [columnReplacementBranch, setColumnReplacementBranch] = useState<Record<string, string>>({});
  const [managerReplacementBranch, setManagerReplacementBranch] = useState<Record<string, string>>({});
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [newEmployeeName, setNewEmployeeName] = useState("");
  const [newEmployeePosition, setNewEmployeePosition] = useState("Part Time");

  const isEditing = !!editingDays[selectedDay];
  const day = selectedDay;
  const daySlots = getTimeSlotsForDay(day, branch);

  function setCell(day: string, slot: string, colId: string, value: string) {
    setSelections(p => ({ ...p, [`${day}-${slot}-${colId}`]: value }));
  }

  function clearAllForDay(d: string) {
    setSelections(p => {
      const next = { ...p };
      Object.keys(next).forEach(k => {
        if (k.startsWith(`${d}-`)) delete next[k];
      });
      return next;
    });
    setNotes(p => {
      const next = { ...p };
      Object.keys(next).forEach(k => {
        if (k.startsWith(`${d}-`)) delete next[k];
      });
      return next;
    });
  }

  const weekRangeLabel =
    startStr && endStr
      ? `${format(parseISO(startStr), "dd MMM yyyy")} – ${format(parseISO(endStr), "dd MMM yyyy")}`
      : "";

  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-20">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 text-sm text-slate-500 mb-6 flex-wrap"
        >
          <Link
            href="/home"
            className="flex items-center gap-1 hover:text-slate-900 transition-colors"
          >
            <HomeIcon className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link href="/dashboards/hrms" className="hover:text-slate-900 transition-colors">
            HRMS
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link
            href="/manpower-schedule"
            className="hover:text-slate-900 transition-colors"
          >
            Manpower Planning
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link
            href="/manpower-schedule/plan-new-week"
            className="hover:text-slate-900 transition-colors"
          >
            Plan New Week
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">
            {branch}
            {weekRangeLabel && (
              <span className="text-slate-500 font-normal">
                {" "}
                ({weekRangeLabel})
              </span>
            )}
          </span>
        </nav>

        {/* Day tabs + Add Employee */}
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {workingDays.map(d => {
              const active = selectedDay === d;
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`px-6 py-3 rounded-xl font-black uppercase text-sm tracking-wide transition-all shadow-sm ${
                    active
                      ? "bg-[#2D3F50] text-white shadow-lg scale-105"
                      : "bg-white text-slate-500 border-2 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {d.slice(0, 3)}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              setNewEmployeeName("");
              setNewEmployeePosition("Part Time");
              setShowAddEmployeeModal(true);
            }}
            className="bg-green-600 text-white px-5 py-3 rounded-xl font-black uppercase text-sm tracking-wide hover:bg-green-700 transition-colors shadow-sm flex items-center gap-2"
          >
            + Add Employee
          </button>
        </div>

        {/* Day table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <header className="bg-white p-4 border-b flex justify-between items-center relative">
            <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
              <h2 className="text-xl font-black uppercase text-slate-800 m-0 leading-none">
                {day}
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                {dateForDay(startStr, day)}
              </span>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-4 relative z-10">
              {isEditing && (
                <button
                  onClick={() => clearAllForDay(day)}
                  className="text-red-500 font-bold uppercase text-xs hover:underline"
                >
                  Clear All
                </button>
              )}
              {isEditing ? (
                <button
                  onClick={() => setEditingDays(p => ({ ...p, [day]: false }))}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold text-xs uppercase shadow-sm transition-colors"
                >
                  Save Day
                </button>
              ) : (
                <button
                  onClick={() => setEditingDays(p => ({ ...p, [day]: true }))}
                  className="text-blue-600 border-2 border-blue-600 hover:bg-blue-50 px-6 py-2 rounded-lg font-bold text-xs uppercase transition-colors"
                >
                  Edit Day
                </button>
              )}
            </div>
          </header>

          <div className="overflow-x-auto relative">
            <table className="w-full border-collapse" style={{ minWidth: "2100px" }}>
              <thead className="bg-[#2D3F50] text-white text-[10px] uppercase tracking-widest">
                <tr>
                  <th className="p-3 text-left w-[180px] sticky left-0 z-20 bg-[#2D3F50] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.3)] border-r border-slate-600">
                    Time Slot
                  </th>
                  <th className="p-3 text-center border-l border-slate-600 w-[180px] bg-slate-700 border-b-4 border-b-emerald-400">
                    <div className="flex flex-col items-center gap-1">
                      <span>Manager on Duty</span>
                      {isEditing && (
                        <>
                          <select
                            value={managerReplacementBranch[day] ?? ""}
                            onChange={e =>
                              setManagerReplacementBranch(p => ({ ...p, [day]: e.target.value }))
                            }
                            className="text-[8px] bg-slate-600 text-white border-none rounded px-1 py-0.5 w-full appearance-none text-center"
                          >
                            <option value="">Own Branch</option>
                            {ALL_BRANCHES.filter(b => b !== branch).map(b => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setManagerReplacementBranch(p => ({ ...p, [day]: "" }))}
                            className="text-[8px] text-orange-300 font-bold hover:text-white uppercase px-2 py-0.5 rounded transition-colors bg-slate-600"
                          >
                            CLEAR
                          </button>
                        </>
                      )}
                    </div>
                  </th>
                  {COLUMNS.map(col => (
                    <th
                      key={col.id}
                      className={`p-3 text-center border-l border-slate-600 w-[150px] ${
                        col.type === "exec" ? "bg-slate-700 border-b-4 border-b-blue-400" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span>{col.label}</span>
                        {isEditing && (
                          <>
                            <select
                              value={columnReplacementBranch[`${day}-${col.id}`] ?? ""}
                              onChange={e =>
                                setColumnReplacementBranch(p => ({
                                  ...p,
                                  [`${day}-${col.id}`]: e.target.value,
                                }))
                              }
                              className="text-[8px] bg-slate-600 text-white border-none rounded px-1 py-0.5 w-full appearance-none text-center"
                            >
                              <option value="">Own Branch</option>
                              {ALL_BRANCHES.filter(b => b !== branch).map(b => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                            <button
                              onClick={() =>
                                setColumnReplacementBranch(p => ({
                                  ...p,
                                  [`${day}-${col.id}`]: "",
                                }))
                              }
                              className="text-[8px] text-orange-300 font-bold hover:text-white uppercase px-2 py-0.5 rounded transition-colors bg-slate-600"
                            >
                              CLEAR
                            </button>
                          </>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="p-3 text-center border-l border-slate-600 w-[250px]">
                    Notes/Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {daySlots.map((slot, slotIdx) => {
                  const isOpenClose = isOpeningClosingSlot(slot, branch);
                  const showManager = isManagerOnDutySlot(slot, branch, day);
                  const managerKey = `${day}-${slot}-MANAGER`;
                  const managerVal = selections[managerKey] ?? "";

                  return (
                    <tr
                      key={slot}
                      className={`border-b transition-colors group ${
                        isOpenClose ? "bg-blue-50" : "hover:bg-slate-50"
                      }`}
                    >
                      <td
                        className={`p-3 font-bold border-r border-slate-200 text-xs sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] transition-colors text-slate-900 ${
                          isOpenClose
                            ? "bg-blue-100 group-hover:bg-blue-100"
                            : "bg-slate-50 group-hover:bg-slate-100"
                        }`}
                      >
                        {slot}
                      </td>

                      {!isOpenClose && (
                        <td className="p-2 border-l align-middle bg-emerald-50 w-[180px]">
                          {showManager ? (
                            <select
                              disabled={!isEditing}
                              value={managerVal}
                              onChange={e => setCell(day, slot, "MANAGER", e.target.value)}
                              className={`w-full p-2 rounded text-center font-bold text-xs appearance-none transition-all ${
                                managerVal
                                  ? getStaffColorByIndex(managerVal, DEMO_MANAGERS)
                                  : "border border-emerald-200 bg-white text-slate-700"
                              }`}
                              style={{
                                backgroundImage: `url("${managerVal ? SELECT_ARROW_WHITE : SELECT_ARROW_DARK}")`,
                                backgroundPosition: "right 0.3rem center",
                                backgroundSize: "8px",
                                backgroundRepeat: "no-repeat",
                              }}
                            >
                              <option value="">-- Select --</option>
                              {DEMO_MANAGERS.map(name => (
                                <option key={name} value={name}>{name}</option>
                              ))}
                            </select>
                          ) : (
                            <div className="w-full h-[34px] rounded bg-emerald-100/50 border border-dashed border-emerald-200 flex items-center justify-center">
                              <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider">—</span>
                            </div>
                          )}
                        </td>
                      )}

                      {isOpenClose ? (
                        <td colSpan={COLUMNS.length + 2} className="p-2 border-l text-center">
                          <span className="inline-flex items-center gap-2 bg-blue-600 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                            All Staff — Executive ({slotIdx === 0 ? "Opening" : "Closing"})
                          </span>
                        </td>
                      ) : (
                        <>
                          {COLUMNS.map(col => {
                            const val = selections[`${day}-${slot}-${col.id}`] ?? "";
                            return (
                              <td
                                key={col.id}
                                className={`p-1.5 border-l ${col.type === "exec" ? "bg-slate-50" : ""}`}
                              >
                                <select
                                  disabled={!isEditing}
                                  value={val}
                                  onChange={e => setCell(day, slot, col.id, e.target.value)}
                                  className={`w-full p-2 rounded appearance-none text-center font-bold transition-all text-xs ${
                                    val
                                      ? getStaffColorByIndex(val, DEMO_STAFF)
                                      : "bg-white border border-slate-200 text-slate-400 hover:bg-slate-50"
                                  }`}
                                  style={{
                                    backgroundImage: `url("${val ? SELECT_ARROW_WHITE : SELECT_ARROW_DARK}")`,
                                    backgroundPosition: "right 0.3rem center",
                                    backgroundSize: "8px",
                                    backgroundRepeat: "no-repeat",
                                  }}
                                >
                                  <option value="">None</option>
                                  {DEMO_STAFF.map(name => (
                                    <option key={name} value={name} className="text-slate-800 font-bold">
                                      {name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            );
                          })}
                          <td className="p-1.5 border-l w-[250px] bg-white">
                            <textarea
                              disabled={!isEditing}
                              value={notes[`${day}-${slot}-notes`] ?? ""}
                              onChange={e =>
                                setNotes(p => ({
                                  ...p,
                                  [`${day}-${slot}-notes`]: e.target.value,
                                }))
                              }
                              placeholder="Add remarks..."
                              className="w-full p-2 text-xs border border-slate-200 rounded bg-white resize-none h-[38px] overflow-y-auto outline-none focus:border-blue-500 transition-all font-medium italic text-slate-600 block"
                            />
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <SummaryTable title="Weekly Hours Summary" data={SUMMARY_DATA} />

        <div className="mt-16 text-center pb-10">
          <button className="bg-green-600 hover:bg-green-700 text-white px-20 py-5 rounded-2xl text-xl font-black shadow-xl uppercase tracking-widest transition-transform hover:scale-105">
            🚀 Final Submit & Archive
          </button>
        </div>
      </div>

      {/* Add Employee modal (visual only) */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100 w-full max-w-sm flex flex-col gap-5">
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight text-center">
              Add Employee
            </h2>
            <div className="text-xs text-slate-500 text-center font-bold uppercase tracking-widest bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
              Branch: {branch}
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-slate-500">Full Name</label>
              <input
                type="text"
                value={newEmployeeName}
                onChange={e => setNewEmployeeName(e.target.value)}
                placeholder="e.g. Ahmad Bin Ali"
                className="w-full p-3 border-2 border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700 outline-none focus:border-green-500 transition-colors"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black uppercase text-slate-500">Role</label>
              <select
                value={newEmployeePosition}
                onChange={e => setNewEmployeePosition(e.target.value)}
                className="w-full p-3 border-2 border-slate-200 rounded-xl bg-slate-50 font-bold text-slate-700 outline-none focus:border-green-500 transition-colors"
              >
                <option value="Part Time">Part Time</option>
                <option value="Full Time">Full Time</option>
                <option value="Branch Manager">Branch Manager</option>
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddEmployeeModal(false)}
                className="flex-1 py-3 bg-slate-200 text-slate-700 font-black rounded-xl hover:bg-slate-300 uppercase tracking-widest text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddEmployeeModal(false)}
                className="flex-1 py-3 bg-green-600 text-white font-black rounded-xl hover:bg-green-700 uppercase tracking-widest text-sm transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page (with AppShell + auth) ──────────────────────────────────────────────

export default function PlanNewWeekGridPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  if (status === "loading") {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-full text-blue-600 font-semibold text-lg">
          Loading...
        </div>
      </AppShell>
    );
  }

  const userEmail = session?.user?.email ?? "";
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? "USER";
  const userName = session?.user?.name ?? null;

  return (
    <AppShell email={userEmail} role={userRole} name={userName}>
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full text-slate-500">
            Loading week...
          </div>
        }
      >
        <PlanNewWeekGridContent />
      </Suspense>
    </AppShell>
  );
}
