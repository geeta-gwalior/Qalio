import Image from "next/image";
import QalioLogo from "@/components/common/QalioLogo";
import { ReactNode } from "react";
import { Sparkles, ShieldCheck, Zap } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen w-full bg-slate-50/50 font-sans text-slate-900">
      {/* Left Side - Hero Brand Panel */}
      <div className="w-1/2 hidden lg:flex flex-col justify-between m-4 p-12 relative bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl overflow-hidden shadow-xl border border-indigo-800/30">
        {/* Top Logo */}
        <div className="relative z-10">
          <QalioLogo size="lg" variant="glass" />
        </div>

        {/* Ambient Decorative Light Orbs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Middle Hero Showcase */}
        <div className="relative z-10 max-w-md my-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-cyan-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Next-Gen Skill Assessment Platform</span>
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight leading-tight">
            Empowering Talent & Career Acceleration
          </h2>

          <p className="text-slate-300 text-sm leading-relaxed font-normal">
            Streamlined hiring assessments, automated student grading, and data-driven skill insights all in one unified platform.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-200 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-xs">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Role-Based Access</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs font-medium text-slate-200 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-xs">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Real-Time Analytics</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Qalio Inc. All rights reserved.
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16">
        <div className="w-full max-w-md bg-white sm:p-8 rounded-3xl sm:border border-slate-200/70 sm:shadow-md transition-all">
          {children}
        </div>
      </div>
    </main>
  );
}

