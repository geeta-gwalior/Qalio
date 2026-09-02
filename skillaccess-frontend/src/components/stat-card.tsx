import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  bgColor: string;
  textColor: string;
  icon?: ReactNode;
}

export default function StatCard({
  title,
  value,
  bgColor,
  textColor,
  icon,
}: StatCardProps) {
  return (
    <div className={`${bgColor} rounded-lg p-4`}>
      <div className="flex justify-between items-start">
        <h3 className="text-gray-600 font-semibold text-base">{title}</h3>
        {/* <button className="w-6 h-6 rounded-full flex items-center justify-center bg-white/30">
          <ChevronRight className="w-4 h-4 text-gray-700" />
        </button> */}
      </div>
      <p className={`text-3xl font-bold mt-2 ${textColor}`}>{value}</p>
      {icon && <div className="absolute right-4 bottom-4">{icon}</div>}
    </div>
  );
}
