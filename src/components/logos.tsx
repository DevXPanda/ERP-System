import React from "react";

export function ERPLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 200 40" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="8" fill="url(#grad)" />
      <path d="M10 16L16 10L22 16L16 22L10 16Z" fill="white" />
      <text x="44" y="24" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="18" fill="white">
        ERP Management
      </text>
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "#2563EB" }} />
          <stop offset="100%" style={{ stopColor: "#7C3AED" }} />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function NKTechLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 160 40" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="25" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="20" fill="white">
        NK<tspan fill="#2563EB">TECH</tspan>
      </text>
    </svg>
  );
}

export function BizwokeNovaLogo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 160 40" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="25" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="20" fill="white">
        Bizwoke <tspan fill="#7C3AED">Nova</tspan>
      </text>
    </svg>
  );
}
