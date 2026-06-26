"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";
import {
  HelpCircle,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
  Mail,
  Loader2,
  Filter,
  Check,
  Building,
  Search,
  MessageSquare,
  X,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function EmployeeQueriesPage() {
  const queries = useQuery(api.users.listQueries);
  const currentUser = useQuery(api.users.current);

  const hrReview = useMutation(api.users.hrReviewQuery);
  const adminReview = useMutation(api.users.adminReviewQuery);

  const [typeFilter, setTypeFilter] = useState<"All" | "Resignation" | "Support">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending HR Review" | "Pending Admin Review" | "Resolved">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<Id<"queries"> | null>(null);
  const [remarksInputs, setRemarksInputs] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [noticePeriods, setNoticePeriods] = useState<Record<string, string>>({});
  const [customNoticeInputs, setCustomNoticeInputs] = useState<Record<string, string>>({});

  const handleHRAction = async (id: Id<"queries">, action: "Approve" | "Reject" | "Proceed") => {
    const remarks = remarksInputs[id] || "";
    setUpdatingId(id);
    try {
      await hrReview({ queryId: id, action, remarks });
      setSuccessMessage(`Query updated: ${action === "Proceed" ? "Proceeded to Admin" : action + "d by HR"}!`);
      setRemarksInputs((prev) => ({ ...prev, [id]: "" }));
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAdminAction = async (id: Id<"queries">, action: "Approve" | "Reject") => {
    const remarks = remarksInputs[id] || "";
    if (!remarks.trim()) {
      alert("Please provide remarks/reason for this action.");
      return;
    }

    const queryItem = queries?.find((q) => q._id === id);
    const isResignation = queryItem?.type === "Resignation";

    let noticePeriod: string | undefined = undefined;
    if (isResignation && action === "Approve") {
      const selectedOption = noticePeriods[id] || "30 Days";
      if (selectedOption === "Custom") {
        noticePeriod = customNoticeInputs[id] || "";
        if (!noticePeriod.trim()) {
          alert("Please specify the custom notice period.");
          return;
        }
      } else {
        noticePeriod = selectedOption;
      }
    }

    setUpdatingId(id);
    try {
      await adminReview({
        queryId: id,
        action,
        remarks,
        noticePeriod: noticePeriod || undefined,
      });
      setSuccessMessage(`Query ${action === "Approve" ? "Approved" : "Rejected"} by Admin!`);
      setRemarksInputs((prev) => ({ ...prev, [id]: "" }));
      setNoticePeriods((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      setCustomNoticeInputs((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (queries === undefined || currentUser === undefined) {
    return (
      <div className="py-16 text-center text-slate-500 dark:text-slate-450 flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 text-indigo-600 animate-spin" />
        <span className="text-xs font-semibold">Loading queries...</span>
      </div>
    );
  }

  const userRole = currentUser?.role || "";

  // Stats calculation
  const totalCount = queries.length;
  const pendingResignations = queries.filter(
    (q) => q.type === "Resignation" && (q.status === "Pending HR Review" || q.status === "Pending Admin Review")
  ).length;
  const pendingSupport = queries.filter(
    (q) => q.type === "Support" && (q.status === "Pending HR Review" || q.status === "Pending Admin Review")
  ).length;
  const resolvedCount = queries.filter(
    (q) =>
      q.status === "Approved by HR" ||
      q.status === "Rejected by HR" ||
      q.status === "Approved by Admin" ||
      q.status === "Rejected by Admin"
  ).length;

  // Filter & Search queries
  const filteredQueries = queries.filter((q) => {
    const matchesType = typeFilter === "All" || q.type === typeFilter;
    
    let matchesStatus = true;
    if (statusFilter === "Resolved") {
      matchesStatus =
        q.status === "Approved by HR" ||
        q.status === "Rejected by HR" ||
        q.status === "Approved by Admin" ||
        q.status === "Rejected by Admin";
    } else if (statusFilter !== "All") {
      matchesStatus = q.status === statusFilter;
    }

    const matchesSearch =
      q.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesStatus && matchesSearch;
  });

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
          <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Employee Queries</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Monitor, review, and resolve employee resignations and support tickets via multi-tier workflow.
          </p>
        </div>
      </div>

      {/* Floating Success Alert */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3.5 rounded-xl font-medium shadow-xs"
          >
            <CheckCircle className="h-4.5 w-4.5 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs space-y-2 select-none">
          <span className="text-[10px] text-slate-450 dark:text-slate-550 uppercase tracking-widest font-bold block">Total Queries</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{totalCount}</span>
            <span className="text-[10px] text-slate-450 font-medium">all time</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs space-y-2 select-none">
          <span className="text-[10px] text-rose-500 uppercase tracking-widest font-bold block">Pending Resignations</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-rose-600 dark:text-rose-450">{pendingResignations}</span>
            <span className="text-[10px] text-rose-400 font-medium">requires action</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs space-y-2 select-none">
          <span className="text-[10px] text-amber-500 uppercase tracking-widest font-bold block">Pending Support</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-amber-600 dark:text-amber-450">{pendingSupport}</span>
            <span className="text-[10px] text-amber-450 font-medium">open tickets</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4.5 rounded-2xl shadow-xs space-y-2 select-none">
          <span className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold block">Resolved Queries</span>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-450">{resolvedCount}</span>
            <span className="text-[10px] text-emerald-450 font-medium">completed</span>
          </div>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-550" />
          <input
            type="text"
            placeholder="Search submitter, subject, keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 text-slate-850 dark:text-slate-100"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as "All" | "Resignation" | "Support")}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer focus:outline-hidden"
          >
            <option value="All">All Types</option>
            <option value="Resignation">Resignations</option>
            <option value="Support">Support Tickets</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "All" | "Pending HR Review" | "Pending Admin Review" | "Resolved")}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer focus:outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="Pending HR Review">Pending HR Review</option>
            <option value="Pending Admin Review">Pending Admin Review</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Queries List Grid */}
      {filteredQueries.length === 0 ? (
        <div className="py-16 text-center text-slate-450 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-3">
          <HelpCircle className="h-8 w-8 text-slate-300 dark:text-slate-650" />
          <p className="text-xs font-medium">No queries found matching the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQueries.map((queryItem: Doc<"queries">) => {
            const isResignation = queryItem.type === "Resignation";
            const isPendingHR = queryItem.status === "Pending HR Review";
            const isPendingAdmin = queryItem.status === "Pending Admin Review";
            const isApproved = queryItem.status.startsWith("Approved");
            const isRejected = queryItem.status.startsWith("Rejected");

            // HR is allowed to review Pending HR Review
            const showHRActions = userRole === "hr" && isPendingHR;
            // Admin is allowed to review Pending Admin Review
            const showAdminActions = userRole === "admin" && isPendingAdmin;

            return (
              <motion.div
                key={queryItem._id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 p-5 rounded-2xl shadow-xs space-y-4 hover:border-slate-250 dark:hover:border-slate-750 transition-colors"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-850">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-550 dark:text-slate-450 font-bold text-xs shrink-0 uppercase select-none">
                      {(queryItem.name || "E").charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <span>{queryItem.name}</span>
                        {queryItem.position && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                            ({queryItem.position})
                          </span>
                        )}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{queryItem.email}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(queryItem.createdAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    {/* Type badge */}
                    <span
                      className={`px-2 py-0.5 border rounded-md text-[9px] font-bold uppercase tracking-wider ${
                        isResignation
                          ? "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400"
                          : "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400"
                      }`}
                    >
                      {queryItem.type}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`px-2 py-0.5 border rounded-md text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                        isApproved
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-455"
                          : isRejected
                          ? "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/40 dark:text-rose-400"
                          : "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:border-amber-900/40 dark:text-amber-400"
                      }`}
                    >
                      {(isPendingHR || isPendingAdmin) && (
                        <span className="h-1.5 w-1.5 bg-amber-500 rounded-full animate-pulse" />
                      )}
                      <span>{queryItem.status}</span>
                    </span>
                  </div>
                </div>

                {/* Query contents */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-100">{queryItem.subject}</h4>
                    <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed mt-1.5 whitespace-pre-wrap">
                      {queryItem.description}
                    </p>
                  </div>

                  {/* Resignation Extra Details */}
                  {isResignation && (queryItem.resignationDate || queryItem.position || queryItem.noticePeriod) && (
                    <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-850 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      {queryItem.position && (
                        <div className="space-y-1">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Resigning Designation</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Building className="h-3.5 w-3.5 text-slate-400" />
                            <span>{queryItem.position}</span>
                          </span>
                        </div>
                      )}
                      {queryItem.resignationDate && (
                        <div className="space-y-1">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Last Working Day</span>
                          <span className="font-semibold text-rose-600 dark:text-rose-455 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-rose-400" />
                            <span>{new Date(queryItem.resignationDate).toLocaleDateString(undefined, { dateStyle: "medium" })}</span>
                          </span>
                        </div>
                      )}
                      {queryItem.noticePeriod && (
                        <div className="space-y-1 sm:col-span-2 border-t border-slate-100 dark:border-slate-850 pt-2.5">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Approved Serving Notice Period</span>
                          <span className="font-semibold text-indigo-650 dark:text-indigo-400 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-indigo-400" />
                            <span>{queryItem.noticePeriod}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Existing Review Notes (Visible to all Admin/HR) */}
                  {(queryItem.hrReviewedBy || queryItem.adminReviewedBy) && (
                    <div className="pt-2.5 border-t border-slate-100 dark:border-slate-850 space-y-2 text-xs">
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Review Progress</span>
                      
                      {queryItem.hrReviewedBy && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-850 rounded-xl">
                          <div className="flex justify-between items-center font-bold text-slate-700 dark:text-slate-300">
                            <span>Reviewed by HR ({queryItem.hrReviewedBy})</span>
                            {queryItem.hrReviewedAt && (
                              <span className="font-mono text-slate-400 font-normal">{new Date(queryItem.hrReviewedAt).toLocaleString()}</span>
                            )}
                          </div>
                          {queryItem.hrRemarks && (
                            <p className="text-slate-500 dark:text-slate-400 mt-1 leading-normal italic">&quot;{queryItem.hrRemarks}&quot;</p>
                          )}
                        </div>
                      )}

                      {queryItem.adminReviewedBy && (
                        <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-150 dark:border-slate-850 rounded-xl">
                          <div className="flex justify-between items-center font-bold text-slate-700 dark:text-slate-300">
                            <span>Reviewed by Admin ({queryItem.adminReviewedBy})</span>
                            {queryItem.adminReviewedAt && (
                              <span className="font-mono text-slate-400 font-normal">{new Date(queryItem.adminReviewedAt).toLocaleString()}</span>
                            )}
                          </div>
                          {queryItem.adminRemarks && (
                            <p className="text-slate-500 dark:text-slate-400 mt-1 leading-normal italic">&quot;{queryItem.adminRemarks}&quot;</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Review Actions Panel */}
                {(showHRActions || showAdminActions) && (
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-850 space-y-3.5">
                    {showAdminActions && queryItem.type === "Resignation" && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                          Notice / Serving Period
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={noticePeriods[queryItem._id] || "30 Days"}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNoticePeriods((prev) => ({ ...prev, [queryItem._id]: val }));
                            }}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-hidden focus:border-indigo-500"
                          >
                            <option value="30 Days">30 Days (Standard)</option>
                            <option value="Immediate">Immediate (No Notice)</option>
                            <option value="15 Days">15 Days</option>
                            <option value="60 Days">60 Days</option>
                            <option value="90 Days">90 Days</option>
                            <option value="Custom">Custom Period</option>
                          </select>

                          {(noticePeriods[queryItem._id] === "Custom") && (
                            <input
                              type="text"
                              value={customNoticeInputs[queryItem._id] || ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setCustomNoticeInputs((prev) => ({ ...prev, [queryItem._id]: val }));
                              }}
                              placeholder="e.g. 45 Days, end of quarter"
                              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 text-slate-850 dark:text-slate-100 font-semibold"
                            />
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                        Remarks / Comments {showAdminActions && <span className="text-rose-500 font-bold">* (Required)</span>}
                      </label>
                      <textarea
                        rows={2}
                        value={remarksInputs[queryItem._id] || ""}
                        onChange={(e) =>
                          setRemarksInputs((prev) => ({ ...prev, [queryItem._id]: e.target.value }))
                        }
                        placeholder={
                          showAdminActions
                            ? "Provide rejection reason or approval details..."
                            : "Add comments for the review record (optional)..."
                        }
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 text-slate-850 dark:text-slate-100 resize-none font-semibold"
                      />
                    </div>

                    <div className="flex justify-end gap-2.5">
                      {showHRActions && (
                        <>
                          <button
                            onClick={() => handleHRAction(queryItem._id, "Reject")}
                            disabled={updatingId !== null}
                            className="px-3.5 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/20 disabled:opacity-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                          >
                            {updatingId === queryItem._id ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : <X className="h-3.5 w-3.5 inline mr-1" />}
                            Reject
                          </button>
                          
                          <button
                            onClick={() => handleHRAction(queryItem._id, "Approve")}
                            disabled={updatingId !== null}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            {updatingId === queryItem._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Approve
                          </button>

                          <button
                            onClick={() => handleHRAction(queryItem._id, "Proceed")}
                            disabled={updatingId !== null}
                            className="px-3.5 py-1.5 bg-indigo-650 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                          >
                            {updatingId === queryItem._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                            Proceed to Admin
                          </button>
                        </>
                      )}

                      {showAdminActions && (
                        <>
                          <button
                            onClick={() => handleAdminAction(queryItem._id, "Reject")}
                            disabled={updatingId !== null || !(remarksInputs[queryItem._id] || "").trim()}
                            className="px-3.5 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/40 dark:text-rose-400 dark:hover:bg-rose-950/20 disabled:opacity-50 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                          >
                            {updatingId === queryItem._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                            Reject (Reason Required)
                          </button>

                          <button
                            onClick={() => handleAdminAction(queryItem._id, "Approve")}
                            disabled={updatingId !== null || !(remarksInputs[queryItem._id] || "").trim()}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                          >
                            {updatingId === queryItem._id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Approve Query
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
