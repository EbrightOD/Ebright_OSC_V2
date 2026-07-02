"use client";

/**
 * /login-v2 — Premium SaaS-style employee portal login.
 *
 * Interface-only at this stage. The "Continue with Google" button is a visual
 * placeholder — when we wire SSO, it should invoke `signIn('google', { ... })`
 * from next-auth with a domain restriction to @ebright.my.
 *
 * The old /login page is intentionally untouched so we can preview both.
 */

import Image from "next/image";
import { useState } from "react";
import {
  Users,
  GraduationCap,
  Activity,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  { icon: Users, title: "People Management" },
  { icon: GraduationCap, title: "Training & Development" },
  { icon: Activity, title: "Operations & Performance" },
  { icon: MessagesSquare, title: "Communication & Engagement" },
] as const;

// ─── Atoms ────────────────────────────────────────────────────────────────────

function EbrightMark({ size = "md" }: { size?: "sm" | "md" }) {
  const dims = size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const textSize = size === "sm" ? "text-base" : "text-lg";
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${dims} flex items-center justify-center rounded-xl bg-[#ff2b2b] shadow-lg shadow-red-500/25`}
      >
        <Image
          src="/ebright-icon.png"
          alt="Ebright"
          width={24}
          height={24}
          className="brightness-0 invert"
        />
      </div>
      <span className={`${textSize} font-semibold tracking-tight`}>ebright</span>
    </div>
  );
}

/** Multi-color Google "G" — official mark, inlined as SVG to avoid extra deps. */
function GoogleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.26 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
        fill="#EA4335"
      />
    </svg>
  );
}

function FeatureCard({
  icon: Icon,
  title,
}: {
  icon: typeof Users;
  title: string;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/10">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white/15 to-white/5 transition-colors group-hover:from-white/25">
        <Icon className="h-4 w-4 text-white" strokeWidth={2.25} />
      </div>
      <span className="text-sm font-medium text-white/90">{title}</span>
    </div>
  );
}

// ─── Sections ─────────────────────────────────────────────────────────────────

function LeftHero() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-14 xl:p-16">
      {/* Stage spotlight — radial gradient from top center */}
      <div className="pointer-events-none absolute inset-0 opacity-50 [background:radial-gradient(ellipse_70%_50%_at_50%_-5%,#3b82f6_0%,transparent_60%)]" />

      {/* Secondary side glow */}
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:radial-gradient(ellipse_50%_40%_at_20%_70%,#6366f1_0%,transparent_70%)]" />

      {/* Subtle red brand glow */}
      <div className="pointer-events-none absolute inset-0 opacity-20 [background:radial-gradient(ellipse_30%_30%_at_85%_85%,#ff2b2b_0%,transparent_70%)]" />

      {/* Floating ambient blobs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-72 w-72 animate-pulse rounded-full bg-blue-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/3 right-1/4 h-64 w-64 animate-pulse rounded-full bg-indigo-500/10 blur-3xl [animation-delay:2.5s]" />

      {/* Grid overlay for stage-floor feel */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Top: brand mark */}
      <div className="relative z-10 text-white">
        <EbrightMark />
      </div>

      {/* Middle: headline */}
      <div className="relative z-10 max-w-xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-blue-100/80 backdrop-blur-sm">
          <Sparkles className="h-3 w-3" />
          <span>The Ebrighter Workspace</span>
        </div>
        <h1 className="text-balance text-5xl font-bold leading-[1.05] tracking-tight text-white xl:text-6xl">
          Empowering{" "}
          <span className="bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
            confident communicators.
          </span>
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-blue-100/70">
          One workspace for every Ebrighter — from people ops to performance.
        </p>
      </div>

      {/* Bottom: feature grid */}
      <div className="relative z-10 grid max-w-lg grid-cols-2 gap-3">
        {FEATURES.map((f) => (
          <FeatureCard key={f.title} icon={f.icon} title={f.title} />
        ))}
      </div>
    </div>
  );
}

function GoogleButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-900 shadow-sm transition-all duration-200 hover:border-slate-300 hover:shadow-lg active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    >
      {loading ? (
        <>
          <svg
            className="h-5 w-5 animate-spin text-slate-500"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Signing you in…</span>
        </>
      ) : (
        <>
          <GoogleIcon className="h-5 w-5" />
          <span>Continue with Google</span>
        </>
      )}
    </button>
  );
}

function RightAuthCard() {
  const [loading, setLoading] = useState(false);

  // Placeholder — to be replaced with next-auth Google provider call:
  //   signIn('google', { callbackUrl: '/home' })
  // with hd=ebright.my parameter on the provider side to enforce workspace.
  const handleSignIn = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1400);
  };

  return (
    <div className="relative flex flex-1 items-center justify-center bg-slate-50 px-5 py-12 sm:px-8 lg:w-1/2 lg:px-12">
      {/* Mobile: replicate a softer hero atmosphere at the top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-slate-100 via-white/50 to-transparent lg:hidden" />

      <div className="relative w-full max-w-md">
        {/* Mobile-only brand mark above card (since left hero is hidden) */}
        <div className="mb-8 flex justify-center text-slate-900 lg:hidden">
          <EbrightMark />
        </div>

        <div className="relative rounded-3xl border border-slate-200/70 bg-white/80 p-7 shadow-xl shadow-slate-200/50 backdrop-blur-2xl sm:p-9">
          {/* Card-internal brand mark — desktop only (mobile shows above card) */}
          <div className="mb-8 hidden text-slate-900 lg:flex">
            <EbrightMark size="sm" />
          </div>

          {/* Headlines */}
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome to Ebright Portal
          </h2>
          <p className="mt-2 text-base text-slate-500">
            Secure access for employees only.
          </p>

          {/* Google button */}
          <div className="mt-9">
            <GoogleButton loading={loading} onClick={handleSignIn} />
          </div>

          {/* Allowed-domain pill */}
          <div className="mt-5 flex items-center justify-center gap-1.5 text-sm text-slate-500">
            <span>Sign in with your</span>
            <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-medium text-slate-700">
              @ebright.my
            </code>
            <span>account</span>
          </div>

          {/* Workspace security footer */}
          <div className="mt-8 border-t border-slate-200/70 pt-5">
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              <span>Protected by Google Workspace</span>
            </div>
          </div>
        </div>

        {/* Below card */}
        <p className="mt-7 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Ebright Sdn. Bhd. · All rights reserved.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginV2Page() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 lg:flex-row">
      <LeftHero />
      <RightAuthCard />
    </div>
  );
}
