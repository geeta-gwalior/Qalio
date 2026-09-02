"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useLeaveModal } from "@/stores/use-leave-modal";
import { useAssessmentForm } from "@/hooks/use-assessment-form";
import { useSelectedDataStore } from "@/stores/use-topic-store";

export default function LeaveAssessmentDialog() {
  const { isOpen, nextPath, closeModal } = useLeaveModal();
  const { clearFormData } = useAssessmentForm();

  const SESSION_QUESTIONS_KEY = "currentSessionQuestions";

  const handleConfirmLeave = () => {
    // Clear local/session storage
    clearFormData();
    localStorage.removeItem("selected-assessment-data");
    localStorage.removeItem("currentTopicDetails");
    localStorage.removeItem("currentTopic");
    localStorage.removeItem("topicQuestions");
    localStorage.removeItem("topicTypeUpdated");
    useSelectedDataStore.getState().reset();
    sessionStorage.removeItem(SESSION_QUESTIONS_KEY);

    // Prevent back button navigation
    if (nextPath) {
      history.pushState(null, "", "/college/assessments/create-assessment");
      history.pushState(null, "", "/college/assessments/create-assessment");
      window.addEventListener("popstate", () => {
        history.pushState(null, "", "/college/assessments/create-assessment");
      });

      window.location.assign(nextPath);
    }

    closeModal();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={closeModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Are you sure you want to leave this assessment?
          </AlertDialogTitle>
          <AlertDialogDescription>
            All unsaved changes will be lost. You&apos;ll need to create a new
            assessment again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay</AlertDialogCancel>
          <AlertDialogAction
            className="bg-[#219CAE] hover:bg-[#1B8291]"
            onClick={handleConfirmLeave}
          >
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
