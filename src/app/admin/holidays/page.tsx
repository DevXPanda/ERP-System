"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import {
  CalendarDays,
  Plus,
  AlertCircle,
  X,
  CheckCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


export default function HolidaysPage() {
  const holidays = useQuery(api.hr.getHolidays);
  const addHoliday = useMutation(api.hr.addHoliday);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [holidayForm, setHolidayForm] = useState({ name: "", date: "", type: "National" });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAddHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayForm.name || !holidayForm.date) return;
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await addHoliday({
        name: holidayForm.name.trim(),
        date: holidayForm.date,
        type: holidayForm.type,
      });
      setSuccessMsg(res.message);
      setHolidayForm({ name: "", date: "", type: "National" });
      setIsAddModalOpen(false);
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const sortedHolidays = (holidays || []).sort((a, b) => a.date.localeCompare(b.date));

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
          <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Holiday Schedule</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Configure corporate holidays and calendars.</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 text-white rounded-xl text-xs font-medium shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Holiday</span>
        </button>
      </div>

      {/* Alerts */}
      {successMsg && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3.5 rounded-xl animate-fade-in">
          <CheckCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Holidays Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="overflow-x-auto border border-slate-100 dark:border-slate-850 rounded-xl">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-850">
                <th className="p-4">Holiday Name</th>
                <th className="p-4">Scheduled Date</th>
                <th className="p-4">Holiday Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {holidays === undefined ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-slate-450 dark:text-slate-550">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading calendar...</span>
                    </div>
                  </td>
                </tr>
              ) : sortedHolidays.length > 0 ? (
                sortedHolidays.map((h) => (
                  <tr key={h._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3.5">
                        <div className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-550 dark:text-rose-455 flex items-center justify-center shrink-0">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{h.name}</span>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-slate-650 dark:text-slate-350">
                      {new Date(h.date).toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                        h.type === "National"
                          ? "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400"
                          : h.type === "Regional"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400"
                            : "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400"
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {h.type}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
                    <AlertCircle className="h-6 w-6 stroke-[1.5]" />
                    <span className="text-xs">No holidays defined in the schedule calendar.</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Holiday Modal */}
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
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Add Upcoming Holiday</h3>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5 font-medium">Insert a calendar holiday for all personnel.</p>
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

              <form onSubmit={handleAddHoliday} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Holiday Name</label>
                  <input
                    type="text"
                    required
                    value={holidayForm.name}
                    onChange={(e) => setHolidayForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Labor Day"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Scheduled Date</label>
                    <input
                      type="date"
                      required
                      value={holidayForm.date}
                      onChange={(e) => setHolidayForm((prev) => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Holiday Type</label>
                    <select
                      value={holidayForm.type}
                      onChange={(e) => setHolidayForm((prev) => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="National">National Holiday</option>
                      <option value="Regional">Regional Holiday</option>
                      <option value="Corporate">Corporate Holiday</option>
                    </select>
                  </div>
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
                    {loading ? "Adding..." : "Add Holiday"}
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
