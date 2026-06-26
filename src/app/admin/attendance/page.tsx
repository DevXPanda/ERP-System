"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Clock,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  MapPin,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";

interface AttendanceRecord {
  _id: string;
  userId: string;
  employeeName: string;
  employeeEmail: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: string;
  location?: string;
}

export default function AttendancePage() {
  const records = useQuery(api.hr.getAttendanceRecords);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  const handleExportCSV = () => {
    if (!filteredRecords || filteredRecords.length === 0) return;
    
    const headers = ["Employee Name", "Date", "Check In", "Check Out", "Status", "Location"];
    const rows = filteredRecords.map((r) => [
      r.employeeName,
      r.date,
      r.checkIn,
      r.checkOut || "-",
      r.status.toUpperCase(),
      r.location || "-",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = (records || []).filter((r: AttendanceRecord) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesDate = !dateFilter || r.date === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const recordsToday = (records || []).filter((r) => r.date === todayStr);
  const presentCount = recordsToday.filter((r) => r.status === "present" || r.status === "late").length;
  const lateCount = recordsToday.filter((r) => r.status === "late").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Attendance Monitoring</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time check-in logs, locations, and timecard offsets.</p>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={!filteredRecords.length}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 text-white rounded-xl text-xs font-medium shadow-xs disabled:opacity-50 transition-all duration-150 cursor-pointer"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Checked-in Today</span>
            <h3 className="text-xl font-semibold text-slate-850 dark:text-slate-100 mt-0.5">{presentCount}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Late Check-ins Today</span>
            <h3 className="text-xl font-semibold text-slate-850 dark:text-slate-100 mt-0.5">{lateCount}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-950/30 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Total Logged Records</span>
            <h3 className="text-xl font-semibold text-slate-850 dark:text-slate-100 mt-0.5">{records?.length || 0}</h3>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        
        {/* Filters Panel */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[1.8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by employee name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all duration-200"
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Status Filter */}
            <div className="relative shrink-0">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-350 text-xs font-semibold focus:outline-hidden appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="present">On Time</option>
                <option value="late">Late</option>
              </select>
            </div>

            {/* Date Filter */}
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-350 text-xs font-semibold focus:outline-hidden cursor-pointer"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-850">
                <th className="p-4">Employee</th>
                <th className="p-4">Date</th>
                <th className="p-4">Check In</th>
                <th className="p-4">Check Out</th>
                <th className="p-4">Status</th>
                <th className="p-4">Geofence Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {records === undefined ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-450 dark:text-slate-550">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Fetching logs...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-500 font-semibold shrink-0 uppercase">
                          {r.employeeName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-100">{r.employeeName}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{r.employeeEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-medium">{r.date}</td>
                    <td className="p-4 text-slate-800 dark:text-slate-200 font-semibold">{r.checkIn}</td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-semibold">{r.checkOut || "-"}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                        r.status === "present"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {r.status === "present" ? "On Time" : "Late"}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 stroke-[1.8]" />
                        <span>{r.location || "Office Center"}</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                    <AlertCircle className="h-6 w-6 stroke-[1.5]" />
                    <span className="text-xs">No attendance records found matching filters.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
