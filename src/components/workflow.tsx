"use client";

import React from "react";

export default function Workflow() {
  const steps = [
    {
      step: "Step 1",
      title: "Admin",
      description: "Set up company, departments and policies.",
    },
    {
      step: "Step 2",
      title: "HR",
      description: "Onboard employees, manage leave and payroll.",
    },
    {
      step: "Step 3",
      title: "Employee",
      description: "Check in, request leave and view payslips.",
    },
  ];

  const stats = [
    { value: "1,000+", label: "Employees Managed" },
    { value: "99.9%", label: "Uptime SLA" },
    { value: "24/7", label: "Real-Time Sync" },
    { value: "256-bit", label: "Encryption" },
  ];

  return (
    <section
      id="solutions"
      className="relative py-24 bg-slate-50 dark:bg-background-brand border-t border-slate-200 dark:border-white/5 overflow-hidden text-center"
    >
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Built for every role
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg mt-3">
            One consistent flow across admin, HR and employees.
          </p>
        </div>

        {/* 3 Step Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20">
          {steps.map((item, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-2xl p-8 text-left shadow-sm hover:border-slate-300 dark:hover:border-white/10 transition-colors duration-200 flex flex-col justify-between min-h-[160px]"
            >
              <div>
                <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-3">
                  {item.step}
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 4 Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-8 border-t border-slate-200/60 dark:border-white/5">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <span className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stat.value}
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 tracking-wide uppercase">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
