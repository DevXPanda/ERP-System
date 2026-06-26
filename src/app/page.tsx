"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import Features from "@/components/features";
import Workflow from "@/components/workflow";
import Testimonials from "@/components/testimonials";
import FAQ from "@/components/faq";
import CTA from "@/components/cta";
import Footer from "@/components/footer";

export default function Home() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className={isDark ? "dark" : ""}>
      <div className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-[#030712] dark:text-slate-100 overflow-x-hidden antialiased transition-colors duration-200">
        {/* Navigation */}
        <Navbar isDark={isDark} onToggleTheme={toggleTheme} />

        {/* Page Content wrapper */}
        <main className="relative z-10">
          {/* Hero Section */}
          <Hero />

          {/* Features Section */}
          <Features />

          {/* Built for every role Section */}
          <Workflow />

          {/* Testimonials Section */}
          <Testimonials />

          {/* FAQ Accordion Section */}
          <FAQ />

          {/* CTA Banner Section */}
          <CTA />
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
