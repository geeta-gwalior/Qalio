import React from "react";

interface QalioLogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "glass" | "light";
}

export default function QalioLogo({
  className = "",
  showText = true,
  size = "md",
  variant = "default",
}: QalioLogoProps) {
  const iconSizes = {
    sm: "w-7 h-7 text-sm rounded-lg",
    md: "w-9 h-9 text-lg rounded-xl",
    lg: "w-12 h-12 text-2xl rounded-2xl",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const containerPadding = {
    default: "",
    glass: "px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/60",
    light: "px-4 py-2 bg-white rounded-xl shadow-xs border border-gray-100",
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${containerPadding[variant]} ${className}`}>
      {/* Icon Badge */}
      <div
        className={`${iconSizes[size]} bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-black shadow-md transition-transform hover:scale-105 ring-2 ring-indigo-100`}
      >
        <span className="font-sans tracking-tighter">Q</span>
      </div>

      {/* Brand Text */}
      {showText && (
        <span className={`${textSizes[size]} font-black tracking-tight text-slate-900 font-sans`}>
          Qalio
        </span>
      )}
    </div>
  );
}
