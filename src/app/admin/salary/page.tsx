"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import {
  DollarSign,
  Users,
  ChevronDown,
  Save,
  History,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  Wallet,
  Shield,
  RefreshCw,
  IndianRupee,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PayslipModal } from "@/components/employee/payslip-modal";

interface SalaryFormState {
  monthlyCTC: string;
  basicSalary: string;
  hra: string;
  allowances: string;
  perksAndBenefits: string;
  bonus: string;
  deductions: string;
  pf: string;
  esi: string;
  tds: string;
  overtimeRatePerHour: string;
  effectiveDate: string;
  salaryStatus: string;
  paymentCycle: string;
  revisionReason: string;
}

const DEFAULT_FORM: SalaryFormState = {
  monthlyCTC: "",
  basicSalary: "",
  hra: "",
  allowances: "",
  perksAndBenefits: "",
  bonus: "",
  deductions: "",
  pf: "",
  esi: "",
  tds: "",
  overtimeRatePerHour: "",
  effectiveDate: new Date().toISOString().split("T")[0],
  salaryStatus: "Active",
  paymentCycle: "Monthly",
  revisionReason: "",
};

function fmt(val: number) {
  return val.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export default function SalaryManagementPage() {
  const summaries = useQuery(api.salary.getAllSalarySummaries);
  const setSalaryMutation = useMutation(api.salary.setSalaryStructure);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [form, setForm] = useState<SalaryFormState>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showRevisionHistory, setShowRevisionHistory] = useState(false);

  // Fetch salary for selected employee
  const salaryData = useQuery(
    api.salary.getSalaryByEmployee,
    selectedEmployeeId ? { employeeId: selectedEmployeeId } : "skip"
  );

  const selectedEmp = summaries?.find((s) => s.employeeId === selectedEmployeeId);
  const selectedUserId = selectedEmp?.userId;

  const selectedUserPayroll = useQuery(
    api.employee.getPayrollRecords,
    selectedUserId ? { userId: selectedUserId } : "skip"
  );

  const [selectedPayrollId, setSelectedPayrollId] = useState<string | null>(null);

  // Auto-populate form when existing salary is loaded
  useEffect(() => {
    if (salaryData) {
      const getStr = (val: unknown) => (val !== undefined && val !== null ? String(val) : "");
      setForm({
        monthlyCTC: getStr(salaryData.monthlyCTC),
        basicSalary: getStr(salaryData.basicSalary),
        hra: getStr(salaryData.hra),
        allowances: getStr(salaryData.allowances),
        perksAndBenefits: getStr(salaryData.perksAndBenefits),
        bonus: getStr(salaryData.bonus),
        deductions: getStr(salaryData.deductions),
        pf: getStr(salaryData.pf),
        esi: getStr(salaryData.esi),
        tds: getStr(salaryData.tds),
        overtimeRatePerHour: getStr(salaryData.overtimeRatePerHour),
        effectiveDate: getStr(salaryData.effectiveDate),
        salaryStatus: salaryData.salaryStatus,
        paymentCycle: salaryData.paymentCycle,
        revisionReason: "",
      });
    } else if (selectedEmployeeId) {
      setForm(DEFAULT_FORM);
    }
  }, [salaryData, selectedEmployeeId]);

  // Live preview calculations
  const num = (v: string) => parseFloat(v) || 0;
  const grossEarnings = num(form.basicSalary) + num(form.hra) + num(form.allowances) + num(form.perksAndBenefits) + num(form.bonus);
  const totalDeductions = num(form.pf) + num(form.esi) + num(form.tds) + num(form.deductions);
  const netTakeHome = grossEarnings - totalDeductions;

  const now = new Date();
  const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const perDaySalary = num(form.basicSalary) / daysInCurrentMonth;

  const handleEmployeeSelect = (empId: string) => {
    setSelectedEmployeeId(empId);
    setStatus(null);
    setShowRevisionHistory(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;
    setSaving(true);
    setStatus(null);
    try {
      const optNum = (v: string) => (v.trim() !== "" ? parseFloat(v) : undefined);
      const optStr = (v: string) => (v.trim() !== "" ? v : undefined);

      const res = await setSalaryMutation({
        employeeId: selectedEmployeeId,
        monthlyCTC: num(form.monthlyCTC),
        basicSalary: num(form.basicSalary),
        hra: optNum(form.hra),
        allowances: optNum(form.allowances),
        perksAndBenefits: optNum(form.perksAndBenefits),
        bonus: optNum(form.bonus),
        deductions: optNum(form.deductions),
        pf: optNum(form.pf),
        esi: optNum(form.esi),
        tds: optNum(form.tds),
        overtimeRatePerHour: optNum(form.overtimeRatePerHour),
        effectiveDate: optStr(form.effectiveDate),
        salaryStatus: form.salaryStatus,
        paymentCycle: form.paymentCycle,
        revisionReason: form.revisionReason || undefined,
      });
      setStatus({ type: "success", text: res.message });
    } catch (err: unknown) {
      setStatus({ type: "error", text: err instanceof Error ? err.message : String(err) });
    } finally {
      setSaving(false);
    }
  };

  const filteredSummaries = (summaries ?? []).filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.empCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedEmployee = (summaries ?? []).find((s) => s.employeeId === selectedEmployeeId);

  const fieldInput = (
    label: string,
    key: keyof SalaryFormState,
    required = false,
    helpText?: string
  ) => (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
        {label} {required && <span className="text-rose-500 font-bold">*</span>}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
        <input
          type="number"
          min="0"
          step="0.01"
          required={required}
          value={form[key]}
          onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
          placeholder="0.00"
          className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-colors"
        />
      </div>
      {helpText && <p className="text-[10px] text-slate-400">{helpText}</p>}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <IndianRupee className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Salary &amp; Payroll Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Admin-exclusive. Define CTC, breakdowns, statutory deductions, and revision history per employee.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-xl">
          <Shield className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            Admin Protected
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Employee Selector */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-500" />
              Select Employee
            </h3>
            <div className="mt-3">
              <input
                type="text"
                placeholder="Search name or ID…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 max-h-[480px]">
            {summaries === undefined ? (
              <div className="py-10 flex justify-center items-center">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
              </div>
            ) : filteredSummaries.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">No employees found.</div>
            ) : (
              filteredSummaries.map((emp) => (
                <button
                  key={emp.employeeId}
                  onClick={() => handleEmployeeSelect(emp.employeeId)}
                  className={`w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    selectedEmployeeId === emp.employeeId
                      ? "bg-indigo-50/60 dark:bg-indigo-950/20 border-l-2 border-indigo-500"
                      : ""
                  }`}
                >
                  <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs shrink-0">
                    {emp.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{emp.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{emp.empCode} • {emp.designation}</p>
                  </div>
                  <div className="ml-auto shrink-0">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                      emp.hasSalaryRecord
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                    }`}>
                      {emp.hasSalaryRecord ? "Set" : "Missing"}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Salary Form + Preview */}
        <div className="lg:col-span-2 space-y-5">
          {!selectedEmployeeId ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-12 flex flex-col items-center gap-3 text-slate-400">
              <Wallet className="h-10 w-10 text-slate-300 dark:text-slate-700 stroke-[1.5]" />
              <p className="text-sm font-medium">Select an employee to configure their salary structure</p>
            </div>
          ) : (
            <>
              {/* Live Preview Card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: "Gross Earnings", val: grossEarnings, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
                  { label: "Total Deductions", val: totalDeductions, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/30" },
                  { label: "Net Take-Home", val: netTakeHome, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
                  { label: "Per Day Salary", val: perDaySalary, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/30" },
                ].map((card) => (
                  <div key={card.label} className={`${card.bg} border border-opacity-50 rounded-2xl p-4 space-y-1`}>
                    <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">{card.label}</span>
                    <p className={`text-lg font-bold ${card.color}`}>₹{fmt(card.val)}</p>
                  </div>
                ))}
              </div>

              {/* Status Messages */}
              <AnimatePresence>
                {status && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-medium ${
                      status.type === "success"
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                        : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400"
                    }`}
                  >
                    {status.type === "success" ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                    <span>{status.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Form */}
              <form
                onSubmit={handleSave}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs p-6 space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Salary Structure — {selectedEmployee?.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {selectedEmployee?.empCode} • {selectedEmployee?.designation}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {salaryData?.revisionHistory && salaryData.revisionHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowRevisionHistory(!showRevisionHistory)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        <History className="h-3.5 w-3.5" />
                        History ({salaryData.revisionHistory.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Revision History */}
                <AnimatePresence>
                  {showRevisionHistory && salaryData?.revisionHistory && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider">
                              <th className="text-left px-4 py-2.5">Date</th>
                              <th className="text-left px-4 py-2.5">Revised By</th>
                              <th className="text-right px-4 py-2.5">Old CTC</th>
                              <th className="text-right px-4 py-2.5">New CTC</th>
                              <th className="text-left px-4 py-2.5">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {[...salaryData.revisionHistory].reverse().map((r, i) => (
                              <tr key={i} className="hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="px-4 py-2.5 font-mono text-slate-600 dark:text-slate-400">{r.date}</td>
                                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{r.revisedBy}</td>
                                <td className="px-4 py-2.5 text-right text-rose-600 dark:text-rose-400">₹{fmt(r.oldCTC)}</td>
                                <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400">₹{fmt(r.newCTC)}</td>
                                <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 max-w-[160px] truncate">{r.reason}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Earnings Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
                    Earnings &amp; Allowances
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {fieldInput("Monthly CTC (Total)", "monthlyCTC", true, "Total Cost to Company per month")}
                    {fieldInput("Basic Salary", "basicSalary", true, "PF is calculated on this component")}
                    {fieldInput("HRA (House Rent Allowance)", "hra")}
                    {fieldInput("Special Allowances", "allowances")}
                    {fieldInput("Perks & Benefits", "perksAndBenefits", false, "Meal, insurance, club, etc.")}
                    {fieldInput("Bonus / Incentive (Monthly Accrual)", "bonus")}
                  </div>
                </div>

                {/* Deductions Section */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <DollarSign className="h-3.5 w-3.5 text-rose-500" />
                    Statutory Deductions
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {fieldInput("PF — Provident Fund (Employee Share)", "pf", false, "Typically 12% of Basic")}
                    {fieldInput("ESI — Employee State Insurance", "esi", false, "Typically 0.75% of Gross")}
                    {fieldInput("TDS — Tax Deducted at Source (Monthly)", "tds")}
                    {fieldInput("Other Deductions", "deductions", false, "LWF, profession tax, loans, etc.")}
                  </div>
                </div>

                {/* Overtime & Meta */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Overtime &amp; Administration
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Overtime Rate / Hour
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">₹</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.overtimeRatePerHour}
                          onChange={(e) => setForm((p) => ({ ...p, overtimeRatePerHour: e.target.value }))}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <p className="text-[10px] text-slate-400">Hourly rate for overtime beyond 9h shift</p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Effective Date
                      </label>
                      <input
                        type="date"
                        value={form.effectiveDate}
                        onChange={(e) => setForm((p) => ({ ...p, effectiveDate: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Salary Status <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={form.salaryStatus}
                          onChange={(e) => setForm((p) => ({ ...p, salaryStatus: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                        >
                          <option value="Active">Active</option>
                          <option value="On Hold">On Hold</option>
                          <option value="Revised">Revised</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Payment Cycle <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={form.paymentCycle}
                          onChange={(e) => setForm((p) => ({ ...p, paymentCycle: e.target.value }))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
                        >
                          <option value="Monthly">Monthly</option>
                          <option value="Bi-weekly">Bi-weekly</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revision reason */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Revision Reason (optional, only recorded if CTC changes)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Annual appraisal Q2 2026"
                    value={form.revisionReason}
                    onChange={(e) => setForm((p) => ({ ...p, revisionReason: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-60 transition-all cursor-pointer"
                  >
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    <span>{salaryData ? "Update Salary Structure" : "Save Salary Structure"}</span>
                  </button>
                </div>
              </form>

              {/* Generated Payslips History */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4 mt-5">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4.5 w-4.5 text-indigo-500" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                    Generated Payslips History
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-150 dark:border-slate-800 font-bold">
                        <th className="px-4 py-2.5 rounded-l-lg">Billing Month</th>
                        <th className="px-4 py-2.5">Gross Pay</th>
                        <th className="px-4 py-2.5">Net Disbursed</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5 rounded-r-lg text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                      {selectedUserPayroll === undefined ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                            <Loader2 className="h-4 w-4 animate-spin inline mr-1 text-indigo-500" />
                            Loading payslip records…
                          </td>
                        </tr>
                      ) : !selectedUserPayroll || selectedUserPayroll.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                            No payroll slips recorded for this employee.
                          </td>
                        </tr>
                      ) : (
                        selectedUserPayroll.map((p) => {
                          const grossPay = p.baseSalary + p.allowances;
                          return (
                            <tr key={p._id} className="hover:bg-slate-50 dark:hover:bg-slate-850/30 transition-colors">
                              <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">{p.month}</td>
                              <td className="px-4 py-3 font-mono">₹{grossPay.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                              <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                                ₹{p.netSalary.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40">
                                  {p.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedPayrollId(p._id)}
                                  className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                                >
                                  View Slip
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {selectedPayrollId && (
        <PayslipModal
          payrollId={selectedPayrollId}
          onClose={() => setSelectedPayrollId(null)}
        />
      )}
    </motion.div>
  );
}
