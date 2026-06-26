"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Building2,
  Search,
  Plus,
  AlertCircle,
  X,
  CheckCircle,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Department {
  _id: string;
  name: string;
  code: string;
  employeeCount: number;
  managerId?: string;
}

export default function DepartmentsPage() {
  const currentUser = useQuery(api.users.current);
  const departments = useQuery(api.hr.getDepartments);
  const createDept = useMutation(api.hr.createDepartment);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deptForm, setDeptForm] = useState({ name: "", code: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptForm.name || !deptForm.code) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await createDept({
        name: deptForm.name.trim(),
        code: deptForm.code.trim().toUpperCase(),
      });
      setSuccessMsg(res.message);
      setDeptForm({ name: "", code: "" });
      setIsAddModalOpen(false);
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredDepts = (departments || []).filter(
    (d: Department) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdmin = currentUser?.role === "admin";

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
          <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Enterprise Departments</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAdmin ? "Create and manage organizational groups." : "View authorized corporate departments."}
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 text-white rounded-xl text-xs font-medium shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Department</span>
          </button>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-xl text-[10px] font-semibold uppercase tracking-wider select-none">
            <Lock className="h-3.5 w-3.5" />
            <span>HR View-Only Access</span>
          </div>
        )}
      </div>

      {/* Success alert */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3.5 rounded-xl animate-fade-in">
          <CheckCircle className="h-4.5 w-4.5 shrink-0 stroke-[1.8]" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Search Filter */}
      <div className="relative max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-2.5 shadow-xs">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[1.8]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter departments by name or code..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all duration-200"
        />
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments === undefined ? (
          <div className="col-span-3 py-12 text-center text-slate-450 dark:text-slate-550 flex flex-col items-center gap-3">
            <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading departments...</span>
          </div>
        ) : filteredDepts.length > 0 ? (
          filteredDepts.map((d) => (
            <div
              key={d._id}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-40 hover:scale-[1.01] hover:border-indigo-400/50 dark:hover:border-indigo-500/50 transition-all duration-150"
            >
              <div className="flex justify-between items-start">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <Building2 className="h-5.5 w-5.5" />
                </div>
                <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-450 dark:text-slate-400 px-2 py-0.5 rounded-md font-mono uppercase tracking-wider">
                  {d.code}
                </span>
              </div>
              <div className="mt-4">
                <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-sm">{d.name}</h4>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-semibold tracking-wider">
                  {d.employeeCount} active {d.employeeCount === 1 ? "employee" : "employees"}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 py-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <AlertCircle className="h-6 w-6 stroke-[1.5]" />
            <span className="text-xs">No departments found matching filters.</span>
          </div>
        )}
      </div>

      {/* Add Department Modal (Admin only) */}
      <AnimatePresence>
        {isAddModalOpen && isAdmin && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-lg space-y-4"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-855 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Create New Department</h3>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">Register a new organization unit into the database.</p>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 text-rose-700 text-xs p-3 rounded-xl">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateDept} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Department Name</label>
                  <input
                    type="text"
                    required
                    value={deptForm.name}
                    onChange={(e) => setDeptForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Sales & Marketing"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Department Code (3-4 characters)</label>
                  <input
                    type="text"
                    required
                    maxLength={5}
                    value={deptForm.code}
                    onChange={(e) => setDeptForm((prev) => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g. MKT"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Creating..." : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
