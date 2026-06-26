"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  UserCheck,
  Plus,
  Search,
  Mail,
  Phone,
  ArrowRight,
  ArrowLeft,
  X,
  Star,
  Award,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Candidate {
  id: string;
  name: string;
  role: string;
  email: string;
  stage: string; // "Applied" | "Screening" | "Interview" | "Offered" | "Rejected"
  score: number;
  phone: string;
}

const STAGES = ["Applied", "Screening", "Interview", "Offered", "Rejected"];

export default function RecruitmentPage() {
  const initialPipeline = useQuery(api.hr.getRecruitmentPipeline);
  const updateStage = useMutation(api.hr.updateCandidateStage);
  const createCandidate = useMutation(api.hr.createCandidate);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCandidate, setNewCandidate] = useState({
    name: "",
    role: "",
    email: "",
    phone: "",
    score: 80,
  });

  const handleMoveStage = async (candidateId: string, currentStage: string, direction: "forward" | "backward") => {
    const currentIndex = STAGES.indexOf(currentStage);
    const nextIndex =
      direction === "forward"
        ? Math.min(STAGES.length - 1, currentIndex + 1)
        : Math.max(0, currentIndex - 1);
    const nextStage = STAGES[nextIndex];

    try {
      await updateStage({ id: candidateId as Id<"candidates">, stage: nextStage });
      if (selectedCandidate && selectedCandidate.id === candidateId) {
        setSelectedCandidate((prev) => prev ? { ...prev, stage: nextStage } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCandidate.name || !newCandidate.role) return;

    try {
      await createCandidate({
        name: newCandidate.name,
        role: newCandidate.role,
        email: newCandidate.email || "no-email@company.com",
        phone: newCandidate.phone || "N/A",
        stage: "Applied",
        score: Number(newCandidate.score),
      });
      setIsAddModalOpen(false);
      setNewCandidate({ name: "", role: "", email: "", phone: "", score: 80 });
    } catch (err) {
      console.error(err);
    }
  };

  const candidatesList = initialPipeline || [];

  const filteredPipeline = candidatesList.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 h-full flex flex-col"
    >
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-slate-800 dark:text-slate-100">Recruitment Funnel</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Visualize talent pipelines and track candidate screening stages.</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 text-white rounded-xl text-xs font-medium shadow-xs hover:shadow-md transition-all duration-150 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Filters */}
      <div className="relative max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 p-2.5 shadow-xs">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 stroke-[1.8]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter candidates by name or target role..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all duration-200"
        />
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto pb-4 flex gap-4 items-start select-none">
        {STAGES.map((stage) => {
          const stageCandidates = filteredPipeline.filter((c) => c.stage === stage);
          return (
            <div
              key={stage}
              className="w-72 bg-slate-100 dark:bg-slate-900/60 border border-slate-200/55 dark:border-slate-850 rounded-2xl p-4 shrink-0 flex flex-col max-h-[600px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-200/50 dark:border-slate-850">
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  {stage}
                </span>
                <span className="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold px-2 py-0.5 rounded-full">
                  {stageCandidates.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="flex-1 overflow-y-auto mt-4 space-y-3 pr-1">
                {stageCandidates.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800/80 rounded-xl p-3.5 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors flex flex-col gap-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <div className="cursor-pointer" onClick={() => setSelectedCandidate(c)}>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs hover:text-indigo-650 transition-colors">
                          {c.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-0.5 font-medium">
                          {c.role}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md text-[9px] font-semibold">
                        <Star className="h-2.5 w-2.5 fill-current" />
                        <span>{c.score}</span>
                      </div>
                    </div>

                    {/* Quick Move Action */}
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 dark:border-slate-850/60">
                      <button
                        onClick={() => handleMoveStage(c.id, c.stage, "backward")}
                        disabled={stage === STAGES[0]}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[9px] text-slate-450 dark:text-slate-550 font-medium">Move Stage</span>
                      <button
                        onClick={() => handleMoveStage(c.id, c.stage, "forward")}
                        disabled={stage === STAGES[STAGES.length - 1]}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {stageCandidates.length === 0 && (
                  <div className="py-8 text-center text-slate-350 dark:text-slate-550 text-[11px]">
                    No candidates here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Candidate Details Modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-lg space-y-4"
            >
              <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-850 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{selectedCandidate.name}</h3>
                  <p className="text-xs text-slate-450 dark:text-slate-500 mt-0.5">{selectedCandidate.role}</p>
                </div>
                <button
                  onClick={() => setSelectedCandidate(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2.5 items-center text-xs text-slate-600 dark:text-slate-350">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span>{selectedCandidate.email}</span>
                </div>
                <div className="flex gap-2.5 items-center text-xs text-slate-600 dark:text-slate-350">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <span>{selectedCandidate.phone}</span>
                </div>
                <div className="flex gap-2.5 items-center text-xs text-slate-600 dark:text-slate-350">
                  <Award className="h-4 w-4 text-slate-400" />
                  <span>Evaluated Score: <b>{selectedCandidate.score}/100</b></span>
                </div>
                <div className="flex gap-2.5 items-center text-xs text-slate-600 dark:text-slate-350">
                  <UserCheck className="h-4 w-4 text-slate-400" />
                  <span>Current Funnel: <b>{selectedCandidate.stage}</b></span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Candidate Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 shadow-lg space-y-4"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Add New Candidate</h3>
                <p className="text-xs text-slate-450 dark:text-slate-500">Insert details to start application pipeline.</p>
              </div>
              <form onSubmit={handleAddCandidate} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Candidate Name</label>
                  <input
                    type="text"
                    required
                    value={newCandidate.name}
                    onChange={(e) => setNewCandidate((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Alice Smith"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Applying For Role</label>
                  <input
                    type="text"
                    required
                    value={newCandidate.role}
                    onChange={(e) => setNewCandidate((prev) => ({ ...prev, role: e.target.value }))}
                    placeholder="e.g. Backend Developer"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email</label>
                    <input
                      type="email"
                      value={newCandidate.email}
                      onChange={(e) => setNewCandidate((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder="alice@gmail.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Phone</label>
                    <input
                      type="text"
                      value={newCandidate.phone}
                      onChange={(e) => setNewCandidate((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1 555-9000"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 text-xs focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pre-screen Score (out of 100)</label>
                  <input
                    type="number"
                    max={100}
                    min={0}
                    value={newCandidate.score}
                    onChange={(e) => setNewCandidate((prev) => ({ ...prev, score: Number(e.target.value) }))}
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
                    className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                  >
                    Add Candidate
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
