"use client";

import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import {
  LayoutDashboard,
  CalendarRange,
  Receipt,
  CalendarCheck,
  UserPlus,
  UserMinus,
  ChartPie,
  PiggyBank,
  Home,
  ChevronRight,
} from "lucide-react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface HrmsModule {
  id: string;
  title: string;
  description: string;
  href: string;
  Icon: IconComponent;
  accent: string;
  accentHover: string;
}

const modules: HrmsModule[] = [
  {
    id: "employee-dashboard",
    title: "Employee Dashboard",
    description: "View and manage all employees",
    href: "/dashboard-employee-management",
    Icon: LayoutDashboard,
    accent: "bg-blue-600",
    accentHover: "group-hover:bg-blue-700",
  },
  {
    id: "manpower-planning",
    title: "Manpower Planning",
    description: "Schedule shifts and plan staffing",
    href: "/manpower-schedule",
    Icon: CalendarRange,
    accent: "bg-violet-600",
    accentHover: "group-hover:bg-violet-700",
  },
  {
    id: "claims",
    title: "Claims",
    description: "Submit and approve expense claims",
    href: "/claim",
    Icon: Receipt,
    accent: "bg-emerald-600",
    accentHover: "group-hover:bg-emerald-700",
  },
  {
    id: "attendance",
    title: "Attendance",
    description: "Track clock-in, leaves, and hours",
    href: "/attendance",
    Icon: CalendarCheck,
    accent: "bg-amber-600",
    accentHover: "group-hover:bg-amber-700",
  },
  {
    id: "onboarding",
    title: "Onboarding",
    description: "Welcome new hires and track progress",
    href: "/onboarding",
    Icon: UserPlus,
    accent: "bg-sky-600",
    accentHover: "group-hover:bg-sky-700",
  },
  {
    id: "offboarding",
    title: "Offboarding",
    description: "Handle exits and clearances",
    href: "/offboarding",
    Icon: UserMinus,
    accent: "bg-slate-600",
    accentHover: "group-hover:bg-slate-700",
  },
  {
    id: "hr-dashboard",
    title: "HR Dashboard",
    description: "KPIs and workforce analytics",
    href: "/hr-dashboard",
    Icon: ChartPie,
    accent: "bg-rose-600",
    accentHover: "group-hover:bg-rose-700",
  },
  {
    id: "manpower-cost-report",
    title: "Manpower Cost Report",
    description: "Breakdown of labor costs",
    href: "/manpower-cost-report",
    Icon: PiggyBank,
    accent: "bg-teal-600",
    accentHover: "group-hover:bg-teal-700",
  },
];

export default function HrmsDashboard() {
  return (
    <div className="min-h-full bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 pt-4 pb-10">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/home" className="flex items-center gap-1 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded">
            <Home className="w-4 h-4" aria-hidden="true" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
          <span className="text-slate-900 font-medium">HRMS</span>
        </nav>

        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-semibold text-slate-900 tracking-tight">
            Human Resource Management
          </h1>
        </header>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map(({ id, title, description, href, Icon, accent, accentHover }) => (
            <li key={id}>
              <Link
                href={href}
                className="group block h-full bg-white border border-slate-200 rounded-2xl p-6 transition-all duration-200 hover:border-slate-300 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className={`${accent} ${accentHover} w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-200 shrink-0`}>
                    <Icon className="w-6 h-6 text-white" aria-hidden="true" />
                  </div>
                  <ChevronRight
                    className="w-5 h-5 text-slate-300 transition-all duration-200 group-hover:text-slate-600 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
                <h2 className="mt-5 text-base font-semibold text-slate-900">{title}</h2>
                <p className="mt-1 text-sm text-slate-600 leading-relaxed">{description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
