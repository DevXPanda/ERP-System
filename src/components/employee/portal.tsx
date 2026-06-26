"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Clock,
  CalendarOff,
  Loader2,
  Lock,
  Unlock,
  MapPin,
  CheckCircle,
  AlertCircle,
  FileText,
  Send,
  Eye,
  EyeOff,
  Save,
  TrendingUp,
  IndianRupee,
  Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

// GPS Geofence coordinates: New York HQ (40.7128, -74.0060)
const HQ_LAT = 40.7128;
const HQ_LNG = -74.0060;

interface AttendanceRecord {
  date: string;
  checkIn: string;
  checkOut?: string;
  status: string;
  location?: string;
}

interface LeaveRecord {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
}

interface DocumentRecord {
  name: string;
  type: string;
  uploadedAt: number;
  fileUrl: string;
}

interface PayrollRecord {
  month: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  paymentDate?: number;
  status: string;
}

interface PerformanceReview {
  reviewPeriod: string;
  reviewedBy: string;
  rating: number;
  feedback: string;
}


export function EmployeePortal({ activeTab = "overview" }: { activeTab?: string }) {

  // Load real-time portal data
  const portalData = useQuery(api.employee.getDashboardData);
  const managerProfile = useQuery(api.employee.getMyProfile);
  const payrollRecords = useQuery(api.employee.getPayrollRecords);
  const documents = useQuery(api.employee.getDocuments);
  const leaveHistory = useQuery(api.employee.getLeaveHistory);
  const performanceReviews = useQuery(api.employee.getPerformanceReviews);
  const mySalaryInfo = useQuery(api.salary.getMySalaryInfo);

  // Mutations
  const updateProfile = useMutation(api.employee.updateMyProfile);
  const checkInMutation = useMutation(api.employee.checkIn);
  const checkOutMutation = useMutation(api.employee.checkOut);
  const applyLeaveMutation = useMutation(api.employee.applyLeave);
  const updateTaskStatus = useMutation(api.employee.updateTaskStatus);

  // UI state
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceMessage, setAttendanceMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // GPS Simulation state: true = at office (HQ coordinates), false = far away (e.g. 5km offset)
  const [isAtOffice, setIsAtOffice] = useState(true);

  // Live Timer for today's working hours
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // ── Profile Fields ──
  const [profileForm, setProfileForm] = useState({
    phone: "",
    address: "",
    emergencyContact: "",
    profilePhoto: "",
    password: "",
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileStatus, setProfileStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // ── Leave Apply Form ──
  const [leaveForm, setLeaveForm] = useState({
    type: "Casual Leave",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [leaveStatus, setLeaveStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [leaveFormErrors, setLeaveFormErrors] = useState<Record<string, string>>({});

  // ── Support Ticket Form ──
  const [supportForm, setSupportForm] = useState({
    category: "IT Support",
    subject: "",
    description: "",
  });
  const [supportMessage, setSupportMessage] = useState<string | null>(null);

  // Auto-fill profile form when data loads
  useEffect(() => {
    if (portalData?.profile) {
      setProfileForm({
        phone: portalData.user.phone || "",
        address: portalData.profile.address || "",
        emergencyContact: portalData.profile.emergencyContact || "",
        profilePhoto: portalData.profile.profilePhoto || portalData.user.image || "",
        password: "",
      });
    }
  }, [portalData]);

  // Live Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (portalData?.todayAttendance?.checkIn && !portalData.todayAttendance.checkOut) {
      const [checkInH, checkInM] = portalData.todayAttendance.checkIn.split(":").map(Number);
      const calculateSeconds = () => {
        const checkInTime = new Date();
        checkInTime.setHours(checkInH, checkInM, 0, 0);
        const diffMs = Math.max(0, Date.now() - checkInTime.getTime());
        setElapsedSeconds(Math.floor(diffMs / 1000));
      };
      calculateSeconds();
      interval = setInterval(calculateSeconds, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(interval);
  }, [portalData]);

  const formatTimer = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };



  // ── GPS Geofenced Check In ──
  const handleCheckIn = async () => {
    setAttendanceLoading(true);
    setAttendanceMessage(null);

    // Simulate Coordinates based on GPS toggle
    const userLat = isAtOffice ? HQ_LAT : HQ_LAT + 0.15; // 0.15 degree offset = approx 16.6 km away
    const userLng = isAtOffice ? HQ_LNG : HQ_LNG + 0.15;

    try {
      const res = await checkInMutation({ lat: userLat, lng: userLng });
      setAttendanceMessage({ type: "success", text: res.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAttendanceMessage({ type: "error", text: msg });
    } finally {
      setAttendanceLoading(false);
    }
  };

  // ── GPS Geofenced Check Out ──
  const handleCheckOut = async () => {
    setAttendanceLoading(true);
    setAttendanceMessage(null);
    try {
      const res = await checkOutMutation({});
      setAttendanceMessage({ type: "success", text: res.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setAttendanceMessage({ type: "error", text: msg });
    } finally {
      setAttendanceLoading(false);
    }
  };

  // ── Apply Leave ──
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLeaveStatus(null);
    setLeaveFormErrors({});

    const schema = z.object({
      startDate: z.string().min(1, "Start Date is required"),
      endDate: z.string().min(1, "End Date is required"),
      reason: z.string().min(5, "Reason must be at least 5 characters"),
    });

    const parsed = schema.safeParse(leaveForm);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setLeaveFormErrors(fieldErrors);
      return;
    }

    try {
      const res = await applyLeaveMutation(leaveForm);
      setLeaveStatus({ type: "success", text: res.message });
      setLeaveForm({ type: "Casual Leave", startDate: "", endDate: "", reason: "" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setLeaveStatus({ type: "error", text: msg });
    }
  };

  // ── Edit Profile ──
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileStatus(null);
    setProfileErrors({});

    const schema = z.object({
      phone: z.string().min(10, "Phone number must be at least 10 digits").optional().or(z.literal("")),
      address: z.string().min(5, "Address must be at least 5 characters"),
      emergencyContact: z.string().min(10, "Emergency contact must be at least 10 digits"),
      profilePhoto: z.string().url("Invalid profile photo URL").optional().or(z.literal("")),
      password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
    });

    const parsed = schema.safeParse(profileForm);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setProfileErrors(fieldErrors);
      return;
    }

    try {
      const res = await updateProfile({
        phone: profileForm.phone || undefined,
        address: profileForm.address,
        emergencyContact: profileForm.emergencyContact,
        profilePhoto: profileForm.profilePhoto || undefined,
        password: profileForm.password || undefined,
      });
      setProfileStatus({ type: "success", text: res.message });
      setProfileForm((prev) => ({ ...prev, password: "" }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setProfileStatus({ type: "error", text: msg });
    }
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm.subject || !supportForm.description) return;
    setSupportMessage("Support ticket registered successfully. Ticket ID: TK-" + Math.floor(Math.random() * 90000 + 10000));
    setSupportForm({ category: "IT Support", subject: "", description: "" });
    setTimeout(() => setSupportMessage(null), 5000);
  };

  const handleTaskToggle = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "Completed" ? "In-Progress" : "Completed";
    try {
      await updateTaskStatus({ taskId: id as Id<"tasks">, status: nextStatus });
    } catch (e) {
      console.error(e);
    }
  };

  if (!portalData) {
    return (
      <div className="flex h-screen items-center justify-center flex-col gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Bootstrapping secure portal environment…</p>
      </div>
    );
  }

  const { user, profile, departmentName, todayAttendance, leaves, holidays, notices, tasks, earnings } = portalData;

  const fmtINR = (val: number) => val.toLocaleString("en-IN", { maximumFractionDigits: 2 });

  const profilePhoto = profile?.profilePhoto || user.image;

  return (
    <div className="space-y-6 w-full">
        {/* Profile Card Header */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            {profilePhoto ? (
              <Image
                src={profilePhoto}
                alt="Profile"
                width={56}
                height={56}
                unoptimized
                className="rounded-full object-cover border-2 border-indigo-100 dark:border-indigo-900"
              />
            ) : (
              <div className="h-14 w-14 rounded-full bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-lg">
                {user.name?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100">{user.name}</h1>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {profile?.designation || "Enterprise Associate"} • ID: <span className="font-mono">{profile?.employeeId || "Unassigned"}</span>
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 md:gap-6 border-t md:border-t-0 pt-4 md:pt-0">
            <div className="text-center md:text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">Office Geofence</span>
              <div className="inline-flex items-center gap-1.5 mt-1">
                <span className={`h-2 w-2 rounded-full ${isAtOffice ? "bg-emerald-500" : "bg-rose-500"}`} />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-350">{isAtOffice ? "Within Office Radius" : "Outside Office Bounds"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Render Tab Views */}
        <AnimatePresence mode="wait">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Check In Status Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400">{"TODAY'S WORK STATUS"}</span>
                    <Clock className="h-4.5 w-4.5 text-indigo-500" />
                  </div>
                  <div>
                    {todayAttendance ? (
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{todayAttendance.checkIn}</p>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          todayAttendance.status === "present" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                        }`}>{todayAttendance.status}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-slate-400">Not Checked In</p>
                        <span className="text-[10px] text-slate-400">Onboarding geofence validated session</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Working Hours Live Card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400">LIVE WORK SHIFT TIMER</span>
                    <Clock className="h-4.5 w-4.5 text-indigo-500 animate-pulse" />
                  </div>
                  <div>
                    {todayAttendance?.checkIn && !todayAttendance.checkOut ? (
                      <div className="space-y-1">
                        <p className="text-2xl font-mono font-bold text-slate-800 dark:text-slate-100">{formatTimer(elapsedSeconds)}</p>
                        <span className="text-[10px] text-emerald-500 font-semibold">Live working hours timer running</span>
                      </div>
                    ) : todayAttendance?.checkOut ? (
                      <div className="space-y-1">
                        <p className="text-lg font-semibold text-slate-500">Checked Out</p>
                        <span className="text-[10px] text-slate-400">Duty shift ended at {todayAttendance.checkOut}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-slate-400 font-mono">00:00:00</p>
                        <span className="text-[10px] text-slate-400">Shift timer inactive</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Leaves Balance */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-400">LEAVES ALLOCATED BALANCE</span>
                    <CalendarOff className="h-4.5 w-4.5 text-indigo-500" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                      {18 - leaves.filter((l) => l.status === "Approved").length}
                    </p>
                    <span className="text-xs text-slate-400">/ 18 Days Left</span>
                  </div>
                </div>
              </div>

              {/* Earnings Widgets Grid (only shown if salary is configured) */}
              {earnings && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {
                      label: "TODAY'S EARNINGS",
                      value: `₹${fmtINR(earnings.todayEarnings)}`,
                      sub: todayAttendance?.status ?? "Not checked in",
                      icon: IndianRupee,
                      color: "text-emerald-600 dark:text-emerald-400",
                      bg: "bg-emerald-50 dark:bg-emerald-950/20",
                      border: "border-emerald-100 dark:border-emerald-900/40",
                    },
                    {
                      label: "PER DAY SALARY",
                      value: `₹${fmtINR(earnings.perDaySalary)}`,
                      sub: `Based on ${earnings.totalDaysInMonth} days this month`,
                      icon: Wallet,
                      color: "text-indigo-600 dark:text-indigo-400",
                      bg: "bg-indigo-50 dark:bg-indigo-950/20",
                      border: "border-indigo-100 dark:border-indigo-900/40",
                    },
                    {
                      label: "CURRENT MONTH EARNED",
                      value: `₹${fmtINR(earnings.currentMonthEarnings)}`,
                      sub: `${earnings.presentDays} present + ${earnings.paidLeaveDays} paid leave`,
                      icon: TrendingUp,
                      color: "text-violet-600 dark:text-violet-400",
                      bg: "bg-violet-50 dark:bg-violet-950/20",
                      border: "border-violet-100 dark:border-violet-900/40",
                    },
                    {
                      label: "ESTIMATED MONTH TOTAL",
                      value: `₹${fmtINR(earnings.estimatedMonthSalary)}`,
                      sub: `Day ${earnings.dayOfMonth} of ${earnings.totalDaysInMonth}`,
                      icon: CalendarOff,
                      color: "text-amber-600 dark:text-amber-400",
                      bg: "bg-amber-50 dark:bg-amber-950/20",
                      border: "border-amber-100 dark:border-amber-900/40",
                    },
                  ].map((card) => (
                    <div
                      key={card.label}
                      className={`${card.bg} border ${card.border} p-4 rounded-2xl space-y-2 shadow-xs`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">{card.label}</span>
                        <card.icon className={`h-4 w-4 ${card.color} shrink-0`} />
                      </div>
                      <p className={`text-xl font-bold ${card.color} tracking-tight`}>{card.value}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal truncate" title={card.sub}>{card.sub}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Announcements & Holidays Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Recent Announcements */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                  <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100">Recent Notices & Announcements</h3>
                  <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
                    {notices.length === 0 ? (
                      <p className="text-xs text-slate-400">No corporate notices posted.</p>
                    ) : (
                      notices.map((n, idx) => (
                        <div key={idx} className="pt-3 first:pt-0 space-y-1">
                          <div className="flex justify-between items-start">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-350">{n.title}</span>
                            <span className="text-[9px] text-slate-400">{new Date(n.publishedAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-normal">{n.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Upcoming Holidays */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                  <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100">Upcoming Holiday Calendar</h3>
                  <div className="space-y-3">
                    {holidays.length === 0 ? (
                      <p className="text-xs text-slate-400">No holidays loaded. Seed mock data to view.</p>
                    ) : (
                      holidays.map((h, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl">
                          <div>
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">{h.name}</span>
                            <span className="text-[10px] text-slate-400">{h.type} Holiday</span>
                          </div>
                          <span className="text-xs font-mono font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg">
                            {h.date}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Attendance Analytics Mock Chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100">Attendance Analytics</h3>
                    <p className="text-[10px] text-slate-400">Monthly breakdown of status compliance</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-indigo-500" /> Present</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Late</span>
                  </div>
                </div>

                <div className="h-36 flex items-end justify-between gap-2 pt-6 border-b border-slate-100 dark:border-slate-800 font-mono text-[9px] text-slate-400">
                  {/* Attendance Analytics Mock Columns */}
                  {[
                    { month: "Jan", present: 20, late: 2 },
                    { month: "Feb", present: 19, late: 1 },
                    { month: "Mar", present: 22, late: 0 },
                    { month: "Apr", present: 18, late: 3 },
                    { month: "May", present: 21, late: 1 },
                    { month: "Jun", present: 14, late: 2 }
                  ].map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full flex items-end justify-center gap-0.5 h-24">
                        <div style={{ height: `${d.present * 4}%` }} className="w-4 bg-indigo-500/80 hover:bg-indigo-600 rounded-t-sm transition-all" title={`${d.present} Days Present`} />
                        <div style={{ height: `${d.late * 15}%` }} className="w-4 bg-amber-500/80 hover:bg-amber-600 rounded-t-sm transition-all" title={`${d.late} Days Late`} />
                      </div>
                      <span className="mt-1 block font-sans">{d.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: PROFILE */}
          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Right Col: Read-Only HR managed details */}
              <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Lock className="h-4 w-4 text-slate-400" />
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Company Managed Records</h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">Department</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">{departmentName || "Unassigned"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">Employment Type</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">{profile?.employmentType || "Regular"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">Joining Date</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">{profile?.joiningDate || "Not recorded"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">Reporting Manager</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">{managerProfile?.managerName || "None"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">Confidential Salary</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5">$ {profile?.salary ? profile.salary.toLocaleString() : "Confidential"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500 block">System Access Role</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5 capitalize">{user.role}</span>
                  </div>
                </div>
              </div>

              {/* Left Col: Edit personal fields */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-6">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <Unlock className="h-4 w-4 text-emerald-500" />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100">Update Personal Profile</h3>
                    <p className="text-[10px] text-slate-400">Update permitted contact information, avatar URL, or change credentials.</p>
                  </div>
                </div>

                {profileStatus && (
                  <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                    profileStatus.type === "success" ? "bg-emerald-55 dark:bg-emerald-950/20 border-emerald-200 text-emerald-700 dark:text-emerald-400" : "bg-rose-50 border-rose-200 text-rose-700"
                  }`}>
                    {profileStatus.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    <span>{profileStatus.text}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile} className="space-y-4" noValidate>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Phone */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Personal Phone Number</label>
                      <input
                        name="phone"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                      />
                      {profileErrors.phone && <p className="text-[10px] text-rose-500 font-semibold">{profileErrors.phone}</p>}
                    </div>

                    {/* Emergency Contact */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Emergency Contact</label>
                      <input
                        name="emergencyContact"
                        value={profileForm.emergencyContact}
                        onChange={(e) => setProfileForm((p) => ({ ...p, emergencyContact: e.target.value }))}
                        placeholder="e.g. Spouse Name - 555-0199"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                      />
                      {profileErrors.emergencyContact && <p className="text-[10px] text-rose-500 font-semibold">{profileErrors.emergencyContact}</p>}
                    </div>

                    {/* Avatar URL */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Profile Photo URL</label>
                      <input
                        name="profilePhoto"
                        value={profileForm.profilePhoto}
                        onChange={(e) => setProfileForm((p) => ({ ...p, profilePhoto: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                      />
                      {profileErrors.profilePhoto && <p className="text-[10px] text-rose-500 font-semibold">{profileErrors.profilePhoto}</p>}
                    </div>

                    {/* Password Change */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Update Password (Leave blank to keep current)</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={profileForm.password}
                          onChange={(e) => setProfileForm((p) => ({ ...p, password: e.target.value }))}
                          placeholder="Min. 8 characters"
                          className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {profileErrors.password && <p className="text-[10px] text-rose-500 font-semibold">{profileErrors.password}</p>}
                    </div>

                    {/* Permanent Address */}
                    <div className="space-y-1.5 sm:col-span-2">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Permanent Address</label>
                      <textarea
                        name="address"
                        rows={2}
                        value={profileForm.address}
                        onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 resize-none"
                      />
                      {profileErrors.address && <p className="text-[10px] text-rose-500 font-semibold">{profileErrors.address}</p>}
                    </div>
                  </div>

                  <div className="flex justify-end pt-3">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Save className="h-3.5 w-3.5" /> Save Profile Details
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* TAB 3: ATTENDANCE */}
          {activeTab === "attendance" && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Geofence verification and clock toggler */}
              <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <MapPin className="h-4.5 w-4.5 text-indigo-500" />
                  <h3 className="text-xs font-semibold text-slate-850 dark:text-slate-100 uppercase tracking-wider">Geofence Registry</h3>
                </div>

                {/* GPS Mock Location simulator */}
                <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-3">
                  <span className="text-[10px] font-semibold text-slate-400 block uppercase">Simulate GPS Coordinates</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-350">
                      {isAtOffice ? "At HQ (Verified Radius)" : "Offsite (Blocked Access)"}
                    </span>
                    <button
                      onClick={() => setIsAtOffice(!isAtOffice)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        isAtOffice ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-800"
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isAtOffice ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </button>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-normal">
                    {isAtOffice
                      ? `Lat: ${HQ_LAT}, Lng: ${HQ_LNG} (0 meters away from HQ center)`
                      : `Lat: ${HQ_LAT + 0.15}, Lng: ${HQ_LNG + 0.15} (Approx. 16.6 km away)`}
                  </p>
                </div>

                {attendanceMessage && (
                  <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                    attendanceMessage.type === "success" ? "bg-emerald-50 border-emerald-250 text-emerald-700" : "bg-rose-50 border-rose-250 text-rose-700"
                  }`}>
                    {attendanceMessage.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    <span>{attendanceMessage.text}</span>
                  </div>
                )}

                {/* Clock Actions */}
                <div className="space-y-3">
                  {!todayAttendance ? (
                    <button
                      onClick={handleCheckIn}
                      disabled={attendanceLoading}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      {attendanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                      Verify GPS & Check In
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl text-center text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                        Checked In at {todayAttendance.checkIn} Today
                      </div>
                      {!todayAttendance.checkOut ? (
                        <button
                          onClick={handleCheckOut}
                          disabled={attendanceLoading}
                          className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-60"
                        >
                          {attendanceLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
                          Check Out Shift
                        </button>
                      ) : (
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-center text-slate-500 dark:text-slate-400 font-medium text-xs">
                          Duty Completed. Checkout: {todayAttendance.checkOut}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Attendance Log Table */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100">Monthly Attendance History Log</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-150 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5 rounded-l-lg">Date</th>
                        <th className="px-4 py-2.5">Check In</th>
                        <th className="px-4 py-2.5">Check Out</th>
                        <th className="px-4 py-2.5">Duty Status</th>
                        <th className="px-4 py-2.5 rounded-r-lg">Location</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {leaves.length === 0 && (!portalData.attendanceHistory || portalData.attendanceHistory.length === 0) ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                            No attendance logs compiled. Perform simulated check-in above.
                          </td>
                        </tr>
                      ) : (
                        portalData.attendanceHistory?.map((h: AttendanceRecord, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-250 font-mono">{h.date}</td>
                            <td className="px-4 py-3 font-mono">{h.checkIn}</td>
                            <td className="px-4 py-3 font-mono">{h.checkOut || "--:--"}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                h.status === "present" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-450" : "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                              }`}>{h.status}</span>
                            </td>
                            <td className="px-4 py-3 text-slate-450 truncate max-w-[150px]" title={h.location}>{h.location || "Office HQ"}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: LEAVES */}
          {activeTab === "leaves" && (
            <motion.div
              key="leaves"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Apply Leave Panel */}
              <div className="md:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <CalendarOff className="h-4.5 w-4.5 text-indigo-500" />
                  <h3 className="text-xs font-semibold text-slate-850 dark:text-slate-100 uppercase tracking-wider">File Leave Request</h3>
                </div>

                {leaveStatus && (
                  <div className={`p-3 rounded-xl border text-xs font-medium flex items-center gap-2 ${
                    leaveStatus.type === "success" ? "bg-emerald-55 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700"
                  }`}>
                    {leaveStatus.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    <span>{leaveStatus.text}</span>
                  </div>
                )}

                <form onSubmit={handleApplyLeave} className="space-y-4 text-xs font-medium">
                  {/* Type */}
                  <div className="space-y-1.5">
                    <label className="text-slate-650 dark:text-slate-400">Leave Type</label>
                    <select
                      value={leaveForm.type}
                      onChange={(e) => setLeaveForm((l) => ({ ...l, type: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none cursor-pointer"
                    >
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Annual Leave">Annual Leave</option>
                      <option value="Maternity/Paternity Leave">Maternity/Paternity Leave</option>
                    </select>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-1.5">
                    <label className="text-slate-650 dark:text-slate-400">Start Date</label>
                    <input
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm((l) => ({ ...l, startDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    />
                    {leaveFormErrors.startDate && <p className="text-[9px] text-rose-500 font-semibold">{leaveFormErrors.startDate}</p>}
                  </div>

                  {/* End Date */}
                  <div className="space-y-1.5">
                    <label className="text-slate-650 dark:text-slate-400">End Date</label>
                    <input
                      type="date"
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm((l) => ({ ...l, endDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                    />
                    {leaveFormErrors.endDate && <p className="text-[9px] text-rose-500 font-semibold">{leaveFormErrors.endDate}</p>}
                  </div>

                  {/* Reason */}
                  <div className="space-y-1.5">
                    <label className="text-slate-650 dark:text-slate-400">Reason / Notes</label>
                    <textarea
                      rows={3}
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm((l) => ({ ...l, reason: e.target.value }))}
                      placeholder="Specify reason for request..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none resize-none"
                    />
                    {leaveFormErrors.reason && <p className="text-[9px] text-rose-500 font-semibold">{leaveFormErrors.reason}</p>}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="h-3.5 w-3.5" /> Submit Request
                  </button>
                </form>
              </div>

              {/* History Table */}
              <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4">
                <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100">Leave History Log</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-150 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-2.5 rounded-l-lg">Type</th>
                        <th className="px-4 py-2.5">Date Range</th>
                        <th className="px-4 py-2.5">Reason</th>
                        <th className="px-4 py-2.5 rounded-r-lg">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {!leaveHistory || leaveHistory.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                            No leave applications filed.
                          </td>
                        </tr>
                      ) : (
                        leaveHistory.map((l: LeaveRecord, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors">
                            <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-250">{l.type}</td>
                            <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{l.startDate} to {l.endDate}</td>
                            <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate" title={l.reason}>{l.reason}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                l.status === "Approved" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40" : l.status === "Rejected" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600 dark:bg-amber-950/40"
                              }`}>{l.status}</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: HOLIDAYS */}
          {activeTab === "holidays" && (
            <motion.div
              key="holidays"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4"
            >
              <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100">Company Corporate Holidays (Calendar Year)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {holidays.length === 0 ? (
                  <p className="text-xs text-slate-400 col-span-2">No holidays recorded. Seed mock data to view.</p>
                ) : (
                  holidays.map((h, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{h.name}</span>
                        <span className="text-[10.5px] text-slate-400 block">{h.type} Holiday</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg">
                          {h.date}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 6: DOCUMENTS */}
          {activeTab === "documents" && (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4"
            >
              <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100">Secured Documents Vault</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {!documents || documents.length === 0 ? (
                  <p className="text-xs text-slate-400 col-span-3">No signed documents loaded. Seed mock data to view.</p>
                ) : (
                  documents.map((d: DocumentRecord, idx: number) => (
                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-3 hover:border-indigo-200 transition-all flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-500 rounded-lg inline-block">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-850 dark:text-slate-200 block truncate" title={d.name}>{d.name}</span>
                          <span className="text-[10px] text-slate-450 block">{d.type} • {new Date(d.uploadedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <a
                        href={d.fileUrl}
                        className="py-1.5 text-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-[10px] transition-colors block w-full"
                      >
                        Download PDF Slip
                      </a>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 7: PAYROLL */}
          {activeTab === "payroll" && (
            <motion.div
              key="payroll"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4"
            >
              <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100">Payroll Earnings History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-150 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5 rounded-l-lg">Billing Month</th>
                      <th className="px-4 py-2.5">Base Salary</th>
                      <th className="px-4 py-2.5">Allowances</th>
                      <th className="px-4 py-2.5">Deductions</th>
                      <th className="px-4 py-2.5">Net Disbursed</th>
                      <th className="px-4 py-2.5">Payment Date</th>
                      <th className="px-4 py-2.5 rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {!payrollRecords || payrollRecords.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          No payroll disbursements recorded. Seed mock data to view.
                        </td>
                      </tr>
                    ) : (
                      payrollRecords.map((p: PayrollRecord, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{p.month}</td>
                          <td className="px-4 py-3 font-mono">$ {p.baseSalary.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-emerald-500">+$ {p.allowances.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono text-rose-500">-$ {p.deductions.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">$ {p.netSalary.toLocaleString()}</td>
                          <td className="px-4 py-3 font-mono">{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "--"}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-650 dark:bg-emerald-950/40">
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Salary Structure Card (read-only, visible when salary is set by admin) */}
              {mySalaryInfo && (
                <div className="mt-5 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                    <IndianRupee className="h-4 w-4 text-indigo-500" />
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200">Your Salary Structure</h4>
                    <span className={`ml-auto px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      mySalaryInfo.salaryStatus === "Active"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-600"
                    }`}>{mySalaryInfo.salaryStatus}</span>
                  </div>
                  <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {[
                      { label: "Basic Salary", val: mySalaryInfo.basicSalary, color: "text-slate-800 dark:text-slate-100" },
                      { label: "HRA", val: mySalaryInfo.hra, color: "text-slate-800 dark:text-slate-100" },
                      { label: "Allowances", val: mySalaryInfo.allowances, color: "text-slate-800 dark:text-slate-100" },
                      { label: "Perks & Benefits", val: mySalaryInfo.perksAndBenefits, color: "text-slate-800 dark:text-slate-100" },
                      { label: "Bonus", val: mySalaryInfo.bonus, color: "text-emerald-600 dark:text-emerald-400" },
                      { label: "PF (Employee Share)", val: -mySalaryInfo.pf, color: "text-rose-600 dark:text-rose-400" },
                      { label: "ESI", val: -mySalaryInfo.esi, color: "text-rose-600 dark:text-rose-400" },
                      { label: "TDS", val: -mySalaryInfo.tds, color: "text-rose-600 dark:text-rose-400" },
                    ].map((row) => (
                      <div key={row.label} className="space-y-0.5">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide block">{row.label}</span>
                        <p className={`text-sm font-bold ${row.color}`}>
                          {row.val >= 0 ? "" : "-"}₹{Math.abs(row.val).toLocaleString("en-IN")}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-5 py-3.5 bg-indigo-50 dark:bg-indigo-950/20 border-t border-indigo-100 dark:border-indigo-900/40">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Net Take-Home / Month</span>
                    <span className="text-base font-bold text-indigo-700 dark:text-indigo-400">₹{mySalaryInfo.netTakeHome.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="px-5 py-2.5 text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-800">
                    Effective from {mySalaryInfo.effectiveDate} • {mySalaryInfo.paymentCycle} cycle
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 8: TASKS */}
          {activeTab === "tasks" && (
            <motion.div
              key="tasks"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4"
            >
              <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100">Onboarding Action Items & Checklists</h3>
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <p className="text-xs text-slate-400">All task checklists completed!</p>
                ) : (
                  tasks.map((t, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl flex items-start gap-3 justify-between hover:border-indigo-100 transition-colors">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => handleTaskToggle(t._id, t.status)}
                          className={`mt-1 h-4.5 w-4.5 rounded border flex items-center justify-center cursor-pointer transition-colors ${
                            t.status === "Completed" ? "bg-indigo-600 border-indigo-600 text-white" : "border-slate-350 bg-white dark:bg-slate-950"
                          }`}
                        >
                          {t.status === "Completed" && <span className="text-[10px] font-bold leading-none">✓</span>}
                        </button>
                        <div className="space-y-1">
                          <span className={`text-xs font-semibold text-slate-800 dark:text-slate-200 block ${
                            t.status === "Completed" ? "line-through text-slate-400 dark:text-slate-500" : ""
                          }`}>{t.title}</span>
                          <p className="text-[10.5px] text-slate-450 leading-normal">{t.description}</p>
                          <div className="flex items-center gap-3 pt-1 text-[9.5px] text-slate-400 font-semibold uppercase">
                            <span>Due: {t.dueDate}</span>
                            <span>•</span>
                            <span className={`${
                              t.priority === "High" ? "text-rose-500" : t.priority === "Medium" ? "text-amber-500" : "text-slate-400"
                            }`}>{t.priority} Priority</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 9: NOTICES */}
          {activeTab === "notices" && (
            <motion.div
              key="notices"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4"
            >
              <h3 className="text-sm font-semibold text-slate-855 dark:text-slate-100">Company Announcements Notice Board</h3>
              <div className="space-y-4 divide-y divide-slate-100 dark:divide-slate-850">
                {notices.length === 0 ? (
                  <p className="text-xs text-slate-400">Notice board is currently clean.</p>
                ) : (
                  notices.map((n, idx) => (
                    <div key={idx} className="pt-4 first:pt-0 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{n.title}</span>
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                          {new Date(n.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">{n.content}</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 10: PERFORMANCE */}
          {activeTab === "performance" && (
            <motion.div
              key="performance"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4"
            >
              <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100">Performance Assessment Overview</h3>
              <div className="space-y-4">
                {!performanceReviews || performanceReviews.length === 0 ? (
                  <p className="text-xs text-slate-400">No performance feedback logged. Seed mock data to view.</p>
                ) : (
                  performanceReviews.map((p: PerformanceReview, idx: number) => (
                    <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-2">
                        <div>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">{p.reviewPeriod} Evaluation</span>
                          <span className="text-[10px] text-slate-400 block">Assessed by: {p.reviewedBy}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">{p.rating}</span>
                          <span className="text-[10px] text-slate-400 block">/ 5.0 score</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed italic">&quot;{p.feedback}&quot;</p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 11: HELP & SUPPORT */}
          {activeTab === "support" && (
            <motion.div
              key="support"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-xs space-y-4 max-w-xl"
            >
              <h3 className="text-sm font-semibold text-slate-850 dark:text-slate-100">Submit IT & HR Support Ticket</h3>
              <p className="text-[10px] text-slate-450 leading-normal">Submit any portal glitches, payload discrepancies, or HR/IT issues below.</p>
              
              {supportMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{supportMessage}</span>
                </div>
              )}

              <form onSubmit={handleSupportSubmit} className="space-y-4 text-xs font-medium">
                <div className="space-y-1.5">
                  <label className="text-slate-650 dark:text-slate-450">Category</label>
                  <select
                    value={supportForm.category}
                    onChange={(e) => setSupportForm((s) => ({ ...s, category: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  >
                    <option value="IT Support">IT Support (Access, Hardware, Bug)</option>
                    <option value="HR Query">HR Query (Leaves, Compensation, Documents)</option>
                    <option value="General Query">General Admin Support</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-650 dark:text-slate-450">Subject</label>
                  <input
                    value={supportForm.subject}
                    onChange={(e) => setSupportForm((s) => ({ ...s, subject: e.target.value }))}
                    placeholder="e.g. Geofence radius location discrepancy"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-slate-650 dark:text-slate-450">Description</label>
                  <textarea
                    rows={4}
                    value={supportForm.description}
                    onChange={(e) => setSupportForm((s) => ({ ...s, description: e.target.value }))}
                    placeholder="Provide a detailed overview of your query..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!supportForm.subject || !supportForm.description}
                  className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" /> Send Ticket
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
    </div>
  );
}


