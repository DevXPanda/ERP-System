"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  Megaphone,
  Plus,
  AlertCircle,
  X,
  CheckCircle,
  Search,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  publishedAt: number;
  targetRoles?: string[];
}

export default function AnnouncementsPage() {
  const announcements = useQuery(api.hr.getAnnouncements);
  const createNotice = useMutation(api.hr.createAnnouncement);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: "", content: "", targetRole: "all" });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeForm.title || !noticeForm.content) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const targetRoles = noticeForm.targetRole === "all" ? undefined : [noticeForm.targetRole];
      const res = await createNotice({
        title: noticeForm.title.trim(),
        content: noticeForm.content.trim(),
        targetRoles,
      });
      setSuccessMsg(res.message);
      setNoticeForm({ title: "", content: "", targetRole: "all" });
      setIsAddModalOpen(false);
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredNotices = (announcements || []).filter(
    (a: Announcement) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Announcements Board</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Broadcast notices and policies to employee dashboards.</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 text-white rounded-xl text-xs font-medium shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Publish Notice</span>
        </button>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3.5 rounded-xl animate-fade-in">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filters */}
      <div className="relative max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-2.5 shadow-xs">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[1.8]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter announcements by keywords..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all duration-200"
        />
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {announcements === undefined ? (
          <div className="col-span-2 py-12 text-center text-slate-450 dark:text-slate-550 flex flex-col items-center gap-3">
            <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading announcements...</span>
          </div>
        ) : filteredNotices.length > 0 ? (
          filteredNotices.map((a) => (
            <div
              key={a._id}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-550 transition-colors"
            >
              <div className="flex justify-between items-start pb-3 border-b border-slate-100 dark:border-slate-850">
                <div className="flex gap-3 items-center">
                  <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Megaphone className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-850 dark:text-slate-100 text-sm leading-none">{a.title}</h4>
                    <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1.5 font-semibold uppercase tracking-wider">
                      Target Audience: {a.targetRoles ? a.targetRoles.join(", ") : "All Staff"}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold font-mono">
                  {new Date(a.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
                {a.content}
              </p>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-12 text-center text-slate-450 flex flex-col items-center gap-2">
            <AlertCircle className="h-6 w-6 stroke-[1.5]" />
            <span className="text-xs">No announcements broadcasted yet.</span>
          </div>
        )}
      </div>

      {/* Publish Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-lg space-y-4"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-855 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Broadcast Notice</h3>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5 font-medium">Publish a notification to employee portals.</p>
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

              <form onSubmit={handleCreate} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Notice Title</label>
                    <input
                      type="text"
                      required
                      value={noticeForm.title}
                      onChange={(e) => setNoticeForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Mandatory System Update"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Target Role</label>
                    <select
                      value={noticeForm.targetRole}
                      onChange={(e) => setNoticeForm((prev) => ({ ...prev, targetRole: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="all">All Personnel</option>
                      <option value="employee">Employees Only</option>
                      <option value="hr">HR Specialists Only</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Notice Content</label>
                  <textarea
                    required
                    rows={5}
                    value={noticeForm.content}
                    onChange={(e) => setNoticeForm((prev) => ({ ...prev, content: e.target.value }))}
                    placeholder="Provide full description of policies or scheduled updates..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-855 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? "Publishing..." : "Publish Broadcast"}
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
