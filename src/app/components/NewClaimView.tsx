"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { Home, ChevronRight, TrendingUp, HeartPulse, Car } from "lucide-react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface ClaimType {
  id: string;
  title: string;
  description: string;
  href: string;
  Icon: IconComponent;
  iconBg: string;
  iconBgHover: string;
}

const claimTypes: ClaimType[] = [
  {
    id: "sales",
    title: "Sales Claim",
    description: "Process your sales reimbursements and commission-related expenses.",
    href: "/claim/new/sales",
    Icon: TrendingUp,
    iconBg: "#3b82f6",
    iconBgHover: "#2563eb",
  },
  {
    id: "health",
    title: "Health Claim",
    description: "Process your medical, dental, and healthcare reimbursements.",
    href: "/claim/new/health",
    Icon: HeartPulse,
    iconBg: "#10b981",
    iconBgHover: "#059669",
  },
  {
    id: "transport",
    title: "Transport",
    description: "Process your transport, mileage, and travel reimbursements.",
    href: "/claim/new/transport",
    Icon: Car,
    iconBg: "#f97316",
    iconBgHover: "#ea580c",
  },
];

export default function NewClaimView() {
  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-10 space-y-6">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500">
          <Link href="/home" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link href="/dashboards/hrms" className="hover:text-slate-900 transition-colors">HRMS</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <Link href="/claim" className="hover:text-slate-900 transition-colors">Claims</Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">New</span>
        </nav>

        <header>
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
            Select Claim Type
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose a category to submit your claim.
          </p>
        </header>

        <ul className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {claimTypes.map(({ id, title, description, href, Icon, iconBg }) => (
            <li key={id}>
              <Link
                href={href}
                className="group block h-full bg-white border border-slate-200 rounded-2xl p-8 text-center transition-all duration-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <div
                  className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: iconBg }}
                >
                  <Icon className="w-8 h-8 text-white" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-base font-bold uppercase tracking-wide text-slate-900">
                  {title}
                </h2>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
