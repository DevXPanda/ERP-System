"use client";

import React from "react";
import {
  Users,
  Clock,
  Briefcase,
  BarChart3,
  MapPin,
  ShieldCheck,
  Bell,
  Layers,
} from "lucide-react";

export default function Features() {
  const featuresList = [
    {
      title: "Employee Management",
      description: "Centralised employee records, roles and lifecycle.",
      icon: <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: "GPS Attendance",
      description: "Location-aware check-in with real-time tracking.",
      icon: <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: "HR Operations",
      description: "Leave, onboarding, documents and approvals.",
      icon: <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: "Reports & Analytics",
      description: "Live dashboards and exportable reports.",
      icon: <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: "Office Locations",
      description: "Manage multiple branches and geofences.",
      icon: <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: "Role-based Access",
      description: "Granular permissions and audit logs.",
      icon: <ShieldCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: "Smart Notifications",
      description: "Stay informed across email, push and in-app.",
      icon: <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
    {
      title: "Departments",
      description: "Org structure with managers and hierarchies.",
      icon: <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />,
    },
  ];

  return (
    <section id="features" className="relative py-24 bg-white dark:bg-[#030712] overflow-hidden border-t border-slate-200 dark:border-white/5">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Left-Aligned Header */}
        <div className="max-w-3xl mb-16 text-left">
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
            Everything your team needs
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg mt-3">
            A complete set of modules built to work together — no juggling tools.
          </p>
        </div>

        {/* 8-Grid Features */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuresList.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-left hover:border-slate-300 dark:hover:border-white/10 hover:shadow-sm transition-all duration-200 group flex flex-col justify-between"
            >
              <div>
                {/* Icon box (Outline style) */}
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-6">
                  {feature.icon}
                </div>
                {/* Title */}
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-wide">
                  {feature.title}
                </h3>
                {/* Description */}
                <p className="text-slate-500 dark:text-slate-400 text-xs.5 mt-2.5 leading-relaxed font-medium">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
