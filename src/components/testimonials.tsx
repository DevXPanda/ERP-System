"use client";

import React from "react";

export default function Testimonials() {
  const reviews = [
    {
      quote: "Bizwoke replaced three different tools we used to manage our team. Setup took an afternoon.",
      author: "Priya S.",
      role: "HR Lead",
      company: "Orbital Labs",
    },
    {
      quote: "Attendance and payroll finally talk to each other. Our month-end is hours, not days.",
      author: "Daniel K.",
      role: "Operations",
      company: "Stratos AI",
    },
    {
      quote: "Clean interface and great support. Our managers actually enjoy using it.",
      author: "Anita R.",
      role: "Director",
      company: "Helix Group",
    },
  ];

  return (
    <section id="about" className="relative py-24 bg-white dark:bg-[#030712] overflow-hidden border-t border-slate-200 dark:border-white/5">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Loved by teams that ship
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {reviews.map((review, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-left shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-white/10 transition-colors duration-200 min-h-[140px]"
            >
              <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">
                “{review.quote}”
              </p>
              <div className="text-xs mt-6 text-slate-500 dark:text-slate-400">
                <span className="font-bold text-slate-900 dark:text-white">{review.author}</span>
                <span className="mx-1.5 text-slate-300 dark:text-white/10">·</span>
                <span>{review.role}, {review.company}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
