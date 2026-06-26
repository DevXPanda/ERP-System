"use client";

import React, { useState } from "react";
import {
  Users,
  Clock,
  Wallet,
  Search,
  Bell,
  Calendar,
  MoreVertical,
  Plus,
  Filter,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";

export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState("overview");

  const stats = [
    { label: "Active Workforce", value: "1,248", change: "+12.3%", up: true, icon: <Users className="h-5 w-5 text-blue-500" /> },
    { label: "On-Time Rate", value: "98.4%", change: "+2.1%", up: true, icon: <Clock className="h-5 w-5 text-purple-500" /> },
    { label: "Monthly Payroll", value: "$342,100", change: "-0.8%", up: false, icon: <Wallet className="h-5 w-5 text-emerald-500" /> },
  ];

  const employees = [
    { name: "Sarah Connor", role: "HR Director", department: "People Operations", status: "Active", email: "sarah.c@erp.io", avatar: "SC" },
    { name: "John Doe", role: "Frontend Dev", department: "Engineering", status: "On Leave", email: "john.doe@erp.io", avatar: "JD" },
    { name: "Elena Rostova", role: "Product Manager", department: "Product", status: "Active", email: "elena.r@erp.io", avatar: "ER" },
    { name: "Marcus Wright", role: "DevOps Engineer", department: "Engineering", status: "Active", email: "marcus.w@erp.io", avatar: "MW" },
    { name: "Kyle Reese", role: "Security Lead", department: "Operations", status: "Active", email: "kyle.r@erp.io", avatar: "KR" },
  ];

  const activities = [
    { desc: "Sarah Connor updated HR Handbook", time: "10 mins ago", type: "update" },
    { desc: "John Doe requested leave extension", time: "1 hour ago", type: "request" },
    { desc: "GPS Fence validated: Central Office", time: "3 hours ago", type: "system" },
    { desc: "Elena Rostova approved payslip batch", time: "5 hours ago", type: "action" },
  ];

  return (
    <section className="relative py-24 bg-slate-50 dark:bg-background-brand overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-semibold tracking-wider text-primary-brand uppercase">
            Live Preview
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-2">
            Experience the Enterprise Interface
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-4">
            Interactive, sleek, and high-performance. Take a look at the layout our technology partners NKTech & Bizwoke Nova crafted.
          </p>
        </div>

        {/* Custom Tab Toggles */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1 rounded-xl bg-slate-200/50 dark:bg-white/5 border border-slate-200 dark:border-white/5 backdrop-blur-md">
            {[
              { id: "overview", name: "Overview" },
              { id: "employees", name: "Employee Directory" },
              { id: "reports", name: "Reports & Activity" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? "bg-primary-brand text-white shadow-md"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Preview Shell */}
        <div className="relative max-w-5xl mx-auto rounded-2xl p-1 bg-gradient-to-b from-slate-200 to-transparent dark:from-white/10 dark:to-transparent shadow-xl">
          <div className="glass-card rounded-xl overflow-hidden min-h-[550px] flex flex-col bg-white dark:bg-card-brand">
            {/* Header bar */}
            <div className="h-14 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex items-center justify-between px-6">
              <div className="flex items-center space-x-3">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/10"></div>
                </div>
                <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase border-l border-slate-200 dark:border-white/10 pl-3">
                  Nova ERP Enterprise
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Quick Search..."
                    disabled
                    className="w-48 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none"
                  />
                </div>
                <button className="relative p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300">
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                </button>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                    AD
                  </div>
                </div>
              </div>
            </div>

            {/* Dashboard Workspace */}
            <div className="flex-1 flex flex-col md:flex-row text-left">
              {/* Sidebar */}
              <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/5 p-4 space-y-6 bg-slate-50/30 dark:bg-white/2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3">
                    Modules
                  </span>
                  <div className="space-y-1 pt-1.5">
                    <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-900 dark:bg-white/5 dark:text-white flex items-center justify-between">
                      <span>Dashboard</span>
                      <ArrowUpRight className="h-3 w-3 text-slate-500" />
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors">
                      Employee Directory
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors">
                      Attendance & GPS
                    </button>
                    <button className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors">
                      Payroll & Leaves
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3">
                    Recent Offices
                  </span>
                  <div className="space-y-2 pt-2 px-3">
                    <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                      <span>NY HQ (120m radius)</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                      <span>London Branch</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Viewport */}
              <div className="flex-1 p-6">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Metric widgets */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {stats.map((stat, idx) => (
                        <div key={idx} className="glass-panel rounded-xl p-4 border border-slate-200 dark:border-white/5 flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              {stat.label}
                            </span>
                            <div className="flex items-baseline space-x-2">
                              <span className="text-xl font-bold text-slate-900 dark:text-white">
                                {stat.value}
                              </span>
                              <span className={`text-[10px] font-semibold ${stat.up ? "text-emerald-500" : "text-rose-500"}`}>
                                {stat.change}
                              </span>
                            </div>
                          </div>
                          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                            {stat.icon}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Analytics Graph mockup */}
                    <div className="glass-panel rounded-xl p-5 border border-slate-200 dark:border-white/5">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide">
                          Workforce Activity (Monthly Trend)
                        </h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          Updated Real-Time
                        </span>
                      </div>
                      <div className="h-44 w-full flex items-end">
                        <svg className="w-full h-full text-blue-500/10 dark:text-blue-500/30" viewBox="0 0 100 30" preserveAspectRatio="none">
                          <path d="M0,25 Q10,12 25,18 T50,8 T75,14 L100,5 L100,30 L0,30 Z" fill="currentColor"></path>
                          <path d="M0,25 Q10,12 25,18 T50,8 T75,14 L100,5" fill="none" stroke="#2563EB" strokeWidth="1.5"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "employees" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide">
                        Employee Directory Listing
                      </h4>
                      <div className="flex items-center space-x-2">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                          <Filter className="h-3 w-3" />
                          <span>Filters</span>
                        </button>
                        <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-brand text-[11px] font-semibold text-white">
                          <Plus className="h-3 w-3" />
                          <span>Add Employee</span>
                        </button>
                      </div>
                    </div>

                    {/* Employee Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-white/5 text-slate-400 dark:text-slate-500">
                            <th className="py-2.5 font-medium">Name</th>
                            <th className="py-2.5 font-medium">Title</th>
                            <th className="py-2.5 font-medium">Department</th>
                            <th className="py-2.5 font-medium">Status</th>
                            <th className="py-2.5 font-medium text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees.map((emp, idx) => (
                            <tr key={idx} className="border-b border-slate-100 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors">
                              <td className="py-3 flex items-center space-x-3">
                                <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-bold text-slate-800 dark:text-white border border-slate-200 dark:border-white/10">
                                  {emp.avatar}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-white">{emp.name}</div>
                                  <div className="text-[10px] text-slate-400 dark:text-slate-500">{emp.email}</div>
                                </div>
                              </td>
                              <td className="py-3 text-slate-600 dark:text-slate-400">{emp.role}</td>
                              <td className="py-3 text-slate-600 dark:text-slate-400">{emp.department}</td>
                              <td className="py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  emp.status === "Active" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                                }`}>
                                  {emp.status}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <button className="text-slate-400 hover:text-slate-900 dark:text-slate-500 dark:hover:text-white">
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {activeTab === "reports" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Recent Activities */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide">
                          Activity Logs
                        </h4>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Live feed</span>
                      </div>
                      <div className="space-y-3">
                        {activities.map((act, idx) => (
                          <div key={idx} className="glass-panel rounded-xl p-4 border border-slate-200 dark:border-white/5 flex items-start space-x-3">
                            <div className="mt-0.5">
                              {act.type === "system" ? (
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                            <div className="flex-1 flex justify-between items-baseline">
                              <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{act.desc}</p>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap ml-2">
                                {act.time}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Small calendar container */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white tracking-wide">
                        Task Schedule
                      </h4>
                      <div className="glass-panel rounded-xl p-4 border border-slate-200 dark:border-white/5 flex flex-col space-y-4">
                        <div className="flex items-center justify-between text-xs text-slate-900 dark:text-white">
                          <span className="font-bold">June 2026</span>
                          <Calendar className="h-4 w-4 text-slate-400" />
                        </div>
                        {/* Mini Grid representing Calendar days */}
                        <div className="grid grid-cols-7 gap-1 text-[9px] font-bold text-center text-slate-400 dark:text-slate-500">
                          <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                          {[24, 25, 26, 27, 28, 29, 30].map((day) => (
                            <span key={day} className={`p-1 rounded ${day === 25 ? "bg-primary-brand text-white font-black" : "text-slate-500"}`}>
                              {day}
                            </span>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-slate-200 dark:border-white/5 space-y-2">
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Upcoming Tasks</div>
                          <div className="text-[11px] text-slate-900 dark:text-white font-semibold flex items-center justify-between">
                            <span>Audit payroll sheets</span>
                            <span className="text-[9px] text-yellow-600 dark:text-yellow-400 font-bold bg-yellow-400/10 px-1.5 py-0.5 rounded">Urgent</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
