"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useEffect } from "react";

export default function ApplicationSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobTitle = searchParams.get("jobTitle") || "this position";
  const companyName = searchParams.get("companyName") || "the company";
  const requiresAssessment = searchParams.get("requiresAssessment") === "true";
  const assessmentId = searchParams.get("assessmentId");

  useEffect(() => {
    // If there's an assessment required, show a different message
    if (requiresAssessment && assessmentId) {
      // Could redirect to assessment after a delay or show assessment info
    }
  }, [requiresAssessment, assessmentId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Application Submitted!
          </h1>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Your application for{" "}
            <span className="font-semibold">{jobTitle}</span> at{" "}
            <span className="font-semibold">{companyName}</span> has been
            successfully submitted.
          </p>

          {requiresAssessment && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
              <p className="text-sm font-medium">Assessment Required</p>
              <p className="text-sm">
                This job requires you to complete an assessment. You can access
                it from your applications page.
              </p>
            </div>
          )}

          <p className="text-sm text-gray-500">
            You will receive updates about your application status via email.
          </p>

          <div className="pt-4 space-y-3">
            <Button
              onClick={() => router.push("/student/jobs")}
              className="w-full"
              size="lg"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
