"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Clock,
  Search,
  Filter,
  Download,
  AlertCircle,
  CheckCircle,
  MapPin,
  Calendar,
  User,
  ChevronDown,
  Timer,
  TrendingUp,
  Plus,
  Pencil,
  Trash2,
  X,
  MessageSquare,
  Save,
  Loader2,
  Info,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AttendanceRecord {
  _id: string;
  userId: string;
  employeeName: string;
  employeeEmail: string;
  employeeId: string;
  designation: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: string;
  location?: string;
  adminRemarks?: string;
  adminEditedAt?: number;
  adminEditedBy?: string;
}

/** Compute HH:MM duration between two "HH:MM" strings. Returns "" if invalid. */
function calcDuration(checkIn: string, checkOut?: string): string {
  if (!checkOut) return "";
  const [inH, inM] = checkIn.split(":").map(Number);
  const [outH, outM] = checkOut.split(":").map(Number);
  const totalMin = outH * 60 + outM - (inH * 60 + inM);
  if (totalMin <= 0) return "";
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

type DrawerMode = "view-edit" | "create";

const STATUS_OPTIONS = [
  { value: "present", label: "On Time" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
];

export default function AttendancePage() {
  const records = useQuery(api.hr.getAttendanceRecords);
  const profileData = useQuery(api.employee.getMyProfile);
  const isAdmin = profileData?.user?.role === "admin";

  // Mutations
  const updateRecord = useMutation(api.hr.updateAttendanceRecord);
  const deleteRecord = useMutation(api.hr.deleteAttendanceRecord);
  const addRecord = useMutation(api.hr.addAttendanceRecord);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  // Drawer states
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<DrawerMode>("view-edit");
  const [activeRecord, setActiveRecord] = useState<AttendanceRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerMessage, setDrawerMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state (for both edit and create)
  const [form, setForm] = useState({
    date: "",
    checkIn: "",
    checkOut: "",
    status: "present",
    location: "",
    adminRemarks: "",
    // create-only
    userId: "",
  });

  // Build unique employee list
  const employeeList = useMemo(() => {
    if (!records) return [];
    const seen = new Map<string, { name: string; email: string; designation: string; employeeId: string }>();
    for (const r of records) {
      if (!seen.has(r.userId)) {
        seen.set(r.userId, { name: r.employeeName, email: r.employeeEmail, designation: r.designation, employeeId: r.employeeId });
      }
    }
    return Array.from(seen.entries()).map(([userId, info]) => ({ userId, ...info }));
  }, [records]);

  // Open drawer for editing an existing record
  const openEditDrawer = (r: AttendanceRecord) => {
    setActiveRecord(r);
    setDrawerMode("view-edit");
    setForm({
      date: r.date,
      checkIn: r.checkIn,
      checkOut: r.checkOut || "",
      status: r.status,
      location: r.location || "",
      adminRemarks: r.adminRemarks || "",
      userId: r.userId,
    });
    setConfirmDelete(false);
    setDrawerMessage(null);
    setDrawerOpen(true);
  };

  // Open drawer for creating a new record
  const openCreateDrawer = () => {
    setActiveRecord(null);
    setDrawerMode("create");
    setForm({
      date: new Date().toISOString().split("T")[0],
      checkIn: "09:00",
      checkOut: "",
      status: "present",
      location: "HQ Sector",
      adminRemarks: "",
      userId: employeeList[0]?.userId || "",
    });
    setConfirmDelete(false);
    setDrawerMessage(null);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setConfirmDelete(false);
    setDrawerMessage(null);
  };

  // Save (update or create)
  const handleSave = async () => {
    setDrawerLoading(true);
    setDrawerMessage(null);
    try {
      if (drawerMode === "view-edit" && activeRecord) {
        await updateRecord({
          attendanceId: activeRecord._id as Id<"attendance">,
          date: form.date || undefined,
          checkIn: form.checkIn || undefined,
          checkOut: form.checkOut || undefined,
          status: form.status || undefined,
          location: form.location || undefined,
          adminRemarks: form.adminRemarks || undefined,
        });
        setDrawerMessage({ type: "success", text: "Record updated successfully." });
      } else {
        if (!form.userId) throw new Error("Please select an employee.");
        if (!form.date) throw new Error("Date is required.");
        if (!form.checkIn) throw new Error("Check-in time is required.");
        await addRecord({
          userId: form.userId,
          date: form.date,
          checkIn: form.checkIn,
          checkOut: form.checkOut || undefined,
          status: form.status,
          location: form.location || undefined,
          adminRemarks: form.adminRemarks || undefined,
        });
        setDrawerMessage({ type: "success", text: "Attendance record created successfully." });
        setTimeout(() => closeDrawer(), 1200);
      }
    } catch (err: unknown) {
      setDrawerMessage({ type: "error", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setDrawerLoading(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!activeRecord) return;
    setDrawerLoading(true);
    setDrawerMessage(null);
    try {
      await deleteRecord({ attendanceId: activeRecord._id as Id<"attendance"> });
      setDrawerMessage({ type: "success", text: "Record deleted." });
      setTimeout(() => closeDrawer(), 800);
    } catch (err: unknown) {
      setDrawerMessage({ type: "error", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setDrawerLoading(false);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredRecords || filteredRecords.length === 0) return;
    const headers = ["Employee", "Employee ID", "Designation", "Date", "Check In", "Check Out", "Duration", "Status", "Location", "Admin Remarks", "Last Edited By", "Last Edited At"];
    const rows = filteredRecords.map((r) => [
      r.employeeName, r.employeeId || "-", r.designation || "-", r.date, r.checkIn,
      r.checkOut || "-", calcDuration(r.checkIn, r.checkOut) || "-", r.status.toUpperCase(),
      r.location || "-", r.adminRemarks || "-", r.adminEditedBy || "-",
      r.adminEditedAt ? new Date(r.adminEditedAt).toLocaleString() : "-",
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `attendance_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter logic
  const baseRecords = useMemo(() => {
    if (!records) return [];
    if (selectedEmployee) return records.filter((r) => r.userId === selectedEmployee);
    return records;
  }, [records, selectedEmployee]);

  const filteredRecords = useMemo(() =>
    baseRecords.filter((r: AttendanceRecord) => {
      const matchSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) || r.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchDate = !dateFilter || r.date === dateFilter;
      return matchSearch && matchStatus && matchDate;
    }),
    [baseRecords, searchTerm, statusFilter, dateFilter]
  );

  // Today stats
  const todayStr = new Date().toISOString().split("T")[0];
  const recordsToday = (records || []).filter((r) => r.date === todayStr);
  const presentCount = recordsToday.filter((r) => r.status === "present" || r.status === "late").length;
  const lateCount = recordsToday.filter((r) => r.status === "late").length;

  // Selected employee info + stats
  const selectedEmpInfo = employeeList.find((e) => e.userId === selectedEmployee);
  const empStats = useMemo(() => {
    if (!selectedEmployee || !records) return null;
    const empRecords = records.filter((r) => r.userId === selectedEmployee);
    const present = empRecords.filter((r) => r.status === "present").length;
    const late = empRecords.filter((r) => r.status === "late").length;
    let totalMin = 0;
    for (const r of empRecords) {
      if (r.checkIn && r.checkOut) {
        const [inH, inM] = r.checkIn.split(":").map(Number);
        const [outH, outM] = r.checkOut.split(":").map(Number);
        totalMin += outH * 60 + outM - (inH * 60 + inM);
      }
    }
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return { total: empRecords.length, present, late, hours: `${h}h ${String(m).padStart(2, "0")}m` };
  }, [selectedEmployee, records]);

  // Close drawer on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const inputCls = "w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors";

  return (
    <>
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
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time check-in logs, locations, and timecard offsets.{isAdmin && " Click any row to edit."}</p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={openCreateDrawer}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium shadow-xs transition-all duration-150 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Record</span>
              </button>
            )}
            <button
              onClick={handleExportCSV}
              disabled={!filteredRecords.length}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium shadow-xs disabled:opacity-50 transition-all duration-150 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Overview stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0"><CheckCircle className="h-5 w-5" /></div>
            <div><span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Checked-in Today</span><h3 className="text-xl font-semibold text-slate-850 dark:text-slate-100 mt-0.5">{presentCount}</h3></div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0"><Clock className="h-5 w-5" /></div>
            <div><span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Late Check-ins Today</span><h3 className="text-xl font-semibold text-slate-850 dark:text-slate-100 mt-0.5">{lateCount}</h3></div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-950/30 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0"><Calendar className="h-5 w-5" /></div>
            <div><span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Total Logged Records</span><h3 className="text-xl font-semibold text-slate-850 dark:text-slate-100 mt-0.5">{records?.length || 0}</h3></div>
          </div>
        </div>

        {/* Employee Selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-500 shrink-0" />
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Employee Filter</h2>
            <span className="text-[10px] text-slate-400 ml-1">— Select an employee to scope the table</span>
          </div>
          <div className="relative max-w-xs">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-300 text-xs font-semibold focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="">— All Employees —</option>
              {employeeList.map((emp) => (
                <option key={emp.userId} value={emp.userId}>
                  {emp.name}{emp.employeeId ? ` (${emp.employeeId})` : ""}
                </option>
              ))}
            </select>
          </div>

          <AnimatePresence>
            {selectedEmpInfo && empStats && (
              <motion.div
                key="emp-detail"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/10 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase shrink-0">
                      {selectedEmpInfo.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{selectedEmpInfo.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {selectedEmpInfo.designation && <span>{selectedEmpInfo.designation} • </span>}
                        {selectedEmpInfo.email}
                        {selectedEmpInfo.employeeId && <span className="font-mono ml-1 text-indigo-500"> [{selectedEmpInfo.employeeId}]</span>}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedEmployee("")} className="text-[10px] text-slate-400 hover:text-rose-500 font-semibold transition-colors">Clear ×</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Total Days", value: empStats.total, cls: "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100" },
                    { label: "On Time", value: empStats.present, cls: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400" },
                    { label: "Late", value: empStats.late, cls: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-400" },
                    { label: "Total Hours", value: empStats.hours, cls: "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400" },
                  ].map((s) => (
                    <div key={s.label} className={`border rounded-xl p-3 text-center ${s.cls}`}>
                      <p className="text-base font-bold">{s.value}</p>
                      <span className="text-[9px] uppercase tracking-wider font-semibold opacity-70">{s.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Main Table Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[1.8]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by employee name or email..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-200"
              />
            </div>
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-350 text-xs font-semibold focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="present">On Time</option>
                  <option value="late">Late</option>
                </select>
              </div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-750 dark:text-slate-350 text-xs font-semibold focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {filteredRecords.length > 0 && (
            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
              <Info className="h-3 w-3" />
              Showing <span className="font-semibold text-slate-600 dark:text-slate-300 mx-0.5">{filteredRecords.length}</span> record{filteredRecords.length !== 1 ? "s" : ""}. Click any row to view or edit.
            </p>
          )}

          {/* Table */}
          <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-850">
                  <th className="p-4">Employee</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Check In</th>
                  <th className="p-4">Check Out</th>
                  <th className="p-4">Duration</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {records === undefined ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-450 dark:text-slate-550">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <span>Fetching logs...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRecords.length > 0 ? (
                  filteredRecords.map((r) => {
                    const duration = calcDuration(r.checkIn, r.checkOut);
                    const isActive = activeRecord?._id === r._id && drawerOpen;
                    return (
                      <tr
                        key={r._id}
                        onClick={isAdmin ? () => openEditDrawer(r) : undefined}
                        className={`transition-colors ${
                          isAdmin
                            ? "cursor-pointer group hover:bg-slate-50 dark:hover:bg-slate-850/20"
                            : ""
                        } ${
                          isActive
                            ? "bg-indigo-50 dark:bg-indigo-950/20"
                            : ""
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-500 font-semibold shrink-0 uppercase">
                              {r.employeeName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{r.employeeName}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{r.employeeEmail}</p>
                              {r.designation && <p className="text-[9px] text-indigo-500 dark:text-indigo-400 font-medium mt-0.5">{r.designation}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 font-medium font-mono">{r.date}</td>
                        <td className="p-4 text-slate-800 dark:text-slate-200 font-semibold font-mono">{r.checkIn}</td>
                        <td className="p-4 text-slate-500 dark:text-slate-400 font-semibold font-mono">
                          {r.checkOut || <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="p-4">
                          {duration ? (
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                              <Timer className="h-3 w-3 text-indigo-400 shrink-0" />
                              <span className="font-mono font-medium">{duration}</span>
                            </div>
                          ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                            r.status === "present"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : r.status === "absent"
                              ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                              : "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                          }`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {r.status === "present" ? "On Time" : r.status === "absent" ? "Absent" : "Late"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <MapPin className="h-3.5 w-3.5 text-slate-400 stroke-[1.8] shrink-0" />
                            <span className="truncate max-w-[120px]">{r.location || "Office Center"}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {r.adminRemarks ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/40 rounded-full text-[10px] font-semibold">
                                <MessageSquare className="h-2.5 w-2.5 shrink-0" />
                                Remark
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700 text-[10px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <AlertCircle className="h-6 w-6 stroke-[1.5]" />
                        <span className="text-xs">No attendance records found matching filters.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredRecords.length > 0 && (
            <p className="text-[10px] text-slate-400 flex items-center gap-1 pt-1">
              <TrendingUp className="h-3 w-3" />
              Duration is computed from Check In → Check Out. Rows without checkout show —
            </p>
          )}
        </div>
      </motion.div>

      {/* ── SLIDE-OVER DRAWER ─────────────────────────────────────────── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-40"
              onClick={closeDrawer}
            />

            {/* Drawer panel */}
            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col border-l border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
                <div className="flex items-center gap-2">
                  {drawerMode === "create" ? (
                    <Plus className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Pencil className="h-4 w-4 text-indigo-500" />
                  )}
                  <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {drawerMode === "create" ? "Add Attendance Record" : "Edit Attendance Record"}
                  </h2>
                </div>
                <button onClick={closeDrawer} className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer Body — scrollable */}
              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                {/* Employee identity (edit mode) */}
                {drawerMode === "view-edit" && activeRecord && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl">
                    <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase shrink-0">
                      {activeRecord.employeeName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{activeRecord.employeeName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {activeRecord.designation && <span>{activeRecord.designation} • </span>}
                        {activeRecord.employeeEmail}
                        {activeRecord.employeeId && <span className="font-mono ml-1 text-indigo-500">[{activeRecord.employeeId}]</span>}
                      </p>
                    </div>
                  </div>
                )}

                {/* Employee selector (create mode) */}
                {drawerMode === "create" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Employee *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      <select
                        value={form.userId}
                        onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                        className={`${inputCls} pl-9 appearance-none cursor-pointer`}
                      >
                        <option value="">Select employee…</option>
                        {employeeList.map((emp) => (
                          <option key={emp.userId} value={emp.userId}>
                            {emp.name}{emp.employeeId ? ` (${emp.employeeId})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Last edit audit info */}
                {drawerMode === "view-edit" && activeRecord?.adminEditedAt && (
                  <div className="flex items-start gap-2 p-3 bg-violet-50 dark:bg-violet-950/10 border border-violet-100 dark:border-violet-900/30 rounded-xl text-[10px] text-violet-700 dark:text-violet-400">
                    <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    <span>
                      Last edited by <strong>{activeRecord.adminEditedBy}</strong> on{" "}
                      {new Date(activeRecord.adminEditedAt).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Form fields */}
                <div className="space-y-4">
                  {/* Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" /> Date *
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                      className={inputCls}
                    />
                  </div>

                  {/* Check In / Check Out */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> Check In *
                      </label>
                      <input
                        type="time"
                        value={form.checkIn}
                        onChange={(e) => setForm((f) => ({ ...f, checkIn: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> Check Out
                      </label>
                      <input
                        type="time"
                        value={form.checkOut}
                        onChange={(e) => setForm((f) => ({ ...f, checkOut: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Duration preview */}
                  {form.checkIn && form.checkOut && (
                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                      <Timer className="h-3 w-3" />
                      Shift duration: <strong>{calcDuration(form.checkIn, form.checkOut) || "Invalid times"}</strong>
                    </div>
                  )}

                  {/* Status */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status *</label>
                    <div className="flex gap-2">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, status: opt.value }))}
                          className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                            form.status === opt.value
                              ? opt.value === "present"
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : opt.value === "late"
                                ? "bg-amber-500 text-white border-amber-500"
                                : "bg-rose-500 text-white border-rose-500"
                              : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" /> Geofence Location
                    </label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      placeholder="e.g. HQ Sector (0m offset)"
                      className={inputCls}
                    />
                  </div>

                  {/* Admin Remarks */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-violet-500" />
                      Admin Remarks
                      <span className="text-[9px] text-violet-500 font-medium">(visible to employee)</span>
                    </label>
                    <textarea
                      rows={3}
                      value={form.adminRemarks}
                      onChange={(e) => setForm((f) => ({ ...f, adminRemarks: e.target.value }))}
                      placeholder="Add a note for this attendance record…"
                      className={`${inputCls} resize-none`}
                    />
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 space-y-3 shrink-0">
                {/* Feedback message */}
                <AnimatePresence>
                  {drawerMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                        drawerMessage.type === "success"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400"
                          : "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-400"
                      }`}
                    >
                      {drawerMessage.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                      <span>{drawerMessage.text}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-3">
                  {/* Save button */}
                  <button
                    onClick={handleSave}
                    disabled={drawerLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer"
                  >
                    {drawerLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    {drawerMode === "create" ? "Create Record" : "Save Changes"}
                  </button>

                  {/* Delete button (edit mode only) */}
                  {drawerMode === "view-edit" && (
                    confirmDelete ? (
                      <button
                        onClick={handleDelete}
                        disabled={drawerLoading}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        {drawerLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        Confirm Delete
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(true)}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </button>
                    )
                  )}
                </div>

                {confirmDelete && (
                  <p className="text-[10px] text-rose-500 text-center font-medium">
                    ⚠ This action cannot be undone. Click &quot;Confirm Delete&quot; to permanently remove this record.
                  </p>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
