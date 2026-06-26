"use client";

import React from "react";
import {
  Shield,
  Zap,
  CloudLightning,
  Activity,
  Gauge,
  Sparkles,
  Key,
  Navigation,
} from "lucide-react";

export default function WhyChooseUs() {
  const cards = [
    {
      title: "Enterprise Security",
      description: "AES-256 data encryption at rest and secure mTLS in transit.",
      icon: <Shield className="h-5 w-5 text-emerald-500" />,
    },
    {
      title: "Real-Time Database",
      description: "Data synchronized instantly across all workspaces and roles.",
      icon: <Zap className="h-5 w-5 text-yellow-500" />,
    },
    {
      title: "Cloud Ready",
      description: "Deploy in minutes on hybrid, private, or public cloud infrastructures.",
      icon: <CloudLightning className="h-5 w-5 text-blue-500" />,
    },
    {
      title: "Scalable Architecture",
      description: "Built to effortlessly manage from 100 to 10,000+ active employees.",
      icon: <Activity className="h-5 w-5 text-cyan-500" />,
    },
    {
      title: "Fast Performance",
      description: "Powered by Next.js 15, Vercel edge CDN, and sub-100ms response times.",
      icon: <Gauge className="h-5 w-5 text-rose-500" />,
    },
    {
      title: "Modern UI",
      description: "A gorgeous dark mode visual experience engineered for visual clarity.",
      icon: <Sparkles className="h-5 w-5 text-purple-500" />,
    },
    {
      title: "Role-Based Access",
      description: "Strict RBAC segregation between Employees, HR Managers, and Admins.",
      icon: <Key className="h-5 w-5 text-indigo-500" />,
    },
    {
      title: "GPS-Based Attendance",
      description: "Secure check-in checks with custom geographical office boundary radius.",
      icon: <Navigation className="h-5 w-5 text-teal-500" />,
    },
  ];

  return (
    <section className="relative py-24 bg-slate-50 dark:bg-background-brand border-t border-slate-200 dark:border-white/5 overflow-hidden">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <p className="text-xs font-semibold tracking-wider text-primary-brand uppercase">
            Product Excellence
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mt-2">
            Why Choose Our ERP System?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-4">
            Engineered as modern web infrastructure, our solution guarantees reliability, visual excellence, and top-tier performance.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="glass-card rounded-2xl p-6 border border-slate-200 dark:border-white/8 flex flex-col items-start space-y-4 hover:-translate-y-1 hover:shadow-md transition-all duration-300"
            >
              {/* Icon wrap */}
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                {card.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-2">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
