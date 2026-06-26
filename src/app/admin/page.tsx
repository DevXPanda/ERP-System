"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Users,
  Clock,
  Building2,
  TrendingUp,
  Search,
  Filter,
  Database,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Calendar,
  Megaphone,
  UserCheck,
  Plus,
  Award,
  ClipboardList,
  CalendarDays,
  XCircle,
  Check,
  IndianRupee,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";

interface EmployeeItem {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  department: string;
  deptCode: string;
  status: string;
}

interface ChartItem {
  month?: string;
  name?: string;
  count: number;
}

interface LogItem {
  _id: string;
  action: string;
  timestamp: number;
  details: string;
}

interface LineCoordItem {
  x: number;
  y: number;
  label: string;
  val: number;
}

export default function AdminDashboard() {
  const currentUser = useQuery(api.users.current);

  // Fetch real-time backend data
  const analytics = useQuery(api.dashboard.getAnalytics);
  const chartData = useQuery(api.dashboard.getChartData);
  const recentActivity = useQuery(api.dashboard.getRecentActivity);
  const employees = useQuery(api.dashboard.getEmployeeOverview);

  // Mutations
  const seedDatabase = useMutation(api.users.seedMockUsers);

  // Local UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");
  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);
  const [activeBar, setActiveBar] = useState<number | null>(null);

  if (currentUser?.role === "hr") {
    return <HRDashboardOverview />;
  }

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMessage("");
    try {
      const res = await seedDatabase();
      setSeedMessage(res.message);
      // Automatically clear message after 4s
      setTimeout(() => setSeedMessage(""), 4000);
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setSeedMessage("Seeding failed: " + errMsg);
    } finally {
      setSeeding(false);
    }
  };

  // Safe checks for data loading (falling back to mocks if database queries are loading)
  const stats = analytics || {
    totalEmployees: 0,
    activeShifts: 0,
    totalDepartments: 0,
    productivityTrend: "0%",
  };

  const lineChartPoints = chartData?.employeeGrowth || [];
  const barChartPoints = chartData?.departmentDistribution || [];
  const logs = recentActivity || [];
  const employeeList = employees || [];

  // Filtering Logic
  const filteredEmployees = (employeeList || []).filter((emp: EmployeeItem) => {
    const matchesSearch =
      (emp.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.department || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "all" || emp.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // SVG Line Chart calculations
  const maxLineVal = lineChartPoints.length > 0 ? Math.max(...lineChartPoints.map((d: ChartItem) => d.count)) * 1.15 : 10;
  const minLineVal = lineChartPoints.length > 0 ? Math.min(...lineChartPoints.map((d: ChartItem) => d.count)) * 0.85 : 0;
  const lineSvgWidth = 500;
  const lineSvgHeight = 220;
  const linePadding = 40;

  const getLineCoordinates = () => {
    const pointsCount = lineChartPoints.length;
    if (pointsCount === 0) return [];
    return lineChartPoints.map((d: ChartItem, i: number) => {
      const x = linePadding + (i * (lineSvgWidth - linePadding * 2)) / (pointsCount > 1 ? pointsCount - 1 : 1);
      const y =
        lineSvgHeight -
        linePadding -
        (maxLineVal !== minLineVal
          ? ((d.count - minLineVal) * (lineSvgHeight - linePadding * 2)) / (maxLineVal - minLineVal)
          : 0);
      return { x, y, label: d.month || "", val: d.count };
    });
  };

  const lineCoords = getLineCoordinates();
  const linePathD = lineCoords.reduce(
    (path: string, pt: LineCoordItem, i: number) => (i === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`),
    ""
  );

  const fillPathD = lineCoords.length > 0 
    ? `${linePathD} L ${lineCoords[lineCoords.length - 1].x} ${lineSvgHeight - linePadding} L ${lineCoords[0].x} ${lineSvgHeight - linePadding} Z` 
    : "";

  // SVG Bar Chart calculations
  const maxBarVal = barChartPoints.length > 0 ? Math.max(...barChartPoints.map((d: ChartItem) => d.count)) * 1.1 : 10;
  const barSvgWidth = 500;
  const barSvgHeight = 220;
  const barPadding = 45;
  const barWidth = 35;
  const barSpacing = barChartPoints.length > 0 ? (barSvgWidth - barPadding * 2) / barChartPoints.length : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Welcome Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Enterprise Dashboard</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time indicators and secure operations monitoring.</p>
        </div>

        {/* Database Seeder Controls */}
        <div className="flex items-center gap-3">
          {seedMessage && (
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 rounded-xl px-4 py-2 text-xs font-medium animate-fade-in">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{seedMessage}</span>
            </div>
          )}
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-xs rounded-xl px-4 py-2.5 disabled:opacity-50 transition-all duration-150 cursor-pointer shadow-xs"
          >
            {seeding ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Database className="h-3.5 w-3.5" />
            )}
            <span>Seed Demo Database</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl relative overflow-hidden group shadow-xs">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-blue-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Headcount</span>
              <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-1.5">{stats.totalEmployees}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40">
              <Users className="h-5 w-5 stroke-[1.8]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-4 w-4" />
            <span>+4.2% growth</span>
            <span className="text-slate-400 dark:text-slate-500 font-normal ml-0.5">this month</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl relative overflow-hidden group shadow-xs">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-indigo-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">On-Duty Shifts</span>
              <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-1.5">{stats.activeShifts}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
              <Clock className="h-5 w-5 stroke-[1.8]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-indigo-600 dark:text-indigo-400">
            <ArrowUpRight className="h-4 w-4" />
            <span>94.8% attendance</span>
            <span className="text-slate-400 dark:text-slate-500 font-normal ml-0.5">real-time</span>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl relative overflow-hidden group shadow-xs">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-violet-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Departments</span>
              <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-1.5">{stats.totalDepartments}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/40">
              <Building2 className="h-5 w-5 stroke-[1.8]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>6 core operational units</span>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl relative overflow-hidden group shadow-xs">
          <div className="absolute top-0 left-0 bottom-0 w-1 bg-emerald-500" />
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Productivity Rate</span>
              <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 mt-1.5">98.2%</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40">
              <TrendingUp className="h-5 w-5 stroke-[1.8]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 mt-4 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span>{stats.productivityTrend} increase</span>
            <span className="text-slate-400 dark:text-slate-500 font-normal ml-0.5">since Q1</span>
          </div>
        </div>
      </div>

      {/* SVG Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Growth Trend Line Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Employee Growth Trend</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Overview of active workforce counts over past 6 months.</p>
            </div>
            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">Line Plot</span>
          </div>

          <div className="relative">
            <svg viewBox={`0 0 ${lineSvgWidth} ${lineSvgHeight}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = linePadding + ratio * (lineSvgHeight - linePadding * 2);
                const val = Math.round(maxLineVal - ratio * (maxLineVal - minLineVal));
                return (
                  <g key={index}>
                    <line
                      x1={linePadding}
                      y1={y}
                      x2={lineSvgWidth - linePadding}
                      y2={y}
                      className="stroke-slate-100 dark:stroke-slate-800"
                      strokeWidth="1.5"
                    />
                    <text
                      x={linePadding - 10}
                      y={y + 4}
                      className="fill-slate-400 text-[10px] font-medium text-right"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* X Axis Labels */}
              {lineCoords.map((pt: LineCoordItem, i: number) => (
                <text
                  key={i}
                  x={pt.x}
                  y={lineSvgHeight - linePadding + 18}
                  className="fill-slate-400 text-[10px] font-medium"
                  textAnchor="middle"
                >
                  {pt.label}
                </text>
              ))}

              {/* Area path */}
              <path d={fillPathD} fill="url(#lineGrad)" className="transition-all duration-300" />

              {/* Stroke path */}
              <path
                d={linePathD}
                fill="none"
                className="stroke-indigo-600 dark:stroke-indigo-500 transition-all duration-300"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Interactive Circles */}
              {lineCoords.map((pt: LineCoordItem, i: number) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={activeTooltip === i ? 6 : 4}
                    className="fill-white stroke-indigo-600 dark:fill-slate-900 dark:stroke-indigo-400 cursor-pointer transition-all duration-150"
                    strokeWidth="2"
                    onMouseEnter={() => setActiveTooltip(i)}
                    onMouseLeave={() => setActiveTooltip(null)}
                  />
                  {activeTooltip === i && (
                    <g>
                      <rect
                        x={pt.x - 30}
                        y={pt.y - 32}
                        width="60"
                        height="20"
                        rx="6"
                        className="fill-slate-800 dark:fill-slate-100"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 18}
                        className="fill-white dark:fill-slate-900 text-[9px] font-semibold text-center"
                        textAnchor="middle"
                      >
                        {pt.val}
                      </text>
                    </g>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Department Distribution Bar Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Department Allocations</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Distribution of active employees per code segment.</p>
            </div>
            <span className="text-xs font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">Bar Graph</span>
          </div>

          <div className="relative">
            <svg viewBox={`0 0 ${barSvgWidth} ${barSvgHeight}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                const y = barPadding + ratio * (barSvgHeight - barPadding * 2);
                const val = Math.round(maxBarVal - ratio * maxBarVal);
                return (
                  <g key={index}>
                    <line
                      x1={barPadding}
                      y1={y}
                      x2={barSvgWidth - barPadding}
                      y2={y}
                      className="stroke-slate-100 dark:stroke-slate-800"
                      strokeWidth="1.5"
                    />
                    <text
                      x={barPadding - 10}
                      y={y + 4}
                      className="fill-slate-400 text-[10px] font-medium"
                      textAnchor="end"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {(barChartPoints || []).map((d: ChartItem, i: number) => {
                const x = barPadding + i * barSpacing + (barSpacing - barWidth) / 2;
                const barHeight = (d.count / maxBarVal) * (barSvgHeight - barPadding * 2);
                const y = barSvgHeight - barPadding - barHeight;

                return (
                  <g key={i}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barHeight, 4)}
                      rx="5"
                      fill="url(#barGrad)"
                      className="cursor-pointer transition-all duration-200 hover:opacity-85"
                      onMouseEnter={() => setActiveBar(i)}
                      onMouseLeave={() => setActiveBar(null)}
                    />
                    
                    {/* X Axis Label */}
                    <text
                      x={x + barWidth / 2}
                      y={barSvgHeight - barPadding + 18}
                      className="fill-slate-400 text-[10px] font-medium"
                      textAnchor="middle"
                    >
                      {d.name}
                    </text>

                    {/* Value Tooltip */}
                    {(activeBar === i || activeBar === null) && d.count > 0 && (
                      <text
                        x={x + barWidth / 2}
                        y={y - 8}
                        className={`fill-slate-700 dark:fill-slate-300 text-[9px] font-semibold transition-opacity duration-150 ${
                          activeBar === i ? "opacity-100" : "opacity-0"
                        }`}
                        textAnchor="middle"
                      >
                        {d.count}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Main Grid: Employee Listing & Real-time Audit Logger */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2/3: Employee Roster */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs xl:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Employee Workspace Roster</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Search and filter team roles across all divisions.</p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-full sm:w-36 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all duration-150"
                />
              </div>

              {/* Role filter dropdown */}
              <div className="relative shrink-0">
                <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:outline-hidden focus:border-indigo-500 appearance-none font-medium cursor-pointer"
                >
                  <option value="all">All</option>
                  <option value="admin">Admin</option>
                  <option value="hr">HR</option>
                  <option value="employee">Staff</option>
                </select>
              </div>
            </div>
          </div>

          {/* Desktop Table (hidden on mobile) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pt-1">User Name</th>
                  <th className="pb-3 pt-1">Email ID</th>
                  <th className="pb-3 pt-1">Department</th>
                  <th className="pb-3 pt-1">Role Badge</th>
                  <th className="pb-3 pt-1 text-right">Duty Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp: EmployeeItem) => (
                    <tr key={emp._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors duration-150">
                      <td className="py-3.5 font-medium text-slate-800 dark:text-slate-200">{emp.name}</td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">{emp.email}</td>
                      <td className="py-3.5 font-medium">
                        <span className="text-slate-700 dark:text-slate-300">{emp.department}</span>
                        <span className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md ml-1.5">{emp.deptCode}</span>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                          emp.role === "admin" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                          : emp.role === "hr" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}>{emp.role}</span>
                      </td>
                      <td className="py-3.5 text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-medium ${
                          emp.status === "Active" || emp.status === "On Duty"
                            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                        }`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          <span>{emp.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-5 w-5 stroke-[1.5]" />
                        <span>No employees found matching the filters.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List (hidden on sm+) */}
          <div className="sm:hidden space-y-2">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp: EmployeeItem) => (
                <div key={emp._id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{emp.name}</p>
                      <p className="text-[10px] text-slate-400 truncate">{emp.email}</p>
                    </div>
                    <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      emp.status === "Active" || emp.status === "On Duty"
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                    }`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {emp.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{emp.department}</span>
                    <span className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md">{emp.deptCode}</span>
                    <span className={`ml-auto px-2 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                      emp.role === "admin" ? "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                      : emp.role === "hr" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}>{emp.role}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-slate-400 flex flex-col items-center gap-2">
                <AlertCircle className="h-5 w-5 stroke-[1.5]" />
                <span className="text-xs">No employees found matching the filters.</span>
              </div>
            )}
          </div>
        </div>

        {/* Right 1/3: Recent activity timeline logs */}
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">System Audit Trail</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">Immutable ledger logs from the database.</p>
          </div>

          <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-slate-100 dark:before:bg-slate-800">
            {(logs || []).map((log: LogItem) => (
              <div key={log._id} className="flex gap-4 relative group">
                {/* Timeline node */}
                <div className="h-7 w-7 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-800 flex items-center justify-center shrink-0 z-10 text-indigo-500 transition-all duration-150 group-hover:border-indigo-500">
                  <Database className="h-3 w-3 stroke-[1.8]" />
                </div>
                
                {/* Timeline details */}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {log.action}
                    </h4>
                    <span className="text-[9px] text-slate-400">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                    {log.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── HR DASHBOARD OVERVIEW ────────────────────────────────────────────
function HRDashboardOverview() {
  const analytics = useQuery(api.hr.getHRDashboardAnalytics);
  const leaveRequests = useQuery(api.hr.getLeaveRequests);
  const announcements = useQuery(api.hr.getAnnouncements);
  const holidays = useQuery(api.hr.getHolidays);
  const recruitment = useQuery(api.hr.getRecruitmentPipeline);
  const payrollAggregate = useQuery(api.salary.getPayrollAggregateForHR);

  const approveLeave = useMutation(api.hr.updateLeaveStatus);
  const seedHR = useMutation(api.hr.seedMockHRData);
  const createNotice = useMutation(api.hr.createAnnouncement);

  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState("");
  const [activeTab, setActiveTab] = useState("leaves"); // "leaves" | "recruitment"
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: "", content: "" });
  const [publishing, setPublishing] = useState(false);
  const [leaveProcessing, setLeaveProcessing] = useState<string | null>(null);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg("");
    try {
      const res = await seedHR();
      setSeedMsg(res.message);
      setTimeout(() => setSeedMsg(""), 4000);
    } catch (err) {
      setSeedMsg("Seeding failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSeeding(false);
    }
  };

  const handleLeaveAction = async (id: string, status: string) => {
    setLeaveProcessing(id);
    try {
      await approveLeave({ leaveId: id as Id<"leaves">, status });
    } catch (err) {
      console.error(err);
    } finally {
      setLeaveProcessing(null);
    }
  };

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.content) return;
    setPublishing(true);
    try {
      await createNotice({ title: noticeForm.title, content: noticeForm.content });
      setNoticeForm({ title: "", content: "" });
      setIsNoticeModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  const stats = analytics || {
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    pendingLeaves: 0,
    newJoiners: 0,
    birthdaysThisMonth: 0,
    probationEmployees: 0,
    upcomingHolidays: 0,
  };

  const pendingLeavesList = (leaveRequests || []).filter((l) => l.status === "Pending");

  const cards = [
    { title: "Total Employees", val: stats.totalEmployees, desc: "Active directory count", icon: Users, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30" },
    { title: "Present Today", val: stats.presentToday, desc: "Clocked-in employees", icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30" },
    { title: "Absent Today", val: stats.absentToday, desc: "Not clocked-in", icon: AlertCircle, color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30" },
    { title: "Late Clock-ins", val: stats.lateToday, desc: "After 09:15 AM limit", icon: Clock, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30" },
    { title: "Pending Leaves", val: stats.pendingLeaves, desc: "Awaiting approval", icon: Calendar, color: "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30" },
    { title: "New Joiners", val: stats.newJoiners, desc: "Onboarded last 30d", icon: TrendingUp, color: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/30" },
    { title: "Probationers", val: stats.probationEmployees, desc: "Review period active", icon: ClipboardList, color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/30" },
    { title: "Upcoming Holidays", val: stats.upcomingHolidays, desc: "Calendar scheduled", icon: CalendarDays, color: "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950/30" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">HR Operations Control Room</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Real-time indicators, employee stats, recruitment, and leaves approvals.</p>
        </div>

        {/* Database Seeder Controls */}
        <div className="flex items-center gap-3">
          {seedMsg && (
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 rounded-xl px-4 py-2 text-xs font-medium animate-fade-in">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{seedMsg}</span>
            </div>
          )}
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 text-white rounded-xl text-xs font-medium shadow-xs hover:shadow-md disabled:opacity-50 transition-all duration-150 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${seeding ? "animate-spin" : ""}`} />
            <span>Seed Mock HR Data</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4.5">
        {cards.map((c, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs hover:scale-[1.02] transition-all duration-150 flex flex-col justify-between h-28"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{c.title}</span>
              <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>
                <c.icon className="h-4.5 w-4.5" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-semibold text-slate-800 dark:text-slate-100 tracking-tight leading-none">
                {analytics === undefined ? "..." : c.val}
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 truncate">{c.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Left 2/3 and Right 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Approvals / Recruitment */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            
            {/* Header Tabs */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab("leaves")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "leaves"
                      ? "bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-100"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  Pending Leaves ({pendingLeavesList.length})
                </button>
                <button
                  onClick={() => setActiveTab("recruitment")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === "recruitment"
                      ? "bg-slate-100 dark:bg-slate-850 text-slate-800 dark:text-slate-100"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  }`}
                >
                  Recruitment Pipeline
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            {activeTab === "leaves" ? (
              <div className="space-y-4">
                {leaveRequests === undefined ? (
                  <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                    <span className="text-xs">Loading leave requests...</span>
                  </div>
                ) : pendingLeavesList.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {pendingLeavesList.map((l) => (
                      <div key={l._id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{l.employeeName}</span>
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-mono">{l.employeeId}</span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{l.type} Leave</span>: {l.startDate} to {l.endDate}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic">&ldquo; {l.reason} &rdquo;</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleLeaveAction(l._id, "Rejected")}
                            disabled={leaveProcessing !== null}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-900/50 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Reject Request"
                          >
                            <XCircle className="h-4.5 w-4.5" />
                          </button>
                          <button
                            onClick={() => handleLeaveAction(l._id, "Approved")}
                            disabled={leaveProcessing !== null}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                    <CheckCircle className="h-8 w-8 text-emerald-500 stroke-[1.5]" />
                    <span className="text-xs font-medium">All leave requests processed! No pending tasks.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {recruitment === undefined ? (
                  <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-3">
                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                    <span className="text-xs">Loading pipeline...</span>
                  </div>
                ) : recruitment.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {recruitment.map((c) => (
                      <div key={c.id} className="bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 rounded-xl p-3.5 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs">{c.name}</h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">{c.role}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${
                            c.stage === "Offered" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                            : c.stage === "Interview" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                            : c.stage === "Rejected" ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-850 dark:text-slate-400"
                          }`}>
                            {c.stage}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-2.5 mt-3">
                          <span className="text-[10px] text-slate-400">{c.email}</span>
                          <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-1.5 py-0.5 rounded-md">Score: {c.score}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 flex flex-col items-center gap-2">
                    <UserCheck className="h-8 w-8 stroke-[1.5]" />
                    <span className="text-xs">No active candidates in pipeline.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Notices & Holidays */}
        <div className="space-y-6">
          
          {/* Announcements block */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Announcements</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Corporate notices and policies.</p>
              </div>
              <button
                onClick={() => setIsNoticeModalOpen(true)}
                className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                title="Publish Announcement"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3.5 max-h-56 overflow-y-auto">
              {announcements === undefined ? (
                <div className="py-6 text-center text-slate-400">
                  <span className="text-xs">Loading notices...</span>
                </div>
              ) : announcements.length > 0 ? (
                announcements.map((a) => (
                  <div key={a._id} className="bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-850 rounded-xl p-3 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-xs truncate max-w-[150px]">{a.title}</h4>
                      <span className="text-[9px] text-slate-400 shrink-0">
                        {new Date(a.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">{a.content}</p>
                    {a.targetRoles && (
                      <span className="inline-block text-[8px] bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 px-1 py-0.2 rounded-md font-semibold tracking-wider uppercase mt-1">
                        Target: {a.targetRoles.join(", ")}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 flex flex-col items-center gap-1.5">
                  <Megaphone className="h-5 w-5 text-slate-300 stroke-[1.5]" />
                  <span className="text-xs">No notice has been published yet.</span>
                </div>
              )}
            </div>
          </div>

          {/* Holidays & Birthdays block */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Upcoming Holidays</h3>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Corporate calendar events.</p>
            </div>

            <div className="space-y-3">
              {holidays === undefined ? (
                <div className="py-6 text-center text-slate-400">
                  <span className="text-xs">Loading holidays...</span>
                </div>
              ) : holidays.length > 0 ? (
                holidays.slice(0, 3).map((h) => (
                  <div key={h._id} className="flex gap-3 items-center">
                    <div className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100/50 dark:border-rose-900/30 flex items-center justify-center shrink-0 text-rose-500 font-semibold text-xs uppercase">
                      {new Date(h.date).toLocaleDateString([], { day: 'numeric', month: 'short' }).split(" ")}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200">{h.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">{h.type} Holiday</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 flex flex-col items-center gap-1">
                  <Award className="h-5 w-5 text-slate-350 stroke-[1.5]" />
                  <span className="text-xs">No holidays scheduled.</span>
                </div>
              )}
            </div>
          </div>

          {/* Payroll Insights mini-panel (anonymized aggregate — no individual CTC) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-indigo-500" />
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Payroll Insights</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">Aggregate stats only. Individual CTC is admin-exclusive.</p>
              </div>
            </div>

            <div className="space-y-3">
              {payrollAggregate === undefined ? (
                <div className="py-4 text-center text-slate-400 text-xs">Loading payroll data...</div>
              ) : (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total Monthly Outflow</span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      ₹{payrollAggregate.totalPayrollOutflow.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Average CTC</span>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      ₹{payrollAggregate.averageCTC.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Salary Configured</span>
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      {payrollAggregate.configuredCount} / {payrollAggregate.totalEmployees}
                    </span>
                  </div>
                  {payrollAggregate.missingCount > 0 && (
                    <div className="flex items-center gap-2 p-2.5 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-100 dark:border-amber-900/40">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                        {payrollAggregate.missingCount} employee{payrollAggregate.missingCount > 1 ? "s" : ""} missing salary structure
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{payrollAggregate.activeCount}</p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">Active</p>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-2.5 text-center">
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{payrollAggregate.onHoldCount}</p>
                      <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wide mt-0.5">On Hold</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Announcement Creation Modal */}
      {isNoticeModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-lg space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Publish Announcement</h3>
              <p className="text-xs text-slate-450 dark:text-slate-500">Write a notice that will display on dashboards.</p>
            </div>
            <form onSubmit={handlePublishNotice} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Title</label>
                <input
                  type="text"
                  required
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Q3 Strategic Planning Session"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Content</label>
                <textarea
                  required
                  rows={4}
                  value={noticeForm.content}
                  onChange={(e) => setNoticeForm((prev) => ({ ...prev, content: e.target.value }))}
                  placeholder="e.g. The meeting will commence tomorrow at 10 AM in Conference Hall A..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsNoticeModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {publishing ? "Publishing..." : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
}
