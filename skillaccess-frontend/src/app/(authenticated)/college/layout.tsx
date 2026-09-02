"use client";

import { useAssessmentLeaveGuard } from "@/hooks/useAssessmentLeaveGuard";
import LeaveAssessmentDialog from "@/components/assessments/LeaveAssessmentDialog";

export default function AssessmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useAssessmentLeaveGuard();

  return (
    <>
      {children}
      <LeaveAssessmentDialog /> {/* Render the modal */}
    </>
  );
}
