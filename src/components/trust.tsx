"use client";

import React from "react";
import { NKTechLogo, BizwokeNovaLogo } from "./logos";
import { Users, Server, Shield, Cpu } from "lucide-react";

export default function Trust() {
  const stats = [
    {
      label: "Employees Managed",
      value: "1,000+",
      icon: <Users className="h-6 w-6 text-blue-500" />,
    },
    {
      label: "System Uptime",
      value: "99.9%",
      icon: <Server className="h-6 w-6 text-purple-500" />,
    },
    {
      label: "Real-Time Tracking",
      value: "GPS Active",
      icon: <Cpu className="h-6 w-6 text-cyan-500" />,
    },
    {
      label: "Enterprise Security",
      value: "AES-256",
      icon: <Shield className="h-6 w-6 text-emerald-500" />,
    },
  ];

  return (
    <section className="relative py-24 bg-slate-50 dark:bg-background-brand border-t border-slate-200 dark:border-white/5 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Title */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-wider text-primary-brand uppercase">
            Social Proof & Scalability
          </p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-2">
            Trusted by Modern Businesses
          </h2>
        </div>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-20">
          {/* NKTech Card */}
          <div className="glass-card rounded-xl p-8 flex flex-col items-center justify-center border border-slate-200 dark:border-white/10 text-center hover:-translate-y-1 transition-all duration-300">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-4">
              Technology Partner
            </div>
            <NKTechLogo className="h-10 w-auto opacity-90 hover:opacity-100 transition-opacity invert dark:invert-0" />
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-4 leading-relaxed max-w-xs">
              Providing cutting-edge cloud architecture and infrastructure systems.
            </p>
          </div>

          {/* Bizwoke Nova Card */}
          <div className="glass-card rounded-xl p-8 flex flex-col items-center justify-center border border-slate-200 dark:border-white/10 text-center hover:-translate-y-1 transition-all duration-300">
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-4">
              Development Partner
            </div>
            <BizwokeNovaLogo className="h-10 w-auto opacity-90 hover:opacity-100 transition-opacity invert dark:invert-0" />
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-4 leading-relaxed max-w-xs">
              Specialists in intelligent automation and workforce analytics.
            </p>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="glass-panel rounded-xl p-6 border border-slate-200 dark:border-white/5 flex flex-col items-center text-center hover:scale-102 transition-all duration-300"
            >
              <div className="p-3.5 rounded-lg bg-slate-100 dark:bg-white/5 mb-4">
                {stat.icon}
              </div>
              <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {stat.value}
              </h3>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
