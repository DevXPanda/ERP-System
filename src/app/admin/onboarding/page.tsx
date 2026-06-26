"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import {
  Search,
  UserPlus,
  CheckSquare,
  Square,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";

interface Task {
  name: string;
  done: boolean;
}

interface OnboardingHire {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  joiningDate: string;
  progress: number;
  tasks: Task[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const hires = useQuery(api.hr.getOnboardingChecklist);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredHires = (hires || []).filter(
    (h: OnboardingHire) =>
      h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Onboarding Pipeline</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Track and manage onboarding task progress for recent hires.</p>
        </div>

        <button
          onClick={() => router.push("/admin/employees/create")}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 text-white rounded-xl text-xs font-medium shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
        >
          <UserPlus className="h-4 w-4" />
          <span>Onboard New Employee</span>
        </button>
      </div>

      {/* Filters */}
      <div className="relative max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-2.5 shadow-xs">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[1.8]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search new hires by name, ID, or designation..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all duration-200"
        />
      </div>

      {/* Onboarding List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {hires === undefined ? (
          <div className="col-span-2 py-12 text-center text-slate-450 dark:text-slate-550 flex flex-col items-center gap-3">
            <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading onboarding hires...</span>
          </div>
        ) : filteredHires.length > 0 ? (
          filteredHires.map((h) => (
            <div
              key={h.id}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4"
            >
              {/* Profile details */}
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-850 pb-3">
                <div className="flex gap-3 items-center">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-650 font-bold uppercase shrink-0">
                    {h.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-sm leading-none">{h.name}</h4>
                      <span className="text-[10px] bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 text-slate-400 px-1.5 py-0.2 rounded-md font-mono">{h.employeeId}</span>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-550 mt-1">{h.designation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-semibold">{h.joiningDate}</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-semibold">
                  <span className="text-slate-400 dark:text-slate-500">Onboarding Checklist</span>
                  <span className="text-indigo-650 dark:text-indigo-400">{h.progress}% Complete</span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${h.progress}%` }}
                  />
                </div>
              </div>

              {/* Checklist list */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-850/60">
                {h.tasks.map((t, index) => (
                  <div
                    key={index}
                    className="flex gap-2 items-center text-xs text-slate-600 dark:text-slate-350"
                  >
                    {t.done ? (
                      <CheckSquare className="h-4 w-4 text-emerald-500 shrink-0 stroke-[1.8]" />
                    ) : (
                      <Square className="h-4 w-4 text-slate-350 shrink-0 stroke-[1.8]" />
                    )}
                    <span className={t.done ? "line-through text-slate-400 dark:text-slate-500" : ""}>
                      {t.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <AlertCircle className="h-6 w-6 stroke-[1.5]" />
            <span className="text-xs">No onboarding pipelines found matching filters.</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
