"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Home, User, LogOut, ShieldCheck } from "lucide-react";
import { displayNameFor, formatRoleLabel, getAvatarInitials } from "@/lib/roles";

interface UserHeaderProps {
  email?: string;
  role?: string;
  name?: string | null;
}

export default function UserHeader({
  email = "",
  role = "",
  name = null,
}: UserHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login", redirect: true });
  };

  const roleLabel = formatRoleLabel(role);
  const displayName = displayNameFor(role, name, email);
  const initials = getAvatarInitials(displayName);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        aria-haspopup="menu"
        aria-expanded={dropdownOpen}
        className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <span className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center text-white font-semibold text-sm">
          {initials}
        </span>
        <span className="text-sm font-medium text-slate-700 hidden sm:block max-w-[180px] truncate">
          {displayName}
        </span>
      </button>

      {dropdownOpen && (
        <div role="menu" className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="px-4 py-4 border-b border-slate-100">
            <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
            <div className="mt-0.5 flex items-center gap-2 min-w-0">
              <span className="text-xs text-slate-500 truncate">{email}</span>
              {role && role !== "staff" && (
                <span className="inline-flex items-center shrink-0 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-inset ring-blue-200 uppercase tracking-wider">
                  {roleLabel}
                </span>
              )}
            </div>
          </div>

          <div className="py-1">
            <Link
              href="/home"
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => setDropdownOpen(false)}
            >
              <Home className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span>Home</span>
            </Link>
            <Link
              href="/profile"
              className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
              onClick={() => setDropdownOpen(false)}
            >
              <User className="w-4 h-4 text-slate-500" aria-hidden="true" />
              <span>My Profile</span>
            </Link>
            {role === "superadmin" && (
              <Link
                href="/approvals"
                className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                onClick={() => setDropdownOpen(false)}
              >
                <ShieldCheck className="w-4 h-4 text-slate-500" aria-hidden="true" />
                <span>Approvals</span>
              </Link>
            )}
          </div>

          <div className="border-t border-slate-100 py-1">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
