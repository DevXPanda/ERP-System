"use client";

import React from "react";
import Link from "next/link";
import { Shield, LogOut } from "lucide-react";
import { NAV_ITEMS, EMPLOYEE_NAV_ITEMS } from "./nav-config";
import { SidebarNavItem } from "./sidebar-nav-item";

interface AdminSidebarProps {
  /** Whether the sidebar is in icon-only collapsed mode (desktop) */
  isCollapsed: boolean;
  /** Current authenticated user's role */
  userRole?: string;
  /** Called when a nav link is clicked (closes mobile drawer) */
  onNavigate?: () => void;
  /** Render a close button (mobile drawer mode) */
  closeButton?: React.ReactNode;
  onLogout: () => void;
}

/**
 * Composable sidebar for the admin ERP layout.
 * Used in both desktop (fixed) and mobile (drawer) contexts.
 */
export function AdminSidebar({
  isCollapsed,
  userRole,
  onNavigate,
  closeButton,
  onLogout,
}: AdminSidebarProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div
        className={`h-16 border-b border-slate-150 dark:border-slate-800 flex items-center shrink-0 ${
          isCollapsed ? "px-4 justify-center" : "px-5 gap-3"
        }`}
      >
        <Link
          href="/admin"
          onClick={onNavigate}
          className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 hover:bg-indigo-700 transition-colors"
          aria-label="Go to dashboard"
        >
          <Shield className="h-4 w-4" />
        </Link>

        {!isCollapsed && (
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight flex-1 truncate">
            {userRole === "employee"
              ? "Nexora Employee"
              : userRole === "hr"
              ? "Nexora HR"
              : "Nexora Admin"}
          </span>
        )}

        {/* Mobile close button slot */}
        {closeButton}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 overflow-y-auto p-3 space-y-0.5"
        aria-label="Main navigation"
      >
        {/* Role label */}
        {!isCollapsed && userRole && (
          <div className="px-3 pb-2 pt-1">
            <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {userRole === "admin" ? "Administration" : userRole === "hr" ? "Human Resources" : "Workspace"}
            </span>
          </div>
        )}

        {(userRole === "employee" ? EMPLOYEE_NAV_ITEMS : NAV_ITEMS).map((item) => (
          <div key={item.label} onClick={item.children ? undefined : onNavigate}>
            <SidebarNavItem
              item={item}
              isCollapsed={isCollapsed}
              userRole={userRole}
            />
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-150 dark:border-slate-800 shrink-0">
        <button
          type="button"
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all duration-150 text-sm font-medium cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-rose-400 ${
            isCollapsed ? "justify-center" : ""
          }`}
          title={isCollapsed ? "Logout" : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0 stroke-[1.8]" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
