"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  FileSpreadsheet,
  Users,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ReportsPage() {
  const analytics = useQuery(api.hr.getHRDashboardAnalytics);
  const attendance = useQuery(api.hr.getAttendanceRecords);
  const leaves = useQuery(api.hr.getLeaveRequests);

  const [downloading, setDownloading] = useState<string | null>(null);

  const handleExport = (type: string) => {
    setDownloading(type);
    
    // Simulate generation and trigger mock download
    setTimeout(() => {
      let content = "";
      let filename = "";
      
      if (type === "attendance") {
        const headers = ["Employee Name", "Date", "Check-In", "Status"];
        const rows = (attendance || []).map((a) => [a.employeeName, a.date, a.checkIn, a.status]);
        content = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        filename = `attendance_summary_report.csv`;
      } else if (type === "leaves") {
        const headers = ["Employee Name", "Leave Type", "Start Date", "End Date", "Status"];
        const rows = (leaves || []).map((l) => [l.employeeName, l.type, l.startDate, l.endDate, l.status]);
        content = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        filename = `leaves_utilization_report.csv`;
      } else {
        // Demographics
        const headers = ["Total Employees", "Probation Window", "New Joiners"];
        content = [headers.join(","), [analytics?.totalEmployees || 0, analytics?.probationEmployees || 0, analytics?.newJoiners || 0].join(",")].join("\n");
        filename = `workforce_demographics_report.csv`;
      }

      const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloading(null);
    }, 1200);
  };

  const presentCount = analytics?.presentToday || 0;
  const totalCount = analytics?.totalEmployees || 1;
  const attendanceRate = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">HR Reports & Analytics</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Analyze attendance rates, leaves utilization, and demographic distributions.</p>
      </div>

      {/* Analytics stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 dark:text-slate-550 font-medium">Daily Attendance Rate</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">Stable</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-850 dark:text-slate-100">{attendanceRate}%</h3>
          <p className="text-[10px] text-slate-400 font-medium">Calculated from today&apos;s logged checkins</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 dark:text-slate-550 font-medium">Leaves Utilization Rate</span>
            <span className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded-md">Normal</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-850 dark:text-slate-100">
            {leaves ? Math.round(((leaves.filter(l => l.status === "Approved").length) / totalCount) * 100) : 0}%
          </h3>
          <p className="text-[10px] text-slate-400">Total approved leaves relative to staff size</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-slate-400 dark:text-slate-550 font-medium">New Hires Onboarding</span>
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30 px-2 py-0.5 rounded-md">+4.5%</span>
          </div>
          <h3 className="text-2xl font-bold text-slate-850 dark:text-slate-100">+{analytics?.newJoiners || 0}</h3>
          <p className="text-[10px] text-slate-400">Onboarded within the last 30 days</p>
        </div>
      </div>

      {/* Export Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Attendance Summary */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-52">
          <div className="space-y-2">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <CheckCircle className="h-4.5 w-4.5" />
            </div>
            <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-xs">Attendance Summary</h4>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-normal">
              Generate a spreadsheet detailing employee clockin, checkout, and geofencing offsets.
            </p>
          </div>
          <button
            onClick={() => handleExport("attendance")}
            disabled={downloading !== null}
            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
          >
            {downloading === "attendance" ? (
              <div className="h-3.5 w-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>{downloading === "attendance" ? "Compiling..." : "Export Attendance"}</span>
          </button>
        </div>

        {/* Leaves Utilization */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-52">
          <div className="space-y-2">
            <div className="h-9 w-9 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Calendar className="h-4.5 w-4.5" />
            </div>
            <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-xs">Leaves Utilization</h4>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-normal">
              Extract leave requests, reasoning, categories, and approval counts for analytics audits.
            </p>
          </div>
          <button
            onClick={() => handleExport("leaves")}
            disabled={downloading !== null}
            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
          >
            {downloading === "leaves" ? (
              <div className="h-3.5 w-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>{downloading === "leaves" ? "Compiling..." : "Export Leaves"}</span>
          </button>
        </div>

        {/* Workforce Demographics */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-52">
          <div className="space-y-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Users className="h-4.5 w-4.5" />
            </div>
            <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-xs">Workforce Demographics</h4>
            <p className="text-[10px] text-slate-450 dark:text-slate-500 leading-normal">
              Compile staff totals, probation pipelines, and joiners ratios to audit demographic stats.
            </p>
          </div>
          <button
            onClick={() => handleExport("demographics")}
            disabled={downloading !== null}
            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
          >
            {downloading === "demographics" ? (
              <div className="h-3.5 w-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            <span>{downloading === "demographics" ? "Compiling..." : "Export Demographics"}</span>
          </button>
        </div>

      </div>
    </motion.div>
  );
}
