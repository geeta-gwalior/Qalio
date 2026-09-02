"use client";

import { useEffect, useState, useRef } from "react";
import { TimerIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionTimerProps {
  timeRemaining: number;
  warningThreshold?: number;
  onTimeEnd: () => void;
}

export function QuestionTimer({
  timeRemaining: initialTime,
  warningThreshold = 10,
  onTimeEnd,
}: QuestionTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onTimeEndRef = useRef(onTimeEnd);

  // Update the callback ref when it changes
  useEffect(() => {
    onTimeEndRef.current = onTimeEnd;
  }, [onTimeEnd]);

  // Main timer effect - FIXED VERSION
  useEffect(() => {
    console.log(
      "🔄 QuestionTimer: Timer effect triggered with initialTime:",
      initialTime
    );

    // Clear any existing interval first
    if (intervalRef.current) {
      console.log("🧹 QuestionTimer: Clearing existing interval");
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't start timer if time is 0 or negative
    if (initialTime <= 0) {
      console.log("⚠️ QuestionTimer: No time limit set, skipping timer");
      setTimeRemaining(0);
      return;
    }

    // Set initial time immediately
    console.log("📝 QuestionTimer: Setting initial time to", initialTime);
    setTimeRemaining(initialTime);

    // Start the countdown
    console.log("⏰ QuestionTimer: Starting countdown interval");
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        console.log("⏱️ QuestionTimer: Tick -", prev, "->", newTime);

        if (newTime <= 0) {
          console.log("🔥 QuestionTimer: Time expired! Calling onTimeEnd");
          // Clear interval immediately
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          // Call the callback
          onTimeEndRef.current();
          return 0;
        }

        return newTime;
      });
    }, 1000);

    // Cleanup function
    return () => {
      console.log("🧹 QuestionTimer: Effect cleanup - clearing interval");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [initialTime]); // This will trigger whenever initialTime changes

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const isWarning = timeRemaining <= warningThreshold;
  const isCritical = timeRemaining <= 5;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1 rounded text-xs font-mono transition-colors",
        isCritical && "bg-red-100 text-red-800 animate-pulse",
        isWarning && !isCritical && "bg-yellow-100 text-yellow-800",
        !isWarning && "bg-gray-100 text-gray-800"
      )}
    >
      <TimerIcon className="h-3 w-3" />
      <span>Q: {formatTime(timeRemaining)}</span>
    </div>
  );
}
