"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, FileText, Clock, X, Edit, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressBar } from "@/components/progress-bar";
import { useAssessmentForm } from "@/hooks/use-assessment-form";
import { getCookie } from "@/utils/getCookie";
import { useSelectedDataStore } from "@/stores/use-topic-store";
import { toast } from "sonner";
import formatDate from "@/utils/dateFormatter";

// Define the steps for the progress bar
const formSteps = [
  { id: 1, name: "Name Assessment" },
  { id: 2, name: "Select Tests" },
  { id: 3, name: "Review & Submit" },
];

export default function ReviewSummary() {
  const router = useRouter();
  const { formData, submitFormData, isLoading, updateFormData } =
    useAssessmentForm();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    router.push(
      "/company/assessments/create-assessment/review-submit/questions"
    );
  };

  const rawToken = getCookie("jwt");
  const token = rawToken ?? undefined;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    updateFormData({ topics: formData.topics });
    try {
      const result = await submitFormData(token);

      router.replace(
        "/company/assessments/create-assessment/assessment-created/"
      );
    } catch (error) {
      toast("An unexpected error occurred. Please try again.");
      console.error("Error submitting assessment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w mx-auto px-1 py-5.5">
      {/* Back button and title */}
      <div className="flex items-center gap-4 mb-4">
        <Button
          onClick={handleBack}
          variant="outline"
          size="icon"
          className="rounded-md shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-800">
          Create Assessment
        </h1>
      </div>

      {/* Progress bar component */}
      <ProgressBar currentStep={3} steps={formSteps} />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-700">
            Review Assessment
          </h2>
        </div>

        {/* Assessment details */}
        <Card className="bg-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Assessment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{formData.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Level</p>
                <p className="font-medium">{formData.level.toUpperCase()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Total Duration</p>
                <p className="font-medium">{formData.totalDuration} Minutes</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Availability</p>
                <p className="font-medium">
                  {formatDate(formData.startDate)} to{" "}
                  {formatDate(formData.endDate)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Negative Marking</p>
                <p className="font-medium">
                  {formData.isNegativeMarking ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section summary */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Assessment Sections</h3>

          {formData.topics &&
            formData.topics.map((section: any) => (
              <Card
                key={`${section._id}-${section.questionType}`}
                className="border border-gray-200 hover:shadow-md transition-shadow"
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4 border-b">
                    <div className="flex items-center">
                      <div className="mr-3">
                        <FileText className="h-5 w-5 text-[#219CAE]" />
                      </div>
                      <div>
                        <h4 className="font-medium">
                          {section.heading || section.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {section.description || section.subtitle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {/* Questions Count Badge */}
                      <div className="flex items-center">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <FileText className="h-3 w-3 mr-1" />
                          {section.questions?.length || 0} Questions
                        </div>
                      </div>

                      <div className="flex items-center text-gray-500">
                        <FileText className="h-4 w-4 mr-1" />
                        <span className="text-sm">
                          {section.questionType || section.type}
                        </span>
                      </div>
                      {/* <div className="flex items-center text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="text-sm">{section.duration}</span>
                      </div> */}
                    </div>
                  </div>
                  {/* <div className="flex items-center justify-between p-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Details
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div> */}
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button
            className="bg-[#219CAE] hover:bg-[#1a7d8b] text-white"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Submit
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
