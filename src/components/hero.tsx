"use client";

import React from "react";
import { Users, Clock, Briefcase, TrendingUp, Check } from "lucide-react";
import Link from "next/link";

export default function Hero() {
  const stats = [
    {
      label: "Employees",
      value: "1,247",
      icon: <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    },
    {
      label: "On Duty",
      value: "928",
      icon: <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    },
    {
      label: "Departments",
      value: "24",
      icon: <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    },
    {
      label: "Productivity",
      value: "+12.5%",
      icon: <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
    },
  ];

  return (
    <section
      id="home"
      className="relative pt-36 pb-24 flex flex-col items-center justify-center overflow-hidden bg-slate-50 dark:bg-background-brand"
    >
      {/* Background Decorative Grids */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000002_1px,transparent_1px),linear-gradient(to_bottom,#00000002_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[50rem] h-[30rem] rounded-full bg-blue-500/5 blur-[120px]"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
        {/* Pill Tagline */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/10 backdrop-blur-md mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400"></span>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
            Trusted by 1,000+ growing teams
          </span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 dark:text-white max-w-4xl leading-[1.1]">
          One platform to manage your entire workforce
        </h1>

        {/* Subheading */}
        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mt-6 leading-relaxed">
          Employees, attendance, HR, payroll, departments and reports — all in one clean and simple ERP system.
        </p>

        {/* CTA Buttons */}
        <div className="flex justify-center mt-10 w-full">
          <Link href="/login" className="w-full sm:w-auto text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-8 py-4 shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-1.5 group">
            Get Started
            <span className="transform group-hover:translate-x-0.5 transition-transform duration-200">→</span>
          </Link>
        </div>

        {/* Checklist */}
        <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 mt-8 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-500" />
            <span>Enterprise security</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-500" />
            <span>24/7 Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Check className="h-4 w-4 text-emerald-500" />
            <span>SOC 2 compliant</span>
          </div>
        </div>

        {/* Browser Mockup */}
        <div className="relative mt-16 w-full max-w-4xl bg-white dark:bg-[#111827] rounded-xl border border-slate-200 dark:border-white/10 shadow-lg shadow-slate-100 dark:shadow-none overflow-hidden">
          {/* Mockup Title bar */}
          <div className="h-11 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/2 flex items-center px-4 justify-between select-none">
            <div className="flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/15"></div>
              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/15"></div>
              <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-white/15"></div>
            </div>
            <div className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide">
              nexora.app/dashboard
            </div>
            <div className="w-12"></div>
          </div>

          {/* Inner Content Area */}
          <div className="p-6 bg-slate-50/50 dark:bg-[#030712]/30">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-xl p-5 text-left flex flex-col justify-between shadow-sm hover:border-slate-300 dark:hover:border-white/10 transition-colors duration-200"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                      {stat.icon}
                    </div>
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {stat.label}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
