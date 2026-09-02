"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import CollegeProfileForm from "@/components/college/college-profile-form";
import { collegeAPI } from "@/utils/api";
import type { CollegeProfile } from "@/types/college";
const steps = [
  { id: "basic-info", name: "Basic Info" },
  { id: "location", name: "Location" },
  { id: "academic-info", name: "Academic Info" },
  { id: "courses", name: "Courses" },
  { id: "placement", name: "Placement" },
  { id: "banking", name: "Banking" },
  { id: "about", name: "About" },
  { id: "documents", name: "Documents" },
  { id: "completion", name: "Review & Complete" },
];
interface ProfileData {
  basicInfo: any | null;
  location: any | null;
  academicInfo: any | null;
  courses: any | null;
  placement: any | null;
  // infrastructure: any | null
  banking: any | null;
  about: any | null;
  documents: any | null;
}
export default function CollegeProfileCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "true";
  const initialStep = searchParams.get("step");
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [profileData, setProfileData] = useState<CollegeProfile | null>(null);
  const [progress, setProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  // Set initial step based on URL parameter
  useEffect(() => {
    if (initialStep) {
      const stepIndex = steps.findIndex((step) => step.id === initialStep);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
      }
    }
  }, [initialStep]);
  // Calculate progress
  useEffect(() => {
    setProgress((completedSteps.length / steps.length) * 100);
  }, [completedSteps]);
  // Fetch existing profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsDataLoading(true);
      try {
        const response = await collegeAPI.getCollegeProfile();
        if (response.success && response.college) {
          setProfileData(response.college);
          // Calculate completed steps based on existing data
          const completed: number[] = [];
          if (response.college.collegeName) completed.push(0); // basic-info
          if (response.college.country) completed.push(1); // location
          if (response.college.university) completed.push(2); // academic-info
          if (response.college.coursesOffered?.length) completed.push(3); // courses
          if (
            response.college.placementStatistics ||
            response.college.placementOfficer
          )
            completed.push(4); // placement
          // if (response.college.infrastructure) completed.push(5) // infrastructure
          if (response.college.bankingDetails) completed.push(5); // banking
          if (response.college.description) completed.push(6); // about

          // Documents step (index 7) - still added if present for visual checkmark
          const hasAccreditationUrl =
            response.college.accreditations &&
            response.college.accreditations.some(
              (acc: any) => acc.accreditationCertificate?.url
            );
          if (
            response.college.gstCertificate?.url ||
            response.college.affiliationCertificate?.url ||
            hasAccreditationUrl
          ) {
            completed.push(7); // documents
          }

          // Check if all REQUIRED steps (0-6) are complete
          const allRequiredStepsCompleted =
            completed.includes(0) &&
            completed.includes(1) &&
            completed.includes(2) &&
            completed.includes(3) &&
            completed.includes(4) &&
            completed.includes(5) &&
            completed.includes(6);

          // If all required steps are complete, consider the 'completion' step (index 8) as visually complete for the progress bar
          if (allRequiredStepsCompleted && !completed.includes(8)) {
            completed.push(8);
          }

          // Also, if the profile is *actually* completed (backend flag), ensure step 8 is included
          if (response.college.completedProfile && !completed.includes(8)) {
            completed.push(8);
          }

          setCompletedSteps(completed);
          // If profile is already completed and not in edit mode, redirect to view profile
          if (response.college.completedProfile && !isEditMode) {
            toast.info("Your profile is already complete");
            router.push("/college/profile");
          }
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsDataLoading(false);
      }
    };
    fetchProfileData();
  }, [router, isEditMode]);
  const handleStepComplete = (stepIndex: number) => {
    // Ensure the step is added to completedSteps if it's not already there
    setCompletedSteps((prevCompletedSteps) => {
      if (!prevCompletedSteps.includes(stepIndex)) {
        return [...prevCompletedSteps, stepIndex];
      }
      return prevCompletedSteps;
    });

    // Auto-advance to next step if not on completion step
    if (stepIndex < steps.length - 1) {
      // Automatically move to next step
      setTimeout(() => {
        const nextStepIndex = stepIndex + 1;
        setCurrentStep(nextStepIndex);
        const params = new URLSearchParams(searchParams.toString());
        params.set("step", steps[nextStepIndex].id);
        if (isEditMode) params.set("edit", "true");
        router.push(`/college/profile/complete?${params.toString()}`);
      }, 1000); // Small delay to show success message
    }
  };
  const handleProfileUpdate = async (updatedData?: Partial<CollegeProfile>) => {
    if (updatedData && profileData) {
      setProfileData({ ...profileData, ...updatedData });
    }
    toast.success("Profile updated successfully");
    // If this was the final step, redirect to profile view
    if (currentStep === steps.length - 1) {
      // Mark as completed and redirect immediately
      setTimeout(() => {
        window.location.href = "/college/profile";
      }, 1000); // Reduced timeout
    }
  };
  const handleLocalProfileUpdate = (updatedData: Partial<CollegeProfile>) => {
    if (profileData) {
      setProfileData({ ...profileData, ...updatedData });
    }
  };
  // Add this useEffect to handle step transitions smoothly
  useEffect(() => {
    // Update URL when step changes
    if (currentStep >= 0 && currentStep < steps.length) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", steps[currentStep].id);
      if (isEditMode) params.set("edit", "true");
      // Use replace instead of push to avoid history buildup
      const newUrl = `/college/profile/complete?${params.toString()}`;
      if (window.location.pathname + window.location.search !== newUrl) {
        window.history.replaceState({}, "", newUrl);
      }
    }
  }, [currentStep, isEditMode, searchParams]);
  if (isDataLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#219CAE]"></div>
      </div>
    );
  }
  return (
    <div className="py-4">
      <Card className="border-none shadow-md p-0">
        <CardHeader className="bg-[#219CAE] text-white py-4 rounded-t-lg">
          <CardTitle className="text-2xl">
            {isEditMode
              ? "Edit Your College Profile"
              : "Complete Your College Profile"}
          </CardTitle>
          <CardDescription className="text-white/80">
            {isEditMode
              ? "Update your profile information to keep it current"
              : "Complete all steps to activate your college profile"}
          </CardDescription>
          <Progress
            value={progress}
            className="h-2 mt-4 bg-white/20 [&>div]:bg-white"
          />
        </CardHeader>
        <Tabs value={steps[currentStep].id} className="w-full">
          <div className="px-6 pt-6 overflow-x-auto">
            <TabsList className="w-full justify-start bg-transparent p-0 h-auto flex space-x-2">
              {steps.map((step, index) => (
                <TabsTrigger
                  key={step.id}
                  value={step.id}
                  disabled={true}
                  className={`px-4 py-2 rounded-full text-sm !opacity-100 relative ${
                    currentStep === index
                      ? "!bg-[#219CAE] !text-white"
                      : completedSteps.includes(index)
                      ? "bg-green-100 !text-green-800"
                      : "bg-gray-100 !text-gray-500"
                  }`}
                >
                  {completedSteps.includes(index) ? (
                    <Check className="w-4 h-4 mr-1" />
                  ) : (
                    <span
                      className={`w-5 h-5 inline-flex items-center justify-center rounded-full text-xs mr-1 ${
                        currentStep === index
                          ? "bg-white text-[#219CAE]"
                          : "bg-white text-black"
                      }`}
                    >
                      {index + 1}
                    </span>
                  )}
                  {step.name}
                  {/* Add dotted blue line after each tab except the last one */}
                  {index < steps.length - 1 && (
                    <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-2 h-0.5 border-t-2 border-dotted border-[#219CAE]"></div>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <CardContent className="p-0">
            <TabsContent value={steps[currentStep].id} className="mt-0 p-0">
              <CollegeProfileForm
                defaultValues={profileData}
                onUpdate={handleProfileUpdate}
                onCancel={() => router.push("/college/profile")}
                isLoading={isLoading}
                isEditMode={isEditMode}
                collegeAPI={collegeAPI}
                onProfileUpdate={handleLocalProfileUpdate}
                currentStep={currentStep}
                onStepComplete={handleStepComplete}
                completedSteps={completedSteps}
              />
            </TabsContent>
          </CardContent>
          {/* Removed CardFooter with duplicate buttons */}
        </Tabs>
      </Card>
    </div>
  );
}
