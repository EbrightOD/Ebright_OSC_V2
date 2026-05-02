"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  Home,
  LayoutDashboard,
  UserMinus,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

interface Props {
  canManageInductions: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  matchType?: string;
}

export function HRMSSidebar({ canManageInductions }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") ?? "";

  const items: NavItem[] = [
    { href: "/dashboards/hrms", label: "HRMS Home", icon: Home },
    ...(canManageInductions
      ? [{ href: "/induction/hr-dashboard", label: "HR Dashboard", icon: LayoutDashboard }]
      : []),
    {
      href: "/induction/onboarding-dashboard?type=onboarding",
      label: "Onboarding",
      icon: UserPlus,
      matchType: "onboarding",
    },
    {
      href: "/induction/onboarding-dashboard?type=offboarding",
      label: "Offboarding",
      icon: UserMinus,
      matchType: "offboarding",
    },
    ...(canManageInductions
      ? [
          {
            href: "/induction/control-centre",
            label: "Control Centre",
            icon: ClipboardList,
          },
        ]
      : []),
    {
      href: "/dashboard-employee-management",
      label: "All Employees",
      icon: Users,
    },
  ];

  function isActive(item: NavItem): boolean {
    if (item.matchType !== undefined) {
      return (
        pathname === "/induction/onboarding-dashboard" &&
        currentType === item.matchType
      );
    }
    return pathname === item.href.split("?")[0];
  }

  return (
    <aside className="hidden md:block w-56 shrink-0 border-r border-slate-200 bg-white">
      <nav className="sticky top-0 p-4 space-y-1">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          HRMS
        </p>
        {items.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon
                className={`w-4 h-4 ${
                  active
                    ? "text-blue-700"
                    : "text-slate-500 group-hover:text-slate-700"
                }`}
                aria-hidden="true"
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
