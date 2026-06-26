"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  FileText,
  Search,
  Plus,
  AlertCircle,
  X,
  CheckCircle,
  ExternalLink,
  Filter,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DocumentItem {
  _id: string;
  userId: string;
  name: string;
  fileUrl: string;
  uploadedAt: number;
  type: string; // "Contract" | "ID Card" | "Certification" | "Other"
  employeeName: string;
  employeeId: string;
}

export default function DocumentsPage() {
  const documents = useQuery(api.hr.getEmployeeDocuments);
  const employees = useQuery(api.dashboard.getEmployeeOverview);
  const uploadDoc = useMutation(api.hr.uploadDocument);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [docForm, setDocForm] = useState({ userId: "", name: "", fileUrl: "", type: "Contract" });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.userId || !docForm.name || !docForm.fileUrl) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await uploadDoc({
        userId: docForm.userId,
        name: docForm.name.trim(),
        fileUrl: docForm.fileUrl.trim(),
        type: docForm.type,
      });
      setSuccessMsg(res.message);
      setDocForm({ userId: "", name: "", fileUrl: "", type: "Contract" });
      setIsUploadModalOpen(false);
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredDocs = (documents || []).filter((d: DocumentItem) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || d.type === typeFilter;

    return matchesSearch && matchesType;
  });

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
          <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Document Management</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Store and view employment contracts, compliance IDs, and certificates.</p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 text-white rounded-xl text-xs font-medium shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {/* Alert Banner */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3.5 rounded-xl animate-fade-in">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

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
              placeholder="Search by document name, employee name, or ID..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all duration-200"
            />
          </div>

          <div className="relative shrink-0">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-700 dark:text-slate-355 text-xs font-semibold focus:outline-hidden appearance-none cursor-pointer"
            >
              <option value="all">All Document Types</option>
              <option value="Contract">Contracts</option>
              <option value="ID Card">ID Cards</option>
              <option value="Certification">Certifications</option>
              <option value="Other">Others</option>
            </select>
          </div>
        </div>

        {/* Documents Table */}
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-850">
                <th className="p-4">Document Title</th>
                <th className="p-4">Employee</th>
                <th className="p-4">Uploaded At</th>
                <th className="p-4">Document Type</th>
                <th className="p-4 text-right">View Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-855">
              {documents === undefined ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-450 dark:text-slate-550">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading documents...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredDocs.length > 0 ? (
                filteredDocs.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-550 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-slate-850 dark:text-slate-100">{d.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{d.employeeName}</span>
                        {d.employeeId && (
                          <span className="ml-2 text-[9px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-400 px-1.5 py-0.2 rounded-md font-mono">{d.employeeId}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {new Date(d.uploadedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                        d.type === "Contract" ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400"
                        : d.type === "ID Card" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : d.type === "Certification" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-850 dark:text-slate-400"
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {d.type}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <a
                        href={d.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold hover:underline cursor-pointer"
                      >
                        <span>Open Document</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                    <AlertCircle className="h-6 w-6 stroke-[1.5]" />
                    <span className="text-xs">No documents registered in the system library.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Document Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-lg space-y-4"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-855 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Upload New File Reference</h3>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5 font-medium">Link a document URL reference to an employee profile.</p>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
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

              <form onSubmit={handleUpload} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Select Employee</label>
                  <select
                    required
                    value={docForm.userId}
                    onChange={(e) => setDocForm((prev) => ({ ...prev, userId: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="">-- Choose Employee --</option>
                    {(employees || []).map((e) => (
                      <option key={e._id} value={e._id}>
                        {e.name} ({e.department} - {e.deptCode})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Document Name</label>
                    <input
                      type="text"
                      required
                      value={docForm.name}
                      onChange={(e) => setDocForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. NDA Agreement"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Document Type</label>
                    <select
                      value={docForm.type}
                      onChange={(e) => setDocForm((prev) => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Contract">Contract</option>
                      <option value="ID Card">ID Card</option>
                      <option value="Certification">Certification</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Document Link / URL</label>
                  <input
                    type="url"
                    required
                    value={docForm.fileUrl}
                    onChange={(e) => setDocForm((prev) => ({ ...prev, fileUrl: e.target.value }))}
                    placeholder="https://company-drive.com/contracts/sarah.pdf"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Registering..." : "Upload Document"}
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
