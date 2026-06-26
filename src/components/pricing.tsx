"use client";

import React from "react";
import { Check } from "lucide-react";

export default function Pricing() {
  const tiers = [
    {
      name: "Starter",
      price: "$0",
      description: "For small teams getting started.",
      features: ["Up to 10 employees", "Attendance & HR", "Email support"],
      buttonText: "Get started",
      popular: false,
    },
    {
      name: "Growth",
      price: "$8",
      description: "Per user / month, billed annually.",
      features: ["Unlimited employees", "Payroll & reports", "Priority support"],
      buttonText: "Get started",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Advanced security and SLAs.",
      features: ["SSO & audit logs", "Custom integrations", "Dedicated CSM"],
      buttonText: "Contact sales",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="relative py-24 bg-slate-50 dark:bg-background-brand border-t border-slate-200 dark:border-white/5 overflow-hidden text-center">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Simple pricing
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg mt-3">
            Start free. Upgrade when you&apos;re ready.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {tiers.map((tier, idx) => (
            <div
              key={idx}
              className={`bg-white dark:bg-[#111827] border rounded-2xl p-8 text-left shadow-sm flex flex-col justify-between min-h-[420px] transition-all duration-200 ${
                tier.popular
                  ? "border-blue-600 dark:border-blue-500 ring-1 ring-blue-600 dark:ring-blue-500 scale-100"
                  : "border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
              }`}
            >
              <div>
                {/* Tier Name */}
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">
                  {tier.name}
                </h3>
                
                {/* Price */}
                <div className="flex items-baseline mb-2">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {tier.price}
                  </span>
                </div>

                {/* Description / Billing */}
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-6 min-h-[32px]">
                  {tier.description}
                </p>

                {/* Features List */}
                <ul className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/5">
                  {tier.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="mt-8">
                {tier.popular ? (
                  <button className="w-full text-center text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-3 transition-colors duration-200 shadow-sm shadow-blue-500/10">
                    {tier.buttonText}
                  </button>
                ) : (
                  <button className="w-full text-center text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-white rounded-lg py-3 transition-colors duration-200">
                    {tier.buttonText}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
