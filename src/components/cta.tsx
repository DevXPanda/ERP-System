"use client";

import React from "react";
import Link from "next/link";

export default function CTA() {
  return (
    <section className="relative py-24 bg-white dark:bg-[#030712] overflow-hidden border-t border-slate-200 dark:border-white/5">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* White CTA Card Container */}
        <div className="relative rounded-2xl p-8 sm:p-14 overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#111827] shadow-sm text-center">
          <div className="relative z-10 flex flex-col items-center max-w-3xl mx-auto">
            {/* Headline */}
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              Ready to simplify your workforce?
            </h2>

            {/* Description */}
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-3 leading-relaxed max-w-2xl font-medium">
              Join thousands of teams using Nexora ERP to run their operations.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 w-full sm:w-auto">
              <Link href="/login" className="w-full sm:w-auto text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 transition-colors duration-200 shadow-sm shadow-blue-500/10 flex items-center justify-center gap-1.5 group">
                Get Started
                <span className="transform group-hover:translate-x-0.5 transition-transform duration-200">→</span>
              </Link>
              <Link href="/login" className="w-full sm:w-auto text-sm font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-lg px-6 py-3 transition-all duration-200 text-center">
                Talk to Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
