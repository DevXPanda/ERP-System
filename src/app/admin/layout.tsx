"use client";

import React, { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  Menu,
  X,
  Bell,
  Loader2,
} from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { EmployeePortal } from "@/components/employee/portal";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentUser = useQuery(api.users.current);
  const { signOut } = useAuthActions();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams ? (searchParams.get("tab") || "overview") : "overview";

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Enforce role-based routing guards on the client
  useEffect(() => {
    if (currentUser && currentUser.role === "hr") {
      // HR is not allowed to access activity logs
      if (pathname.startsWith("/admin/activity")) {
        router.push("/admin");
      }
    }
  }, [currentUser, pathname, router]);

  // Responsive: collapse sidebar on narrow desktop, close drawer on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (currentUser === undefined) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Verifying session…
          </span>
        </div>
      </div>
    );
  }

  // ── Unauthenticated ──────────────────────────────────────────────
  if (currentUser === null) {
    router.push("/login");
    return null;
  }

  // ── Employee restricted view ─────────────────────────────────────
  const renderedChildren = currentUser.role === "employee" ? (
    <EmployeePortal
      activeTab={activeTab}
    />
  ) : (
    children
  );

  // ── Admin / HR / Employee layout ─────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200 flex">
      {/* ── Desktop Sidebar ────────────────────────────────────────── */}
      <aside
        className={`bg-white dark:bg-slate-900 border-r border-slate-150 dark:border-slate-800 shrink-0 transition-all duration-300 hidden md:block ${
          isSidebarCollapsed ? "w-[72px]" : "w-64"
        }`}
      >
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          userRole={currentUser.role}
          onLogout={handleLogout}
        />
      </aside>

      {/* ── Mobile Sidebar Drawer ──────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -288 }}
              animate={{ x: 0 }}
              exit={{ x: -288 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-white dark:bg-slate-900 border-r border-slate-150 dark:border-slate-800 z-50 md:hidden"
            >
              <AdminSidebar
                isCollapsed={false}
                userRole={currentUser.role}
                onNavigate={() => setIsMobileMenuOpen(false)}
                onLogout={handleLogout}
                closeButton={
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Close menu"
                  >
                    <X className="h-5 w-5" />
                  </button>
                }
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Content ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-150 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl md:hidden transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Desktop collapse toggle */}
            <button
              onClick={() => setIsSidebarCollapsed((p) => !p)}
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl hidden md:block transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h2 className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-200 truncate">
              Welcome back,{" "}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {currentUser.name}
              </span>
            </h2>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen((p) => !p)}
                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl relative transition-colors"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-indigo-500 rounded-full" />
              </button>

              <AnimatePresence>
                {notificationsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setNotificationsOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl shadow-lg p-4 z-50"
                    >
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          Notifications
                        </span>
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                          1 New
                        </span>
                      </div>
                      <div className="space-y-3">
                        <div className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                          <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            New system registration
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            An HR specialist seeded the database successfully.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile badge */}
            <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                  {currentUser.name}
                </span>
                <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md mt-0.5">
                  {currentUser.role}
                </span>
              </div>
              <div className="sm:hidden h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase">
                {(currentUser.name || "U").charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
          {renderedChildren}
        </main>
      </div>
    </div>
  );
}
