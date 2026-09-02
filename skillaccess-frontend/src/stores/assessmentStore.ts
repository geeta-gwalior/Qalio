import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AssessmentState {
  currentAssessmentId: string | null;
  usedAttempts: number;
  allowedAttempts: number;
  setAssessmentInfo: (id: string, used: number, allowed: number) => void;
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set) => ({
      currentAssessmentId: null,
      usedAttempts: 0,
      allowedAttempts: 0,
      setAssessmentInfo: (id, used, allowed) =>
        set({
          currentAssessmentId: id,
          usedAttempts: used,
          allowedAttempts: allowed,
        }),
    }),
    {
      name: "assessment-attempt-store", // key in localStorage
    }
  )
);
