"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // Default open the first item like screenshot

  const faqs = [
    {
      q: "Can I import existing employee data?",
      a: "Yes, you can easily import your employee records using CSV templates, or connect directly to existing HR tools.",
    },
    {
      q: "Is my data secure?",
      a: "Yes, we implement bank-grade security protocols. All data is encrypted at rest using AES-256 and in transit using TLS 1.3, maintaining SOC 2 compliance.",
    },
    {
      q: "Do you support multiple offices?",
      a: "Yes, Bizwoke ERP allows you to configure multiple office locations, geofences, and customized local holiday calendars.",
    },
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="contact" className="relative py-24 bg-white dark:bg-[#030712] border-t border-slate-200 dark:border-white/5 overflow-hidden">
      <div className="relative z-10 max-w-2xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Frequently asked questions
          </h2>
        </div>

        {/* Stacked Accordion List Container */}
        <div className="border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] rounded-xl overflow-hidden shadow-sm text-left">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`transition-colors duration-200 ${
                  idx > 0 ? "border-t border-slate-200 dark:border-white/10" : ""
                }`}
              >
                {/* Trigger */}
                <button
                  onClick={() => handleToggle(idx)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-white/2 transition-colors duration-150"
                >
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 tracking-tight">
                    {faq.q}
                  </span>
                  <span
                    className={`text-slate-400 dark:text-slate-500 ml-4 flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>

                {/* Content */}
                {isOpen && (
                  <div className="px-5 pb-5 text-xs.5 font-medium text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
