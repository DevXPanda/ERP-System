"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";

interface LeaveRequest {
  _id: string;
  userId: string;
  employeeName: string;
  employeeEmail: string;
  employeeId: string;
  designation: string;
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  appliedOn: number;
}

export default function LeavesPage() {
  const requests = useQuery(api.hr.getLeaveRequests);
  const approveLeave = useMutation(api.hr.updateLeaveStatus);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handleAction = async (leaveId: string, status: "Approved" | "Rejected") => {
    setProcessingId(leaveId);
    try {
      await approveLeave({ leaveId: leaveId as Id<"leaves">, status });
    } catch (err) {
      console.error("Failed to update leave request:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = (requests || []).filter((r: LeaveRequest) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = (requests || []).filter((r) => r.status === "Pending").length;
  const approvedCount = (requests || []).filter((r) => r.status === "Approved").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Leave Management</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manage and audit corporate leave requests and approvals.</p>
      </div>

      {/* Counters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Pending Requests</span>
            <h3 className="text-xl font-semibold text-slate-850 dark:text-slate-100 mt-0.5">{pendingCount}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Approved Requests</span>
            <h3 className="text-xl font-semibold text-slate-850 dark:text-slate-100 mt-0.5">{approvedCount}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-950/30 text-slate-500 dark:text-slate-400 flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">Total Applied Applications</span>
            <h3 className="text-xl font-semibold text-slate-850 dark:text-slate-100 mt-0.5">{requests?.length || 0}</h3>
          </div>
        </div>
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
              placeholder="Search by employee name, email, or reason..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all duration-200"
            />
          </div>

          <div className="relative shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-350 text-xs font-semibold focus:outline-hidden appearance-none cursor-pointer"
            >
              <option value="all">All Request Statuses</option>
              <option value="Pending">Pending Only</option>
              <option value="Approved">Approved Only</option>
              <option value="Rejected">Rejected Only</option>
            </select>
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-850">
                <th className="p-4">Employee</th>
                <th className="p-4">Leave Details</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Applied On</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {requests === undefined ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-450 dark:text-slate-550">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Fetching applications...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-500 font-semibold shrink-0 uppercase">
                          {r.employeeName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800 dark:text-slate-100">{r.employeeName}</span>
                            <span className="text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-450 px-1.5 py-0.2 rounded-md font-mono">{r.employeeId}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{r.designation}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{r.type} Leave</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{r.startDate} to {r.endDate}</p>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={r.reason}>
                      &ldquo;{r.reason}&rdquo;
                    </td>
                    <td className="p-4 text-slate-400 dark:text-slate-550">
                      {new Date(r.appliedOn).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                        r.status === "Approved"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : r.status === "Rejected"
                            ? "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400"
                            : "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400"
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {r.status === "Pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAction(r._id, "Rejected")}
                            disabled={processingId !== null}
                            className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100 dark:border-rose-900/50 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleAction(r._id, "Approved")}
                            disabled={processingId !== null}
                            className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-900/50 transition-colors disabled:opacity-50 cursor-pointer"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                    <AlertCircle className="h-6 w-6 stroke-[1.5]" />
                    <span className="text-xs">No leave requests found matching filters.</span>
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
