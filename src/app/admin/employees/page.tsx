"use client";

import React, { useState } from "react";
import { Users, Search, Filter, Download, AlertCircle, Loader2, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";

const ROLE_STYLES: Record<string, string> = {
  admin: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  hr: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
  employee: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export default function EmployeeDetailsPage() {
  const employees = useQuery(api.users.list);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const filtered = (employees ?? []).filter((emp) => {
    const q = search.toLowerCase();
    const matchSearch =
      (emp.name ?? "").toLowerCase().includes(q) ||
      (emp.email ?? "").toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || emp.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Employee Details
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {employees === undefined
              ? "Loading…"
              : `${employees.length} total employees across all departments.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (!employees) return;
              const csv = [
                "Name,Email,Role,Phone",
                ...employees.map(
                  (e) =>
                    `"${e.name ?? ""}","${e.email ?? ""}","${e.role ?? ""}","${e.phone ?? ""}"`
                ),
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "employees.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={!employees || employees.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
          <Link
            href="/admin/employees/create"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-sm"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add Employee
          </Link>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 flex flex-wrap gap-3 items-center shadow-xs">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer font-medium"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="hr">HR</option>
            <option value="employee">Employee</option>
          </select>
        </div>
      </div>

      {/* Table / States */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Loading */}
        {employees === undefined && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
            <span className="text-xs">Loading employees…</span>
          </div>
        )}

        {/* Empty state */}
        {employees !== undefined && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400">
            {employees.length === 0 ? (
              <>
                <div className="h-14 w-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-400">
                  <Users className="h-7 w-7 stroke-[1.5]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No employees yet</p>
                  <p className="text-xs mt-1">
                    Seed the database from the Overview page or{" "}
                    <Link href="/admin/employees/create" className="text-indigo-500 hover:underline">
                      add the first employee
                    </Link>
                    .
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-6 w-6 stroke-[1.5]" />
                <span className="text-sm">No employees match your filters.</span>
              </>
            )}
          </div>
        )}

        {/* Desktop table */}
        {employees !== undefined && filtered.length > 0 && (
          <>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="px-5 py-3.5">Name</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">Phone</th>
                    <th className="px-5 py-3.5">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                  {filtered.map((emp) => (
                    <tr
                      key={emp._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/20 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                        {emp.name ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                        {emp.email ?? "—"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                        {emp.phone ?? "—"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                            ROLE_STYLES[emp.role ?? "employee"] ?? ROLE_STYLES.employee
                          }`}
                        >
                          {emp.role ?? "employee"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800/40">
              {filtered.map((emp) => (
                <div key={emp._id} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                        {emp.name ?? "—"}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{emp.email ?? "—"}</p>
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full font-semibold text-[10px] uppercase ${
                        ROLE_STYLES[emp.role ?? "employee"] ?? ROLE_STYLES.employee
                      }`}
                    >
                      {emp.role ?? "employee"}
                    </span>
                  </div>
                  {emp.phone && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{emp.phone}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Footer count */}
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
              Showing {filtered.length} of {employees.length} employees
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
