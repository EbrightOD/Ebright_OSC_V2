"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Eye, EyeOff, Lock, Mail, CircleAlert, UserPlus, Hourglass, ChevronRight, CircleCheck } from "lucide-react";
import { registerUser, type RegisterResult } from "@/app/register/actions";

const POSITION_OPTIONS = ["FT CEO", "FT HOD", "FT EXEC", "BM", "FT COACH", "PT COACH", "INTERN"];

interface OrgOpt { id: number; code: string; name: string }

export default function RegisterForm({
  branches,
  departments,
}: {
  branches: OrgOpt[];
  departments: OrgOpt[];
}) {
  const [state, formAction, pending] = useActionState<RegisterResult | null, FormData>(registerUser, null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (state?.success && state.claimed) {
    return (
      <div className="w-full max-w-md px-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/90 rounded-2xl mb-4 shadow-lg">
            <CircleCheck className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Account ready</h1>
          <p className="text-blue-100 text-sm leading-relaxed mb-6">
            Your password has been set. Your account was pre-registered by HR — you can sign in now.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (state?.success) {
    return (
      <div className="w-full max-w-md px-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/90 rounded-2xl mb-4 shadow-lg">
            <Hourglass className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Waiting for approval</h1>
          <p className="text-blue-100 text-sm leading-relaxed mb-6">
            Your account has been created and is pending review by a superadmin. You&apos;ll be able to sign in once it&apos;s approved.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md px-6">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl mb-4 shadow-lg">
            <UserPlus className="w-8 h-8 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create account</h1>
          <p className="text-blue-200 text-sm">Sign up — pending superadmin approval</p>
        </div>

        <form action={formAction} className="space-y-5" autoComplete="off">
          <div className="space-y-2">
            <label htmlFor="reg-full-name" className="block text-sm font-medium text-blue-100 ml-1">Full Name</label>
            <input
              id="reg-full-name"
              name="fullName"
              type="text"
              required
              placeholder="e.g. AINA SOFEA BINTI HAMID"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="reg-email" className="block text-sm font-medium text-blue-100 ml-1">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-blue-300" aria-hidden="true" />
              </div>
              <input
                id="reg-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@ebright.my"
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="reg-orgunit" className="block text-sm font-medium text-blue-100 ml-1">Branch / Department</label>
            <div className="relative">
              <select
                id="reg-orgunit"
                name="orgUnit"
                defaultValue=""
                required
                className="w-full pl-4 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="" className="text-slate-900" disabled>Select branch or department</option>
                <optgroup label="Branches" className="text-slate-900">
                  {branches.map((b) => (
                    <option key={`b-${b.id}`} value={`branch:${b.id}`} className="text-slate-900">{b.code} — {b.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Departments" className="text-slate-900">
                  {departments.map((d) => (
                    <option key={`d-${d.id}`} value={`dept:${d.id}`} className="text-slate-900">{d.code} — {d.name}</option>
                  ))}
                </optgroup>
              </select>
              <ChevronRight className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 rotate-90" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="reg-position" className="block text-sm font-medium text-blue-100 ml-1">Position</label>
            <div className="relative">
              <select
                id="reg-position"
                name="position"
                defaultValue=""
                required
                className="w-full pl-4 pr-10 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer"
              >
                <option value="" className="text-slate-900" disabled>Select position</option>
                {POSITION_OPTIONS.map((p) => (
                  <option key={p} value={p} className="text-slate-900">{p}</option>
                ))}
              </select>
              <ChevronRight className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300 rotate-90" aria-hidden="true" />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="reg-password" className="block text-sm font-medium text-blue-100 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-blue-300" aria-hidden="true" />
              </div>
              <input
                id="reg-password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-300 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-blue-100 ml-1">Confirm password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-blue-300" aria-hidden="true" />
              </div>
              <input
                id="reg-confirm"
                name="confirmPassword"
                type={showConfirm ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Re-enter password"
                className="w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                aria-label={showConfirm ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-blue-300 hover:text-white transition-colors"
              >
                {showConfirm ? <EyeOff className="w-5 h-5" aria-hidden="true" /> : <Eye className="w-5 h-5" aria-hidden="true" />}
              </button>
            </div>
          </div>

          {state?.error && (
            <div role="alert" className="flex items-start gap-2 bg-red-500/20 border border-red-500/50 text-red-100 text-sm py-2.5 px-3 rounded-xl font-medium">
              <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>{state.error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {pending ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-blue-200">
          Already have an account?{" "}
          <Link href="/login" className="text-white font-semibold hover:underline">
            Sign in
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-blue-200/70">
          Accounts created here are staff-level and require superadmin approval before you can sign in.
        </p>
      </div>
    </div>
  );
}
