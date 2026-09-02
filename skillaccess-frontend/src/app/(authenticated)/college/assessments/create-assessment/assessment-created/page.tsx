"use client";

import { useEffect } from "react"; // Import useEffect
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { useAssessmentForm } from "@/hooks/use-assessment-form";
import { useSelectedDataStore } from "@/stores/use-topic-store";

export default function AssessmentCreated() {
  const router = useRouter();
  const user: any = useAuthStore((state) => state.user);
  const { clearFormData } = useAssessmentForm(); // Only destructure what you need if not using others directly

  // Use useEffect to run the cleanup logic only once when the component mounts
  useEffect(() => {
    clearFormData();
    localStorage.removeItem("selected-assessment-data");
    localStorage.removeItem("currentTopicDetails");
    localStorage.removeItem("currentTopic");
    localStorage.removeItem("topicQuestions");
    useSelectedDataStore.getState().reset();
  }, [clearFormData]);

  useEffect(() => {
    // This pushes a new state to the history, effectively making the back button
    // come back to this page.
    history.pushState(null, "", location.href);

    // This event listener handles browser back button attempts
    const handlePopState = (event: PopStateEvent) => {
      // If the user tries to go back, push the current state again
      history.pushState(null, "", location.href);
    };

    window.addEventListener("popstate", handlePopState);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []); // Run this effect only once on mount

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full  shadow-lg rounded-2xl">
        <CardContent className="p-8 text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="h-20 w-20 text-green-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-3">
            Assessment Created!
          </h1>
          <p className="text-gray-600 mb-8">
            Your assessment has been successfully created and is now available
            for students.
          </p>
          <div className="grid gap-4">
            <Button
              className="w-full bg-[#219CAE] hover:bg-[#1a7d8b] text-white text-md py-2.5"
              onClick={() => router.push("/college/assessments")}
            >
              Go to Assessments
            </Button>
            <Button
              variant="outline"
              className="w-full text-md py-2.5"
              onClick={() =>
                router.push("/college/assessments/create-assessment/")
              }
            >
              Create Another Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
