"use client";

import React, { useState } from "react";
import { Menu, X, Sun, Moon } from "lucide-react";
import Link from "next/link";

interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

const BizwokeLogo = () => (
  <div className="flex items-center gap-2">
    <img src="/Bizwoke.jpg" alt="Bizwoke Logo" className="h-8 object-contain rounded-lg" />
  </div>
);

export default function Navbar({ isDark, onToggleTheme }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "Solutions", href: "#solutions" },
    { name: "About", href: "#about" },
    { name: "Contact", href: "#contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#030712]/80 backdrop-blur-xl transition-all duration-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left Brand Logo */}
        <div className="flex items-center">
          <a href="#home" className="flex items-center select-none">
            <BizwokeLogo />
          </a>
        </div>

        {/* Center Navigation Links (Desktop) */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors duration-200"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Right CTA / Auth / Theme Buttons (Desktop) */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors duration-200 px-4 py-2">
            Login
          </Link>
          <Link href="/login" className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-5 py-2.5 transition-colors duration-200 shadow-sm shadow-blue-500/10">
            Get Started
          </Link>
        </div>

        {/* Mobile menu & Theme toggle button */}
        <div className="flex items-center space-x-2 md:hidden">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-full border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-slate-600 dark:text-slate-300 p-2"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#030712] backdrop-blur-xl">
          <div className="px-6 py-6 space-y-4 flex flex-col">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="text-base font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-200"
              >
                {link.name}
              </a>
            ))}
            <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col space-y-3">
              <Link href="/login" className="w-full text-center text-base font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors duration-200 py-2">
                Login
              </Link>
              <Link href="/login" className="w-full text-center text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 transition-colors duration-200">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
