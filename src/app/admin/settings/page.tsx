"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Settings,
  Lock,
  CheckCircle,
  Bell,
  Globe,
  DollarSign,
  ShieldAlert,
  Building,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const currentUser = useQuery(api.users.current);
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [settings, setSettings] = useState({
    notifications: true,
    weeklyDigest: false,
    timezone: "UTC-5 (EST)",
    companyName: "Nexora Enterprise Solutions LLC",
    fiscalMonth: "January",
  });

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setSuccessMsg("Settings preferences saved successfully!");
      setLoading(false);
      setTimeout(() => setSuccessMsg(""), 3500);
    }, 800);
  };

  if (!currentUser) {
    return (
      <div className="py-12 text-center text-slate-450 dark:text-slate-550 flex flex-col items-center gap-3">
        <Loader2 className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading settings...</span>
      </div>
    );
  }

  const isAdmin = currentUser.role === "admin";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Enterprise Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Configure corporate properties, notification channels, and portal credentials.</p>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3.5 rounded-xl animate-fade-in">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: General settings (Shared) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex gap-3 items-center border-b border-slate-100 dark:border-slate-850 pb-3">
              <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Settings className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs">General Preferences</h3>
                <p className="text-[10px] text-slate-400">Configure language, timezones, and display settings.</p>
              </div>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" />
                  <span>Timezone / Locale</span>
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) => setSettings((p) => ({ ...p, timezone: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                >
                  <option value="UTC-5 (EST)">UTC-5 (Eastern Standard Time)</option>
                  <option value="UTC-8 (PST)">UTC-8 (Pacific Standard Time)</option>
                  <option value="UTC+0 (GMT)">UTC+0 (Greenwich Mean Time)</option>
                  <option value="UTC+5:30 (IST)">UTC+5:30 (Indian Standard Time)</option>
                </select>
              </div>

              <div className="space-y-2 border-t border-slate-100 dark:border-slate-850 pt-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5" />
                  <span>Notification Settings</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => setSettings((p) => ({ ...p, notifications: e.target.checked }))}
                    className="h-4 w-4 rounded-sm border-slate-300 dark:border-slate-800 accent-indigo-650 cursor-pointer"
                  />
                  <span className="text-xs text-slate-650 dark:text-slate-350 font-medium">Enable real-time notification alerts</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.weeklyDigest}
                    onChange={(e) => setSettings((p) => ({ ...p, weeklyDigest: e.target.checked }))}
                    className="h-4 w-4 rounded-sm border-slate-300 dark:border-slate-800 accent-indigo-650 cursor-pointer"
                  />
                  <span className="text-xs text-slate-650 dark:text-slate-350 font-medium">Email weekly digest reports</span>
                </label>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>Save Preferences</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side: Restricted admin panels */}
        <div className="space-y-6">
          
          {/* Company configuration */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-48 select-none">
            {!isAdmin && (
              <div className="absolute inset-0 bg-slate-50/70 dark:bg-slate-950/75 backdrop-blur-[1.5px] z-10 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-550">
                <Lock className="h-6 w-6 text-slate-400 stroke-[1.8]" />
                <span className="text-xs font-semibold uppercase tracking-wider">Admin Permission Required</span>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex gap-2.5 items-center">
                <Building className="h-4.5 w-4.5 text-slate-400" />
                <h4 className="font-bold text-slate-850 dark:text-slate-100 text-xs">Company Details</h4>
              </div>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-normal">
                Update headquarters address, business registrations, legal name, tax identifiers, and contact details.
              </p>
            </div>
            
            <button
              disabled
              className="w-full py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-400 rounded-xl text-xs font-semibold"
            >
              Configure Profile
            </button>
          </div>

          {/* Payroll Configuration */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-48 select-none">
            {!isAdmin && (
              <div className="absolute inset-0 bg-slate-50/70 dark:bg-slate-950/75 backdrop-blur-[1.5px] z-10 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-550">
                <Lock className="h-6 w-6 text-slate-400 stroke-[1.8]" />
                <span className="text-xs font-semibold uppercase tracking-wider">Admin Permission Required</span>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex gap-2.5 items-center">
                <DollarSign className="h-4.5 w-4.5 text-slate-400" />
                <h4 className="font-bold text-slate-855 dark:text-slate-100 text-xs">Payroll Calendars</h4>
              </div>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-normal">
                Configure salary payment intervals (semi-monthly/monthly), direct deposits, allowances categories, and tax rates.
              </p>
            </div>
            
            <button
              disabled
              className="w-full py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-400 rounded-xl text-xs font-semibold"
            >
              Configure Payroll Schedule
            </button>
          </div>

          {/* Security Configurations */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-48 select-none">
            {!isAdmin && (
              <div className="absolute inset-0 bg-slate-50/70 dark:bg-slate-950/75 backdrop-blur-[1.5px] z-10 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-550">
                <Lock className="h-6 w-6 text-slate-400 stroke-[1.8]" />
                <span className="text-xs font-semibold uppercase tracking-wider">Admin Permission Required</span>
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex gap-2.5 items-center">
                <ShieldAlert className="h-4.5 w-4.5 text-slate-400" />
                <h4 className="font-bold text-slate-855 dark:text-slate-100 text-xs">Security & Roles</h4>
              </div>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-normal">
                Adjust multi-factor settings, login rate limits, API tokens, workspace access logs, and granular security rules.
              </p>
            </div>
            
            <button
              disabled
              className="w-full py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-slate-400 rounded-xl text-xs font-semibold"
            >
              Manage Security Parameters
            </button>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
