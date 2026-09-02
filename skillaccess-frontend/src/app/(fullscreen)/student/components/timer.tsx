"use client";

import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerProps {
  timeRemaining: number;
  warningThreshold?: number;
}

export function Timer({ timeRemaining, warningThreshold = 300 }: TimerProps) {
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const isWarning = timeRemaining <= warningThreshold;
  const isCritical = timeRemaining <= 60; // Add critical state

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1 rounded-lg font-mono font-medium",
        isCritical && "bg-red-100 text-red-800 animate-pulse", // Add pulse for critical
        isWarning && !isCritical && "bg-yellow-100 text-yellow-800",
        !isWarning && "bg-blue-100 text-blue-800"
      )}
    >
      <Clock className="h-4 w-4" />
      <span>{formatTime(timeRemaining)}</span>
    </div>
  );
}
