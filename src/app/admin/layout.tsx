"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
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
  AlertCircle,
} from "lucide-react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { EmployeePortal } from "@/components/employee/portal";
import { NavCheckIn } from "@/components/admin/nav-checkin";

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

  // Notifications and resignation state
  const notifications = useQuery(api.users.getNotifications) || [];
  const markAsRead = useMutation(api.users.markAllNotificationsAsRead);
  const submitResign = useMutation(api.users.submitResignation);
  const deactivateSelf = useMutation(api.users.deactivateSelf);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [resignModalOpen, setResignModalOpen] = useState(false);
  const [resignForm, setResignForm] = useState({ position: "", date: "", reason: "" });
  const [resigning, setResigning] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  const [deactivationCountdown, setDeactivationCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const toggleNotifications = async () => {
    const nextState = !notificationsOpen;
    setNotificationsOpen(nextState);
    if (nextState) {
      try {
        await markAsRead();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Enforce role-based routing guards on the client
  useEffect(() => {
    if (currentUser && currentUser.role === "hr") {
      // HR is not allowed to access activity logs
      if (pathname.startsWith("/admin/activity")) {
        router.push("/admin");
      }
    }
  }, [currentUser, pathname, router]);

  // Handle deactivation sync
  useEffect(() => {
    if (currentUser && currentUser.isDeactivated) {
      deactivateSelf().catch(console.error);
    }
  }, [currentUser, deactivateSelf]);

  // Handle countdown timer for resignation deactivation
  useEffect(() => {
    const deactTime = currentUser?.deactivationTime;
    if (!deactTime) {
      setDeactivationCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const diff = deactTime - Date.now();
      if (diff <= 0) {
        setDeactivationCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((diff % (60 * 1000)) / 1000);

      setDeactivationCountdown({ days, hours, minutes, seconds, isExpired: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [currentUser?.deactivationTime]);

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

  // ── Account Deactivation Guard ───────────────────────────────────
  if (currentUser.isDeactivated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-950/50 border border-red-500/30 rounded-full flex items-center justify-center text-red-500">
            <X className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Account Deactivated</h1>
            <p className="text-slate-400 text-sm">
              Your account has been deactivated as your resignation notice period has completed.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors shadow-lg hover:shadow-red-500/20"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  // ── Employee restricted view ─────────────────────────────────────
  // Employees always see the portal.
  // HR users see the portal when navigating to personal tabs (?tab=...).
  const isPersonalTab = !!searchParams?.get("tab");
  const showPortalView =
    currentUser.role === "employee" || (currentUser.role === "hr" && isPersonalTab);
  const renderedChildren = showPortalView ? (
    <EmployeePortal activeTab={activeTab} />
  ) : (
    children
  );



  // ── Admin / HR / Employee layout ─────────────────────────────────
  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-200 flex overflow-hidden">
      {/* ── Desktop Sidebar ────────────────────────────────────────── */}
      <aside
        className={`h-full bg-white dark:bg-slate-900 border-r border-slate-150 dark:border-slate-800 shrink-0 transition-all duration-300 hidden md:block ${
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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
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


          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Check In / Check Out — visible only to employees */}
            {currentUser.role === "employee" && <NavCheckIn />}

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
                onClick={toggleNotifications}
                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl relative transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-indigo-500 rounded-full" />
                )}
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
                        {unreadNotificationsCount > 0 && (
                          <span className="text-[10px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                            {unreadNotificationsCount} New
                          </span>
                        )}
                      </div>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {notifications.length > 0 ? (
                          notifications.map((notif) => (
                            <div key={notif._id} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors border-b border-slate-50 dark:border-slate-800/40">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {notif.title}
                              </p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 leading-normal">
                                {notif.content}
                              </p>
                              <p className="text-[8px] text-slate-400 mt-1">
                                {new Date(notif.timestamp).toLocaleString()}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="py-6 text-center text-xs text-slate-400">
                            No notifications yet.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Profile badge with dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen((p) => !p)}
                className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800 cursor-pointer focus:outline-hidden hover:opacity-85 transition-opacity"
              >
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md mt-0.5">
                    {currentUser.role}
                  </span>
                </div>
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase">
                  {(currentUser.name || "U").charAt(0)}
                </div>
              </button>

              <AnimatePresence>
                {profileDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl shadow-lg py-1 z-50 text-xs text-slate-700 dark:text-slate-300"
                    >
                      <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 font-semibold text-slate-800 dark:text-slate-100">
                        {currentUser.name}
                      </div>
                      
                      {currentUser.role !== "admin" && (
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            setResignModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          🚪 Submit Resignation
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        Log Out
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
          {/* Global Resignation Deactivation Countdown Banner */}
          {deactivationCountdown && !deactivationCountdown.isExpired && (
            <div className="mb-6 bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/20 dark:border-red-500/30 p-5 rounded-2xl shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg text-red-500 dark:text-red-400">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Resignation Approved — Account Expiring Soon
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Your resignation has been approved. Your access will expire in:
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex flex-col items-center p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg min-w-[50px]">
                    <span className="text-sm font-bold text-red-600 dark:text-red-400 font-mono">
                      {String(deactivationCountdown.days).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Days</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg min-w-[50px]">
                    <span className="text-sm font-bold text-red-600 dark:text-red-400 font-mono">
                      {String(deactivationCountdown.hours).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Hrs</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg min-w-[50px]">
                    <span className="text-sm font-bold text-red-600 dark:text-red-400 font-mono">
                      {String(deactivationCountdown.minutes).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Mins</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg min-w-[50px]">
                    <span className="text-sm font-bold text-red-600 dark:text-red-400 font-mono animate-pulse">
                      {String(deactivationCountdown.seconds).padStart(2, "0")}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase font-semibold">Secs</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          {renderedChildren}
        </main>
      </div>

      {/* Resignation Modal */}
      <AnimatePresence>
        {resignModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!resigning) setResignModalOpen(false);
              }}
              className="fixed inset-0 bg-slate-900/60 dark:bg-black/60 backdrop-blur-xs"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 relative z-10 space-y-4 text-slate-800 dark:text-slate-200"
            >
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Submit Resignation</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Please fill in the details below to submit your resignation.
                </p>
              </div>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!resignForm.position || !resignForm.date || !resignForm.reason) return;
                  setResigning(true);
                  try {
                    await submitResign({
                      position: resignForm.position,
                      resignationDate: resignForm.date,
                      reason: resignForm.reason,
                    });
                    setResignModalOpen(false);
                    setResignForm({ position: "", date: "", reason: "" });
                    setToastMessage({ type: "success", text: "Resignation submitted successfully." });
                    setTimeout(() => setToastMessage(null), 5000);
                  } catch (err) {
                    console.error(err);
                    setToastMessage({ type: "error", text: "Something went wrong. Please try again." });
                    setTimeout(() => setToastMessage(null), 5000);
                  } finally {
                    setResigning(false);
                  }
                }}
                className="space-y-4 text-xs"
              >
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Position / Designation
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Software Engineer / HR Associate"
                    value={resignForm.position}
                    onChange={(e) => setResignForm((prev) => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Last Working Date
                  </label>
                  <input
                    type="date"
                    required
                    value={resignForm.date}
                    onChange={(e) => setResignForm((prev) => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Reason / Remarks
                  </label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details about your resignation..."
                    value={resignForm.reason}
                    onChange={(e) => setResignForm((prev) => ({ ...prev, reason: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    disabled={resigning}
                    onClick={() => setResignModalOpen(false)}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resigning || !resignForm.position || !resignForm.date || !resignForm.reason}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-xl font-medium flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {resigning && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Submit Resignation
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-5 right-5 z-50 p-4 rounded-xl border shadow-lg text-xs font-semibold flex items-center gap-2 ${
              toastMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-slate-900 dark:border-emerald-900 dark:text-emerald-400"
                : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-slate-900 dark:border-rose-900 dark:text-rose-400"
            }`}
          >
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
