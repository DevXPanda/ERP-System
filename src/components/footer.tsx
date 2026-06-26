"use client";

import React from "react";
import { NKTechLogo, BizwokeNovaLogo } from "./logos";
import { Mail } from "lucide-react";

const NexoraLogo = () => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg tracking-wider select-none shadow-sm shadow-blue-500/20">
      N
    </div>
    <span className="font-bold text-slate-900 dark:text-white text-lg tracking-tight">
      Nexora ERP
    </span>
  </div>
);

const LinkedinIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
  </svg>
);

const GithubIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
  </svg>
);

const TwitterIcon = () => (
  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function Footer() {
  const quickLinks = [
    { name: "Support", href: "#contact" },
    { name: "Privacy Policy", href: "#privacy" },
    { name: "Terms of Service", href: "#terms" },
  ];

  const socialLinks = [
    { icon: <LinkedinIcon />, href: "https://linkedin.com", name: "LinkedIn" },
    { icon: <GithubIcon />, href: "https://github.com", name: "GitHub" },
    { icon: <TwitterIcon />, href: "https://twitter.com", name: "Twitter" },
    { icon: <Mail className="h-4 w-4" />, href: "mailto:support@nexora.io", name: "Email" },
  ];

  return (
    <footer className="relative bg-white dark:bg-[#030712] border-t border-slate-200 dark:border-white/5 pt-20 pb-12 overflow-hidden text-left">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-16 border-b border-slate-200 dark:border-white/5">
          {/* Logo and Brand description */}
          <div className="space-y-4">
            <NexoraLogo />
            <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-sm">
              The unified workforce, payroll, and security infrastructure platform designed for fast-growing global enterprises.
            </p>
          </div>

          {/* Quick links */}
          <div className="flex flex-col space-y-4 md:items-center">
            <div className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
              Quick Resources
            </div>
            <div className="flex flex-col space-y-2 md:items-center">
              {quickLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors duration-200"
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>

          {/* Technology partner logo display */}
          <div className="space-y-6 flex flex-col md:items-end">
            <div className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider md:text-right">
              Technology Alliance
            </div>
            <div className="flex items-center gap-6 pt-1">
              <div className="flex flex-col items-center">
                <NKTechLogo className="h-7 w-auto opacity-70 hover:opacity-100 transition-opacity invert dark:invert-0" />
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-white/10"></div>
              <div className="flex flex-col items-center">
                <BizwokeNovaLogo className="h-7 w-auto opacity-70 hover:opacity-100 transition-opacity invert dark:invert-0" />
              </div>
            </div>
            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 md:text-right leading-relaxed max-w-xs">
              Collaboratively developed by NKTech Cloud Systems & Bizwoke Nova Analytics.
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center sm:text-left">
            © {new Date().getFullYear()} Nexora ERP. Powered by NKTech & Bizwoke Nova. All rights reserved.
          </div>

          {/* Social Icons */}
          <div className="flex items-center space-x-4">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-200"
                aria-label={social.name}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
