"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { submitLeaveRequest } from "@/app/attendance/leave/actions";
import {
  Home,
  ChevronRight,
  Umbrella,
  X,
  CalendarDays,
  FileText,
  Upload,
  CheckCircle2,
  Paperclip,
  Info,
  Tag,
} from "lucide-react";

export interface LeaveTypeOption {
  id: number;
  code: string;
  name: string;
}

const ACCENT = "#059669";
const ACCENT_DARK = "#047857";
const ACCENT_SOFT = "#ECFDF5";
const ACCENT_RING = "#D1FAE5";
const ACCENT_BORDER = "#A7F3D0";
const ACCENT_TEXT = "#047857";
const ACCENT_RED = "#E3172E";

function daysInclusive(start: string, end: string): number {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  if (e < s) return 0;
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

export default function LeaveFormView({
  leaveTypes,
}: {
  leaveTypes: LeaveTypeOption[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [leaveTypeId, setLeaveTypeId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedDays, setSubmittedDays] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalDays = useMemo(
    () => daysInclusive(startDate, endDate),
    [startDate, endDate],
  );

  const dateRangeValid =
    !!startDate && !!endDate && new Date(endDate) >= new Date(startDate);
  const canSubmit = !!leaveTypeId && dateRangeValid;

  const selectedTypeName = useMemo(
    () => leaveTypes.find((t) => String(t.id) === leaveTypeId)?.name ?? "",
    [leaveTypes, leaveTypeId],
  );

  const handleFile = (incoming: FileList | null) => {
    if (!incoming || incoming.length === 0) return;
    setFile(incoming[0]);
  };

  const removeFile = () => setFile(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isPending) return;
    setErrorMsg(null);

    const fd = new FormData();
    fd.append("leave_type_id", leaveTypeId);
    fd.append("start_date", startDate);
    fd.append("end_date", endDate);
    fd.append("reason", reason);
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

  if (submitted) {
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
          setFile(null);
          setErrorMsg(null);
        }}
      />
    );
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "44px",
    padding: "0 16px",
    borderRadius: "10px",
    border: "1px solid #E5E7EB",
    background: "#fff",
    fontSize: "14px",
    color: "#171717",
    outline: "none",
    transition: "border-color 0.15s, box-shadow 0.15s",
  };

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    e.currentTarget.style.borderColor = ACCENT;
    e.currentTarget.style.boxShadow = `0 0 0 4px ${ACCENT_RING}`;
  };
  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    e.currentTarget.style.borderColor = "#E5E7EB";
    e.currentTarget.style.boxShadow = "none";
  };

  return (
    <div className="min-h-full" style={{ backgroundColor: "#FAFAFA" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "24px 24px 56px" }}>
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: "flex",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "6px",
            fontSize: "13px",
            color: "#737373",
            marginBottom: "24px",
          }}
        >
          <Link href="/home" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <Home size={13} strokeWidth={2} aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight size={12} style={{ color: "#D4D4D4" }} aria-hidden="true" />
          <Link href="/dashboards/hrms">HRMS</Link>
          <ChevronRight size={12} style={{ color: "#D4D4D4" }} aria-hidden="true" />
          <Link href="/attendance">Attendance</Link>
          <ChevronRight size={12} style={{ color: "#D4D4D4" }} aria-hidden="true" />
          <Link href="/attendance/leave">Leave</Link>
          <ChevronRight size={12} style={{ color: "#D4D4D4" }} aria-hidden="true" />
          <span style={{ color: "#171717", fontWeight: 500 }}>Apply</span>
        </nav>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          style={{
            backgroundColor: "#fff",
            border: "1px solid #E5E7EB",
            borderRadius: "20px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              position: "relative",
              padding: "28px 32px 24px",
              background: `linear-gradient(135deg, ${ACCENT_SOFT} 0%, #fff 60%)`,
              borderBottom: "1px solid #F3F4F6",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "14px",
                  display: "grid",
                  placeItems: "center",
                  backgroundColor: "#fff",
                  border: `1px solid ${ACCENT_BORDER}`,
                  boxShadow: `0 4px 12px ${ACCENT_RING}`,
                }}
              >
                <Umbrella
                  size={26}
                  strokeWidth={2}
                  style={{ color: ACCENT }}
                  aria-hidden="true"
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#171717",
                    lineHeight: 1.15,
                    letterSpacing: "-0.01em",
                  }}
                >
                  Apply for Leave
                </h1>
                <p style={{ fontSize: "13.5px", color: "#737373", marginTop: "4px" }}>
                  Submit your leave request for approval.
                </p>
              </div>
              <Link
                href="/attendance/leave"
                aria-label="Close"
                style={{
                  width: "36px",
                  height: "36px",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "10px",
                  color: "#A3A3A3",
                }}
                className="hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
              >
                <X size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Body */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              padding: "28px 32px",
            }}
          >
            {/* Leave type */}
            <FieldBlock
              icon={<Tag size={13} strokeWidth={2.5} />}
              label="Leave Type"
              required
            >
              <select
                required
                value={leaveTypeId}
                onChange={(e) => setLeaveTypeId(e.target.value)}
                style={{ ...inputStyle, appearance: "none", paddingRight: "40px" }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              >
                <option value="" disabled>
                  Select leave type
                </option>
                {leaveTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </FieldBlock>

            {/* Date range */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: "20px",
                alignItems: "start",
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
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              </FieldBlock>
            </div>

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
                  {dateRangeValid
                    ? "Inclusive of start and end date"
                    : "Select a valid date range to calculate"}
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
                {totalDays}
                <span style={{ fontSize: "13px", fontWeight: 600, marginLeft: "6px" }}>
                  {totalDays === 1 ? "day" : "days"}
                </span>
              </div>
            </div>

            <Divider />

            {/* Reason */}
            <FieldBlock
              icon={<FileText size={13} strokeWidth={2.5} />}
              label="Reason"
              hint="Help your approver understand the request"
            >
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief reason for taking leave…"
                style={{
                  ...inputStyle,
                  height: "auto",
                  padding: "12px 16px",
                  resize: "none",
                  lineHeight: 1.55,
                }}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </FieldBlock>

            <Divider />

            {/* Supporting document */}
            <FieldBlock
              icon={<Paperclip size={13} strokeWidth={2.5} />}
              label="Supporting Document"
              hint="Optional — e.g. MC for medical leave"
            >
              {!file ? (
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    handleFile(e.dataTransfer.files);
                  }}
                  style={{
                    cursor: "pointer",
                    borderRadius: "14px",
                    border: `2px dashed ${dragOver ? ACCENT : "#E5E7EB"}`,
                    padding: "32px",
                    textAlign: "center",
                    transition: "all 0.2s",
                    backgroundColor: dragOver ? ACCENT_SOFT : "#FAFAFA",
                  }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile(e.target.files)}
                  />
                  <div
                    style={{
                      margin: "0 auto 12px",
                      width: "44px",
                      height: "44px",
                      borderRadius: "9999px",
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: dragOver ? ACCENT_RING : "#F5F5F5",
                    }}
                  >
                    <Upload
                      size={18}
                      strokeWidth={1.75}
                      style={{ color: dragOver ? ACCENT : "#737373" }}
                    />
                  </div>
                  <p
                    style={{
                      fontSize: "13.5px",
                      color: "#404040",
                      fontWeight: 500,
                      marginBottom: "4px",
                    }}
                  >
                    Click to upload{" "}
                    <span style={{ color: ACCENT }}>MC or Document</span>
                  </p>
                  <p style={{ fontSize: "11.5px", color: "#A3A3A3" }}>
                    PDF, JPG or PNG · Max 5MB
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: `1px solid ${ACCENT_BORDER}`,
                    backgroundColor: ACCENT_SOFT,
                  }}
                >
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      display: "grid",
                      placeItems: "center",
                      backgroundColor: "#fff",
                      color: ACCENT,
                      flexShrink: 0,
                    }}
                  >
                    <Paperclip size={16} strokeWidth={2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "13.5px",
                        fontWeight: 500,
                        color: "#262626",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {file.name}
                    </p>
                    <p style={{ fontSize: "11.5px", color: "#737373" }}>
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    style={{
                      height: "32px",
                      padding: "0 12px",
                      borderRadius: "8px",
                      border: `1px solid ${ACCENT_BORDER}`,
                      backgroundColor: "#fff",
                      fontSize: "12px",
                      fontWeight: 500,
                      color: ACCENT_TEXT,
                      cursor: "pointer",
                    }}
                  >
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={removeFile}
                    style={{
                      width: "32px",
                      height: "32px",
                      display: "grid",
                      placeItems: "center",
                      borderRadius: "8px",
                      color: "#A3A3A3",
                      border: "1px solid transparent",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                    aria-label="Remove file"
                  >
                    <X size={14} />
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    style={{ display: "none" }}
                    onChange={(e) => handleFile(e.target.files)}
                  />
                </div>
              )}
            </FieldBlock>

            {/* Notice */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-start",
                borderRadius: "12px",
                padding: "14px 16px",
                backgroundColor: ACCENT_SOFT,
                border: `1px solid ${ACCENT_BORDER}`,
              }}
            >
              <Info
                size={17}
                strokeWidth={2}
                style={{ color: ACCENT, marginTop: "2px", flexShrink: 0 }}
                aria-hidden="true"
              />
              <div>
                <p
                  style={{
                    fontSize: "13.5px",
                    fontWeight: 600,
                    marginBottom: "2px",
                    color: ACCENT_TEXT,
                  }}
                >
                  Leave Submission
                </p>
                <p style={{ fontSize: "12px", lineHeight: 1.55, color: ACCENT_TEXT }}>
                  Your request will be sent for approval. Total days are counted
                  inclusive of both start and end dates.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div
                role="alert"
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  borderRadius: "12px",
                  backgroundColor: "#FEF2F2",
                  border: "1px solid #FECACA",
                  padding: "14px 16px",
                }}
              >
                <div
                  style={{
                    width: "18px",
                    height: "18px",
                    borderRadius: "9999px",
                    backgroundColor: "#DC2626",
                    color: "#fff",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    marginTop: "2px",
                    flexShrink: 0,
                  }}
                >
                  !
                </div>
                <div>
                  <p style={{ fontSize: "13.5px", fontWeight: 600, color: "#7F1D1D" }}>
                    Could not submit leave request
                  </p>
                  <p style={{ fontSize: "12px", color: "#991B1B", lineHeight: 1.55 }}>
                    {errorMsg}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div
            style={{
              padding: "18px 32px",
              borderTop: "1px solid #F3F4F6",
              backgroundColor: "#FAFAFA",
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "12px",
            }}
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
              className="hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!canSubmit || isPending}
              style={{
                height: "44px",
                padding: "0 24px",
                borderRadius: "10px",
                backgroundColor: canSubmit && !isPending ? ACCENT : "#D4D4D4",
                color: "#fff",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: canSubmit && !isPending ? "pointer" : "not-allowed",
                boxShadow:
                  canSubmit && !isPending ? `0 4px 12px ${ACCENT_RING}` : "none",
                transition: "background-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!canSubmit || isPending) return;
                e.currentTarget.style.backgroundColor = ACCENT_DARK;
              }}
              onMouseLeave={(e) => {
                if (!canSubmit || isPending) return;
                e.currentTarget.style.backgroundColor = ACCENT;
              }}
            >
              {isPending ? "Submitting…" : "Submit Request"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        input[type="date"]::-webkit-calendar-picker-indicator { opacity: 0.5; cursor: pointer; }
      `}</style>
    </div>
  );
}

function FieldBlock({
  icon,
  label,
  required,
  hint,
  children,
}: {
  icon?: React.ReactNode;
  label: string;
  required?: boolean;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      <label
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: "11.5px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#737373",
        }}
      >
        {icon}
        {label}
        {required && (
          <span style={{ marginLeft: "2px", fontWeight: 700, color: ACCENT_RED }}>*</span>
        )}
      </label>
      {children}
      {hint && (
        <p
          style={{
            fontSize: "11.5px",
            color: "#A3A3A3",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

function Divider() {
  return <div style={{ height: "1px", backgroundColor: "#F3F4F6" }} />;
}

function SuccessScreen({
  typeName,
  days,
  startDate,
  endDate,
  onAnother,
}: {
  typeName: string;
  days: number;
  startDate: string;
  endDate: string;
  onAnother: () => void;
}) {
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB");
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
            {days} {days === 1 ? "day" : "days"}
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
