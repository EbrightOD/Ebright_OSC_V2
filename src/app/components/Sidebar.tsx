"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import {
  Home,
  Library,
  LayoutDashboard,
  Users,
  Newspaper,
  MessageSquare,
  Package,
  GraduationCap,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface NavItem {
  name: string;
  href: string;
  Icon: IconComponent;
}

const primaryNav: NavItem[] = [
  { name: "Home", href: "/home", Icon: Home },
  { name: "Library", href: "/dashboards/library", Icon: Library },
  { name: "Internal Dashboard", href: "/dashboards/internal-dashboard", Icon: LayoutDashboard },
  { name: "HRMS", href: "/dashboards/hrms", Icon: Users },
  { name: "CRM", href: "/dashboards/crm", Icon: Newspaper },
  { name: "SMS", href: "/dashboards/sms", Icon: MessageSquare },
  { name: "Inventory", href: "/dashboards/inventory", Icon: Package },
  { name: "Academy", href: "/academy", Icon: GraduationCap },
];

const secondaryNav: NavItem[] = [
  { name: "Attendance", href: "/attendance", Icon: CalendarCheck },
  { name: "Account Management", href: "/account-management", Icon: ShieldCheck },
];

interface SidebarProps {
  collapsed: boolean;
}

export default function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col shrink-0 transition-[width] duration-200 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <Link
        href="/home"
        aria-label="Ebright Portal — Home"
        className={`flex items-center h-16 border-b border-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
          collapsed ? "justify-center px-0" : "px-5"
        }`}
      >
        {collapsed ? (
          <span className="w-9 h-9 rounded-md bg-red-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
            e
          </span>
        ) : (
          <img
            src="/ebright-logo.png"
            alt="Ebright"
            className="h-8 w-auto"
          />
        )}
      </Link>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
        <NavSection label="Workspace" items={primaryNav} pathname={pathname} collapsed={collapsed} />
        <div className="my-3 mx-3 border-t border-slate-100" />
        <NavSection label="Quick Access" items={secondaryNav} pathname={pathname} collapsed={collapsed} />
      </nav>
    </aside>
  );
}

function NavSection({
  label,
  items,
  pathname,
  collapsed,
}: {
  label: string;
  items: NavItem[];
  pathname: string | null;
  collapsed: boolean;
}) {
  return (
    <div className="px-3">
      {!collapsed && (
        <p className="px-3 mb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </p>
      )}
      <ul className="space-y-1">
        {items.map(({ name, href, Icon }) => {
          const isActive = pathname === href || pathname?.startsWith(href + "/");
          return (
            <li key={name}>
              <Link
                href={href}
                title={collapsed ? name : undefined}
                aria-current={isActive ? "page" : undefined}
                className={`relative flex items-center gap-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  collapsed ? "justify-center h-10 w-10 mx-auto" : "px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {isActive && !collapsed && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-blue-600 rounded-r" aria-hidden="true" />
                )}
                <Icon
                  className={`w-5 h-5 shrink-0 ${isActive ? "text-blue-600" : "text-slate-500"}`}
                  aria-hidden="true"
                />
                {!collapsed && <span className="whitespace-nowrap">{name}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
