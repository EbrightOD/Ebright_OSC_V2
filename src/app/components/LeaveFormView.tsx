"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import {
  Home as HomeIcon,
  ChevronRight,
  ChevronLeft,
  Check,
  Calendar as CalendarIcon,
  Umbrella,
  Stethoscope,
  AlertTriangle,
  Wallet,
  Tag,
  CircleAlert,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { submitLeaveRequest } from "@/app/attendance/leave/actions";

export interface LeaveTypeOption {
  id: number;
  code: string;
  name: string;
  // Days remaining. null = unlimited / not tracked.
  balance?: number | null;
}

type Step = 1 | 2 | 3 | 4;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isWeekend(d: Date): boolean {
  const dow = d.getDay();
  return dow === 0 || dow === 6;
}

function workingDaysBetween(startISO: string, endISO: string): number {
  if (!startISO || !endISO) return 0;
  const s = new Date(startISO + "T00:00:00");
  const e = new Date(endISO + "T00:00:00");
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return 0;
  let count = 0;
  for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
    if (!isWeekend(d)) count++;
  }
  return count;
}

function formatDays(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

// Today's date as YYYY-MM-DD in local time — used as the earliest selectable leave date.
function todayISO(): string {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

export default function LeaveFormView({
  leaveTypes,
}: {
  leaveTypes: LeaveTypeOption[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const minDate = useMemo(() => todayISO(), []);

  const [leaveTypeId, setLeaveTypeId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [halfDay, setHalfDay] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedDays, setSubmittedDays] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Half day only applies to a single-day request (From and To are the same day).
  const isSingleDay = !!startDate && !!endDate && startDate === endDate;
  const halfDayActive = halfDay && isSingleDay;

  const totalDays = useMemo(() => {
    if (halfDayActive) return 0.5;
    return daysInclusive(startDate, endDate);
  }, [startDate, endDate, halfDayActive]);

  const dateRangeValid =
    !!startDate &&
    !!endDate &&
    startDate >= minDate &&
    new Date(endDate) >= new Date(startDate);
  const canSubmit = !!leaveTypeId && dateRangeValid;

  const selectedType = useMemo(
    () => leaveTypes.find((t) => t.id === typeId) ?? null,
    [leaveTypes, typeId],
  );
  const workingDays = workingDaysBetween(startISO ?? "", endISO ?? startISO ?? "");

  // Step gating
  const canContinue1 = typeId !== null;
  const canContinue2 = startISO !== null;

  function handleSubmit() {
    if (!selectedType || !startISO) return;
    const fd = new FormData();
    fd.append("leave_type_id", leaveTypeId);
    fd.append("start_date", startDate);
    fd.append("end_date", endDate);
    fd.append("reason", reason);
    if (halfDayActive) fd.append("half_day", "1");
    if (file) fd.append("attachment_file", file);

    startTransition(async () => {
      const result = await submitLeaveRequest(null, fd);
      if (!result.ok) {
        setErrorMsg(result.error ?? "Failed to submit leave request.");
        return;
      }
      setSubmittedDays(result.totalDays ?? totalDays);
      setSubmitted(true);
      router.refresh();
    });
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (state?.ok) {
    return (
      <SuccessScreen
        typeName={selectedTypeName}
        days={submittedDays}
        startDate={startDate}
        endDate={endDate}
        onAnother={() => {
          setSubmitted(false);
          setLeaveTypeId("");
          setStartDate("");
          setEndDate("");
          setReason("");
          setHalfDay(false);
          setFile(null);
          setErrorMsg(null);
        }}
      />
    );
  }

  // ── Wizard ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-slate-50">
      {/* Breadcrumb — left-aligned to match other pages */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
          <Link href="/home" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
            <HomeIcon className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link href="/attendance/leave" className="hover:text-slate-900 transition-colors">Leave</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">Apply</span>
        </nav>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-12">
        {/* Heading */}
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight">Apply for Leave</h1>
          <p className="mt-1 text-sm text-slate-500">Step {step} of 4</p>
        </header>

        <div>
        {/* Progress bar */}
        <ProgressBar currentStep={step} />

        {/* Step content */}
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 sm:p-6">
          {step === 1 && (
            <Step1
              leaveTypes={leaveTypes}
              typeId={typeId}
              onSelect={setTypeId}
            />
          )}
          {step === 2 && (
            <Step2
              startISO={startISO}
              endISO={endISO}
              onChange={(s, e) => {
                setStartISO(s);
                setEndISO(e);
              }}
            >
              <FieldBlock
                icon={<CalendarDays size={13} strokeWidth={2.5} />}
                label="From Date"
                required
              >
                <input
                  type="date"
                  required
                  value={startDate}
                  min={minDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </FieldBlock>

              <FieldBlock
                icon={<CalendarDays size={13} strokeWidth={2.5} />}
                label="To Date"
                required
              >
                <input
                  type="date"
                  required
                  value={endDate}
                  min={startDate || minDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </FieldBlock>
            </div>
          )}
        </div>

            {/* Half day toggle — only for a single-day request */}
            {isSingleDay && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  borderRadius: "12px",
                  padding: "14px 16px",
                  border: `1px solid ${halfDay ? ACCENT_BORDER : "#E5E7EB"}`,
                  backgroundColor: halfDay ? ACCENT_SOFT : "#fff",
                  cursor: "pointer",
                  transition: "background-color 0.15s, border-color 0.15s",
                }}
              >
                <input
                  type="checkbox"
                  checked={halfDay}
                  onChange={(e) => setHalfDay(e.target.checked)}
                  style={{ width: "18px", height: "18px", accentColor: ACCENT, cursor: "pointer" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#262626" }}>
                    Half day
                  </p>
                  <p style={{ fontSize: "12px", color: "#737373", marginTop: "2px" }}>
                    Apply for half a day (0.5) on this date.
                  </p>
                </div>
              </label>
            )}

            {/* Total days preview */}
            <div
              style={{
                borderRadius: "14px",
                padding: "16px 20px",
                backgroundColor: ACCENT_SOFT,
                border: `1px solid ${ACCENT_BORDER}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: ACCENT_TEXT,
                    marginBottom: "4px",
                  }}
                >
                  Total Days
                </p>
                <p style={{ fontSize: "13px", color: ACCENT_TEXT }}>
                  {!dateRangeValid
                    ? "Select a valid date range to calculate"
                    : halfDayActive
                      ? "Half day on the selected date"
                      : "Inclusive of start and end date"}
                </p>
              </div>
              <div
                style={{
                  fontSize: "28px",
                  fontWeight: 700,
                  color: ACCENT_TEXT,
                  tabSize: "2",
                }}
              >
                {formatDays(totalDays)}
                <span style={{ fontSize: "13px", fontWeight: 600, marginLeft: "6px" }}>
                  {totalDays === 1 ? "day" : "days"}
                </span>
              </div>
            </div>

            <Divider />

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as Step)}
              disabled={(step === 1 && !canContinue1) || (step === 2 && !canContinue2)}
              className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
            >
              Continue
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pending}
              className="inline-flex items-center justify-center gap-1.5 h-11 px-5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {pending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Submitting…
                </>
              ) : (
                "Submit application"
              )}
            </button>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}

// ─── Progress bar ────────────────────────────────────────────────────────────

function ProgressBar({ currentStep }: { currentStep: Step }) {
  const steps: { num: Step; label: string }[] = [
    { num: 1, label: "Type" },
    { num: 2, label: "Dates" },
    { num: 3, label: "Reason" },
    { num: 4, label: "Review" },
  ];
  return (
    <ol className="flex items-center gap-2 sm:gap-3">
      {steps.map((s, i) => {
        const isCompleted = currentStep > s.num;
        const isCurrent = currentStep === s.num;
        return (
          <li key={s.num} className="flex items-center gap-2 sm:gap-3 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <span
                aria-current={isCurrent ? "step" : undefined}
                className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  isCompleted
                    ? "bg-blue-600 border-blue-600 text-white"
                    : isCurrent
                      ? "border-blue-600 bg-white text-blue-600"
                      : "border-slate-300 bg-white text-slate-400"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" aria-hidden="true" /> : s.num}
              </span>
              <span
                className={`text-xs sm:text-sm font-medium truncate ${
                  isCompleted || isCurrent ? "text-slate-900" : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 rounded ${currentStep > s.num ? "bg-blue-600" : "bg-slate-200"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

// ─── Step 1 — Leave type ─────────────────────────────────────────────────────

function Step1({
  leaveTypes,
  typeId,
  onSelect,
}: {
  leaveTypes: LeaveTypeOption[];
  typeId: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <section>
      <h2 className="text-base font-semibold text-slate-900">Choose a leave type</h2>
      <p className="text-sm text-slate-500 mb-5">Select the type of leave you&apos;re applying for.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {leaveTypes.length === 0 ? (
          <div className="col-span-full text-center text-sm text-slate-400 py-10">
            No leave types configured.
          </div>
        ) : (
          leaveTypes.map((t) => {
            const Icon = pickIcon(t.code, t.name);
            const accent = pickAccent(t.code, t.name);
            const isSelected = typeId === t.id;
            const balance =
              t.balance == null
                ? "Unlimited"
                : `${t.balance} day${t.balance === 1 ? "" : "s"} left`;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t.id)}
                aria-pressed={isSelected}
                className={`text-left bg-white border-2 rounded-xl p-4 transition-all hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:${accent.ring} ${
                  isSelected
                    ? `${accent.border} shadow-sm`
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${accent.tile} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${accent.icon}`} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{t.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{balance}</div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}

// ─── Step 2 — Date range with calendar ───────────────────────────────────────

function Step2({
  startISO,
  endISO,
  onChange,
}: {
  startISO: string | null;
  endISO: string | null;
  onChange: (start: string | null, end: string | null) => void;
}) {
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());

  function shiftMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
  }

  function onDayClick(d: Date) {
    if (isWeekend(d)) return;
    const iso = isoDate(d);
    if (!startISO || (startISO && endISO)) {
      // start a new range
      onChange(iso, null);
    } else {
      // extending from start
      if (iso < startISO) {
        onChange(iso, null);
      } else if (iso === startISO) {
        onChange(null, null);
      } else {
        onChange(startISO, iso);
      }
    }
  }

  const summary = startISO
    ? `${fmtFriendlyRange(startISO, endISO)} · ${workingDaysBetween(startISO, endISO ?? startISO)} working day${
        workingDaysBetween(startISO, endISO ?? startISO) === 1 ? "" : "s"
      }`
    : "Pick a start date to begin.";

  return (
    <section>
      <h2 className="text-base font-semibold text-slate-900">Pick your dates</h2>
      <p className="text-sm text-slate-500 mb-4">
        Tap a start date, then tap an end date. Weekends are not selectable.
      </p>

      <div className="max-w-sm mx-auto">
        <Calendar
          viewYear={viewYear}
          viewMonth={viewMonth}
          startISO={startISO}
          endISO={endISO}
          onShiftMonth={shiftMonth}
          onDayClick={onDayClick}
        />
      </div>

      <div className="mt-4 max-w-sm mx-auto bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm">
        <span className={startISO ? "text-slate-900 font-medium" : "text-slate-400"}>
          {summary}
        </span>
      </div>
    </section>
  );
}

function Calendar({
  viewYear,
  viewMonth,
  startISO,
  endISO,
  onShiftMonth,
  onDayClick,
}: {
  viewYear: number;
  viewMonth: number;
  startISO: string | null;
  endISO: string | null;
  onShiftMonth: (delta: number) => void;
  onDayClick: (d: Date) => void;
}) {
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
  const firstDay = new Date(viewYear, viewMonth, 1);
  const startWeekday = firstDay.getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(viewYear, viewMonth, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const today = isoDate(new Date());

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-2.5">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => onShiftMonth(-1)}
          aria-label="Previous month"
          className="p-1 rounded-md text-slate-600 hover:bg-slate-100"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>
        <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
          {monthLabel}
        </div>
        <button
          type="button"
          onClick={() => onShiftMonth(1)}
          aria-label="Next month"
          className="p-1 rounded-md text-slate-600 hover:bg-slate-100"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="py-0.5">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (d === null) return <div key={i} />;
          const iso = isoDate(d);
          const weekend = isWeekend(d);
          const isStart = iso === startISO;
          const isEnd = iso === endISO;
          const inRange =
            startISO && endISO && iso > startISO && iso < endISO ? true : false;
          const isToday = iso === today;

          let cls =
            "aspect-square flex items-center justify-center text-xs rounded-md transition-colors select-none";
          if (weekend) {
            cls += " text-slate-300 cursor-not-allowed bg-slate-50";
          } else if (isStart || isEnd) {
            cls += " bg-blue-600 text-white font-semibold";
          } else if (inRange) {
            cls += " bg-blue-100 text-blue-700";
          } else {
            cls += " text-slate-700 hover:bg-slate-100 cursor-pointer";
            if (isToday) cls += " ring-1 ring-blue-300";
          }

          return (
            <button
              key={i}
              type="button"
              disabled={weekend}
              onClick={() => onDayClick(d)}
              className={cls}
              aria-label={iso}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 3 — Reason & coverage ──────────────────────────────────────────────

function Step3({
  reason,
  setReason,
  notifyManager,
  setNotifyManager,
  notifyTeam,
  setNotifyTeam,
}: {
  reason: string;
  setReason: (v: string) => void;
  notifyManager: boolean;
  setNotifyManager: (v: boolean) => void;
  notifyTeam: boolean;
  setNotifyTeam: (v: boolean) => void;
}) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-slate-900">Reason</h2>
        <p className="text-sm text-slate-500">Optional — a short note for your manager.</p>
      </div>

      <div>
        <label htmlFor="reason" className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
          Reason
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="A short note for your manager…"
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      <div className="space-y-2 pt-1">
        <ToggleRow
          label="Notify my manager"
          description="Send your manager a heads-up when this is submitted."
          checked={notifyManager}
          onChange={setNotifyManager}
        />
        <ToggleRow
          label="Notify my team"
          description="Let your team know about the date range."
          checked={notifyTeam}
          onChange={setNotifyTeam}
        />
      </div>
    </section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 px-3 py-3 rounded-xl border border-slate-200">
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-900">{label}</div>
        <div className="text-xs text-slate-500">{description}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${
          checked ? "bg-blue-600" : "bg-slate-300"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

// ─── Step 4 — Review ─────────────────────────────────────────────────────────

function Step4({
  type,
  startISO,
  endISO,
  workingDays,
  reason,
  notifyManager,
  notifyTeam,
}: {
  type: LeaveTypeOption | null;
  startISO: string | null;
  endISO: string | null;
  workingDays: number;
  reason: string;
  notifyManager: boolean;
  notifyTeam: boolean;
}) {
  return (
    <div
      style={{
        minHeight: "100%",
        backgroundColor: "#FAFAFA",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "440px" }}>
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "9999px",
            backgroundColor: "#ECFDF5",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px",
          }}
        >
          <CheckCircle2 size={32} strokeWidth={1.75} style={{ color: "#10B981" }} />
        </div>
        <h2
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#171717",
            marginBottom: "8px",
          }}
        >
          Leave Request Submitted
        </h2>
        <p
          style={{
            fontSize: "13.5px",
            color: "#737373",
            lineHeight: 1.55,
            marginBottom: "4px",
          }}
        >
          Your{" "}
          <span style={{ fontWeight: 600, color: "#262626" }}>
            {typeName || "leave"}
          </span>{" "}
          of{" "}
          <span style={{ fontWeight: 600, color: "#262626" }}>
            {formatDays(days)} {days === 1 ? "day" : "days"}
          </span>{" "}
          from{" "}
          <span style={{ fontWeight: 600, color: "#262626" }}>{fmt(startDate)}</span>{" "}
          to <span style={{ fontWeight: 600, color: "#262626" }}>{fmt(endDate)}</span>{" "}
          has been sent for approval.
        </p>
        <p style={{ fontSize: "12px", color: "#A3A3A3", marginBottom: "32px" }}>
          You&apos;ll receive a notification once it&apos;s reviewed.
        </p>
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}
        >
          <Link
            href="/attendance/leave"
            style={{
              height: "44px",
              display: "inline-flex",
              alignItems: "center",
              padding: "0 20px",
              borderRadius: "10px",
              border: "1px solid #E5E7EB",
              backgroundColor: "#fff",
              fontSize: "13.5px",
              fontWeight: 500,
              color: "#404040",
            }}
          >
            Back to Leaves
          </Link>
          <button
            onClick={onAnother}
            style={{
              height: "44px",
              padding: "0 24px",
              borderRadius: "10px",
              backgroundColor: ACCENT,
              color: "#fff",
              fontSize: "13.5px",
              fontWeight: 600,
              boxShadow: `0 4px 12px ${ACCENT_RING}`,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = ACCENT_DARK)}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = ACCENT)}
          >
            Apply Another
          </button>
        </div>
      </div>
    </div>
  );
}
