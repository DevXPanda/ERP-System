"use client";

import React, { useState, useEffect, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight } from "lucide-react";
import type { NavItem } from "./nav-config";

interface SidebarNavItemProps {
  item: NavItem;
  isCollapsed: boolean; // sidebar is in icon-only mode
  userRole?: string;
}

/**
 * A single sidebar nav entry.
 * - Leaf nodes: renders a Next.js <Link>
 * - Parent nodes: renders a collapsible group with animated children
 */
export function SidebarNavItem({ item, isCollapsed, userRole }: SidebarNavItemProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? (searchParams.get("tab") || "overview") : "overview";

  // ── Helpers ──────────────────────────────────────────────────────
  const isChildActive = (item.children ?? []).some((c) => pathname === c.href || pathname.startsWith(c.href + "/"));
  const isLeafActive = !item.children && !!item.href && (() => {
    if (item.href.includes("?tab=")) {
      const url = new URL(item.href, "http://localhost");
      const itemTab = url.searchParams.get("tab");
      return pathname === url.pathname && currentTab === itemTab;
    }
    return pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
  })();

  // ── Dropdown open state (persisted in localStorage) ──────────────
  const storageKey = item.storageKey ?? null;

  const readStorage = useCallback((): boolean => {
    if (!storageKey || typeof window === "undefined") return false;
    try {
      return localStorage.getItem(storageKey) === "true";
    } catch {
      return false;
    }
  }, [storageKey]);

  const [isOpen, setIsOpen] = useState<boolean>(() => false); // hydration-safe default

  // After mount: restore from localStorage OR auto-open if a child is active
  useEffect(() => {
    setIsOpen(readStorage() || isChildActive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-expand when navigating to a child route
  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
      if (storageKey) {
        try { localStorage.setItem(storageKey, "true"); } catch { /* noop */ }
      }
    }
  }, [isChildActive, storageKey]);

  const toggleOpen = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (storageKey) {
        try { localStorage.setItem(storageKey, String(next)); } catch { /* noop */ }
      }
      return next;
    });
  };

  // Role guard — placed after all hooks so hook call order is always consistent
  if (item.roles && userRole && !item.roles.includes(userRole)) return null;

  // ── Shared classes ───────────────────────────────────────────────
  const baseClass =
    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 w-full text-left";

  const activeClass = "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400";
  const inactiveClass =
    "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200";

  const parentActiveClass =
    "bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200";

  // ── LEAF NODE ────────────────────────────────────────────────────
  if (!item.children) {
    return (
      <Link
        href={item.href!}
        className={`${baseClass} ${isLeafActive ? activeClass : inactiveClass}`}
        aria-current={isLeafActive ? "page" : undefined}
        title={isCollapsed ? item.label : undefined}
      >
        <item.icon
          className={`h-5 w-5 shrink-0 stroke-[1.8] transition-colors duration-150 ${
            isLeafActive
              ? "text-indigo-600 dark:text-indigo-400"
              : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
          }`}
        />
        {!isCollapsed && (
          <span className="truncate">{item.label}</span>
        )}
        {/* Active indicator dot when collapsed */}
        {isCollapsed && isLeafActive && (
          <span className="absolute right-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
        )}
      </Link>
    );
  }

  // ── PARENT / DROPDOWN NODE ───────────────────────────────────────
  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        onKeyDown={(e) => e.key === "Enter" && toggleOpen()}
        aria-expanded={isOpen}
        className={`${baseClass} ${
          isChildActive ? parentActiveClass : inactiveClass
        } ${isCollapsed ? "justify-center" : "justify-between"}`}
        title={isCollapsed ? item.label : undefined}
      >
        <div className="flex items-center gap-3 min-w-0">
          <item.icon
            className={`h-5 w-5 shrink-0 stroke-[1.8] transition-colors duration-150 ${
              isChildActive
                ? "text-indigo-600 dark:text-indigo-400"
                : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
            }`}
          />
          {!isCollapsed && (
            <span className="truncate">{item.label}</span>
          )}
        </div>

        {!isCollapsed && (
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="shrink-0"
          >
            <ChevronRight
              className={`h-4 w-4 stroke-[1.8] transition-colors duration-150 ${
                isChildActive ? "text-indigo-500" : "text-slate-400"
              }`}
            />
          </motion.div>
        )}

        {/* Active dot when collapsed and child is active */}
        {isCollapsed && isChildActive && (
          <span className="absolute right-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
        )}
      </button>

      {/* Children */}
      <AnimatePresence initial={false}>
        {isOpen && !isCollapsed && (
          <motion.div
            key="children"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* Vertical guide line */}
            <div className="ml-4 mt-1 border-l-2 border-slate-100 dark:border-slate-800 pl-3 space-y-0.5 pb-1">
              {item.children.map((child) => {
                const childActive = pathname === child.href || pathname.startsWith(child.href + "/");
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    aria-current={childActive ? "page" : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                      childActive
                        ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400"
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
                    }`}
                  >
                    <child.icon
                      className={`h-3.5 w-3.5 shrink-0 stroke-[1.8] ${
                        childActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"
                      }`}
                    />
                    <span className="truncate">{child.label}</span>
                    {childActive && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed tooltip for children on hover — simple title-based */}
      {isCollapsed && isOpen && (
        <div className="absolute left-full top-0 ml-2 z-50 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-700 rounded-xl shadow-lg py-1.5 min-w-[160px]">
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-700 mb-1">
            {item.label}
          </div>
          {item.children.map((child) => {
            const childActive = pathname === child.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                className={`flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors duration-150 ${
                  childActive
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                <child.icon className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
                {child.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
