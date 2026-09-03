import type { ReactNode } from "react";
import { TrendingUp } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  bgColor?: string;
  textColor?: string;
  icon?: ReactNode;
  trend?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all duration-300 group">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-2 tracking-tight group-hover:text-indigo-600 transition-colors">
            {value}
          </p>
        </div>
        {icon && (
          <div className="w-11 h-11 rounded-xl bg-indigo-50/80 border border-indigo-100/80 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
            {icon}
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{trend}</span>
        </div>
      )}

      {/* Decorative gradient bar on top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

