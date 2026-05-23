"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  Settings,
  UserMinus,
  UserPlus,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

interface Props {
  canManageInductions: boolean;
  /** When provided, shows a count badge next to the Onboarding item. */
  onboardingCount?: number;
  /** Footer user info — all opt-in. Pass at least name to show the footer. */
  userName?: string | null;
  userEmail?: string | null;
  /** Display label for role (e.g. "HR Manager", "Administrator"). Defaults to "User". */
  userRoleLabel?: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  matchType?: string;
  disabled?: boolean;
}

interface NavGroup {
  label: string | null;
  items: NavItem[];
}

export function HRMSSidebar({
  canManageInductions,
  onboardingCount,
  userName,
  userEmail,
  userRoleLabel = "User",
}: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") ?? "";

  const groups: NavGroup[] = [
    {
      label: null,
      items: [{ href: "/dashboards/hrms", label: "HRMS Home", icon: Home }],
    },
    {
      label: "Main",
      items: [
        ...(canManageInductions
          ? [{ href: "/induction/hr-dashboard", label: "Dashboard", icon: LayoutDashboard }]
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
        { href: "#", label: "Reports", icon: BarChart3, disabled: true },
      ],
    },
    {
      label: "Management",
      items: [
        { href: "/dashboard-employee-management", label: "User Management", icon: Users },
        { href: "#", label: "Documents", icon: FileText, disabled: true },
      ],
    },
    {
      label: "Tools",
      items: [
        ...(canManageInductions
          ? [
              {
                href: "/induction/control-centre",
                label: "Control Centre",
                icon: ClipboardList,
              },
            ]
          : []),
        { href: "#", label: "Dept. Workflows", icon: Workflow, disabled: true },
        { href: "#", label: "Settings", icon: Settings, disabled: true },
      ],
    },
  ];

  function isActive(item: NavItem): boolean {
    if (item.disabled) return false;
    if (item.matchType !== undefined) {
      return (
        pathname === "/induction/onboarding-dashboard" &&
        currentType === item.matchType
      );
    }
    return pathname === item.href.split("?")[0];
  }

  const initials = getInitials(userName);

  return (
    <aside className="hidden md:flex md:flex-col w-56 shrink-0 border-r border-slate-200 bg-white">
      <nav className="flex-1 sticky top-0 p-4 space-y-3 overflow-y-auto">
        {groups.map((group, i) => (
          <div key={group.label ?? `top-${i}`} className="space-y-1">
            {group.label && (
              <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item);
              const Icon = item.icon;
              const showBadge =
                item.label === "Onboarding" &&
                typeof onboardingCount === "number" &&
                onboardingCount > 0;
              const className = `group flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                item.disabled
                  ? "text-slate-400 cursor-not-allowed"
                  : active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              }`;
              const iconClassName = `w-4 h-4 ${
                item.disabled
                  ? "text-slate-300"
                  : active
                    ? "text-blue-700"
                    : "text-slate-500 group-hover:text-slate-700"
              }`;
              const content = (
                <>
                  <Icon className={iconClassName} aria-hidden="true" />
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <span className="rounded-full bg-blue-600 text-white text-[10px] font-semibold px-1.5 py-0.5 tabular-nums min-w-[20px] text-center">
                      {onboardingCount}
                    </span>
                  )}
                  {item.disabled && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Soon
                    </span>
                  )}
                </>
              );
              return item.disabled ? (
                <div
                  key={item.label}
                  className={className}
                  aria-disabled="true"
                  tabIndex={-1}
                  title="Coming soon"
                >
                  {content}
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={className}
                  aria-current={active ? "page" : undefined}
                >
                  {content}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {userName && (
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full bg-blue-200 text-blue-800 font-semibold text-sm flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">{userName}</p>
              <p className="text-[11px] text-slate-500 truncate">{userRoleLabel}</p>
              {userEmail && (
                <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

/** Two-letter initials from a name like "Jane Doe" → "JD". */
function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
