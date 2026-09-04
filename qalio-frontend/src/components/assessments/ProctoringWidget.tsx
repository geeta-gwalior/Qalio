import React, { useEffect, useState } from "react";
import { AlertTriangle, ShieldCheck, ShieldAlert, Copy, ClipboardPaste, EyeOff } from "lucide-react";

interface ProctoringWidgetProps {
  trustScore: number;
  tabSwitches: number;
  warnings: string[];
}

export const ProctoringWidget: React.FC<ProctoringWidgetProps> = ({
  trustScore,
  tabSwitches,
  warnings,
}) => {
  const [isSecure, setIsSecure] = useState(true);

  useEffect(() => {
    setIsSecure(trustScore > 75);
  }, [trustScore]);

  return (
    <div className={`p-4 border rounded-xl shadow-sm ${isSecure ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} transition-colors duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isSecure ? (
            <ShieldCheck className="w-5 h-5 text-green-600" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-red-600" />
          )}
          <h3 className={`font-semibold ${isSecure ? 'text-green-800' : 'text-red-800'}`}>
            Proctoring Active
          </h3>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-bold ${isSecure ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
          Trust Score: {trustScore}%
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div className="bg-white p-2 rounded border border-gray-100 flex flex-col items-center justify-center">
          <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Tab Switches</span>
          <span className={`font-bold text-lg ${tabSwitches > 0 ? 'text-orange-600' : 'text-gray-700'}`}>
            {tabSwitches}
          </span>
        </div>
        <div className="bg-white p-2 rounded border border-gray-100 flex flex-col items-center justify-center">
           <span className="text-gray-500 text-xs uppercase tracking-wider mb-1">Status</span>
           <span className={`font-bold ${isSecure ? 'text-green-600' : 'text-red-600'}`}>
             {isSecure ? 'Secure' : 'Warning'}
           </span>
        </div>
      </div>

      {warnings.length > 0 && (
        <div className="mt-3 space-y-1">
          {warnings.slice(-3).map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-red-600 bg-red-100 p-2 rounded">
               <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
               <span>{w}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
