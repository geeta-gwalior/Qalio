"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, Toaster } from "sonner";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Step components
import BasicInfoForm from "@/components/profile/basic-info-form";
import EducationForm from "@/components/profile/education-form";
import SkillsForm from "@/components/profile/skills-form";
import PortfolioForm from "@/components/profile/portfolio-form";
import WorkExperienceForm from "@/components/profile/work-experience-form";
import DocumentsForm from "@/components/profile/documents-form";
import ProfileCompletionSummary from "@/components/profile/profile-completion-summary";
import { getCookie } from "@/utils/getCookie";
import type {
  BasicInfoFormData,
  Education,
  PortfolioItem,
  Skills,
  WorkExperience,
  Documents,
} from "@/types/student";

const steps = [
  { id: "basic-info", name: "Basic Info" },
  { id: "education", name: "Education" },
  { id: "skills", name: "Skills" },
  { id: "portfolio", name: "Portfolio" },
  { id: "work-experience", name: "Work Experience" },
  { id: "documents", name: "Documents" },
  { id: "complete", name: "Complete" },
];

interface ProfileData {
  basicInfo: BasicInfoFormData | null;
  education: Education[] | null;
  skills: Skills | null;
  portfolio: PortfolioItem[] | null;
  workExperience: WorkExperience | null;
  documents: Documents | null;
}

export default function ProfileCompletionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isEditMode = searchParams.get("edit") === "true";
  const initialStep = searchParams.get("step");

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [profileData, setProfileData] = useState<ProfileData>({
    basicInfo: null,
    education: null,
    skills: null,
    portfolio: null,
    workExperience: null,
    documents: null,
  });
  const [progress, setProgress] = useState(0);

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
    const completedSteps = Object.values(profileData).filter(Boolean).length;
    const totalSteps = Object.keys(profileData).length;
    setProgress((completedSteps / totalSteps) * 100);
  }, [profileData]);

  // Fetch existing profile data if available
  useEffect(() => {
    const fetchProfileData = async () => {
      setIsDataLoading(true);
      const token = getCookie("jwt");

      if (!token) {
        toast.error("Authentication token not found");
        router.push("/auth/sign-in");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/me`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }

        const data = await response.json();
        // console.log("Fetched profile data:", data);

        // Populate form data from existing profile
        if (data.student) {
          setProfileData({
            basicInfo: {
              dob: data.student.dob ? new Date(data.student.dob) : null,
              gender:
                (data.student.gender as "male" | "female" | "other") ||
                undefined,
              altContactNumber: data.student.altContactNumber || "",
              aadharNumber: data.student.aadharNumber || "",
              panCardNumber: data.student.panCardNumber || "",
              // digitalSignature: data.student.digitalSignature, // Keep commented if not used
            },
            education: data.student.education?.length
              ? data.student.education.map((edu: any) => ({
                  ...edu,
                  startDate: edu.startDate
                    ? new Date(edu.startDate)
                    : undefined,
                  endDate: edu.endDate ? new Date(edu.endDate) : undefined,
                }))
              : null,
            skills: data.student.skills ? data.student.skills : null,
            portfolio: data.student.portfolio?.length
              ? data.student.portfolio
              : null,
            workExperience: data.student.workExperience
              ? {
                  internships: data.student.workExperience.internships?.map(
                    (internship: any) => ({
                      ...internship,
                      startDate: internship.startDate
                        ? new Date(internship.startDate)
                        : undefined,
                      endDate: internship.endDate
                        ? new Date(internship.endDate)
                        : undefined,
                    })
                  ),
                  jobs: data.student.workExperience.jobs?.map((job: any) => ({
                    ...job,
                    startDate: job.startDate
                      ? new Date(job.startDate)
                      : undefined,
                    endDate: job.endDate ? new Date(job.endDate) : undefined,
                  })),
                }
              : null,
            documents: data.student.documents ? data.student.documents : null,
          });

          // If profile is already completed and not in edit mode, redirect to view profile
          if (data.student.completedProfile && !isEditMode) {
            toast.info("Your profile is already complete");
            router.push("/student/profile");
          }
        }
      } catch (error) {
        // console.error("Error fetching profile data:", error);
        toast.error("Failed to load profile data");
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchProfileData();
  }, [router, isEditMode]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      // Update URL with current step for better navigation
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", steps[currentStep + 1].id);
      if (isEditMode) params.set("edit", "true");
      router.push(`/student/profile/complete?${params.toString()}`);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Update URL with current step for better navigation
      const params = new URLSearchParams(searchParams.toString());
      params.set("step", steps[currentStep - 1].id);
      if (isEditMode) params.set("edit", "true");
      router.push(`/student/profile/complete?${params.toString()}`);
    }
  };

  const handleStepSubmit = async (stepId: string, data: any) => {
    setIsLoading(true);
    try {
      let endpoint = "";
      let payload = {};

      switch (stepId) {
        case "basic-info":
          endpoint = "/student/update-basic";
          payload = data;
          break;
        case "education":
          endpoint = "/student/update-education";
          payload = { education: data };
          break;
        case "skills":
          endpoint = "/student/update-skills";
          payload = { skills: data };
          break;
        case "portfolio":
          endpoint = "/student/update-portfolio";
          payload = { portfolio: data };
          break;
        case "work-experience":
          endpoint = "/student/update-work";
          payload = { workExperience: data };
          break;
        case "documents":
          endpoint = "/student/update-documents";
          payload = { documents: data };
          break;
        case "complete":
          endpoint = "/student/complete-profile";
          payload = {};
          break;
      }

      const token = getCookie("jwt");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      // console.log(`Submitting to ${endpoint}:`, payload);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}${endpoint}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save data");
      }

      // Update local state with the submitted data
      setProfileData({
        ...profileData,
        [stepId === "complete" ? "" : stepId]: data,
      });

      toast.success(`${steps[currentStep].name} saved successfully`);

      // If this was the final step, redirect to profile view
      if (stepId === "complete") {
        toast.success(
          isEditMode
            ? "Profile updated successfully!"
            : "Profile completed successfully!"
        );

        setTimeout(() => {
          router.push("/student/profile");
        }, 1500);
      } else {
        // Move to next step
        handleNext();
      }
    } catch (error: any) {
      // console.error("Error submitting data:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    if (isDataLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#219CAE]"></div>
        </div>
      );
    }

    switch (steps[currentStep].id) {
      case "basic-info":
        return (
          <BasicInfoForm
            initialData={profileData.basicInfo || ({} as BasicInfoFormData)}
            onSubmit={(data) => handleStepSubmit("basic-info", data)}
            isLoading={isLoading}
          />
        );
      case "education":
        return (
          <EducationForm
            initialData={
              profileData.education
                ? profileData.education.map((edu) => ({
                    ...edu,
                    startDate: edu.startDate
                      ? new Date(edu.startDate)
                      : undefined,
                    endDate: edu.endDate ? new Date(edu.endDate) : undefined,
                    isCurrentlyStudying: edu.isCurrentlyStudying ?? false,
                  }))
                : []
            }
            onSubmit={(data) => handleStepSubmit("education", data)}
            isLoading={isLoading}
          />
        );
      case "skills":
        return (
          <SkillsForm
            initialData={profileData.skills || undefined}
            onSubmit={(data) => handleStepSubmit("skills", data)}
            isLoading={isLoading}
          />
        );
      case "portfolio":
        return (
          <PortfolioForm
            initialData={profileData.portfolio || undefined}
            onSubmit={(data) => handleStepSubmit("portfolio", data)}
            isLoading={isLoading}
          />
        );
      case "work-experience":
        return (
          <WorkExperienceForm
            initialData={profileData.workExperience as any}
            onSubmit={(data) => handleStepSubmit("work-experience", data)}
            isLoading={isLoading}
          />
        );
      case "documents":
        return (
          <DocumentsForm
            initialData={profileData.documents as any}
            onSubmit={(data) => handleStepSubmit("documents", data)}
            isLoading={isLoading}
          />
        );
      case "complete":
        return (
          <ProfileCompletionSummary
            profileData={profileData}
            onSubmit={() => handleStepSubmit("complete", {})}
            isLoading={isLoading}
            isEditMode={isEditMode}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="">
      <Card className="border-none shadow-md p-0">
        <CardHeader className="bg-[#219CAE] text-white py-4 rounded-t-lg">
          <CardTitle className="text-2xl">
            {isEditMode ? "Edit Your Profile" : "Complete Your Profile"}
          </CardTitle>
          <CardDescription className="text-white/80">
            {isEditMode
              ? "Update your profile information to keep it current"
              : "Complete all steps to activate your student profile"}
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
                  className={`px-4 py-2 rounded-full text-sm !opacity-100  ${
                    currentStep === index
                      ? "!bg-[#219CAE] !text-white"
                      : index < currentStep
                      ? "bg-green-100 !text-green-800"
                      : "bg-gray-100 !text-gray-500"
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="w-4 h-4 mr-1" />
                  ) : (
                    <span
                      className={`w-5 h-5 inline-flex items-center justify-center rounded-full text-xs mr-1
                      ${
                        currentStep === index
                          ? "bg-white text-[#219CAE]"
                          : "bg-white text-black"
                      }`}
                    >
                      {index + 1}
                    </span>
                  )}
                  {step.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <CardContent className="p-6">
            <TabsContent value={steps[currentStep].id} className="mt-0 p-0">
              {renderStepContent()}
            </TabsContent>
          </CardContent>

          <CardFooter className="flex justify-between border-t p-6">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0 || isLoading}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} className="bg-[#219CAE]">
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : null}
          </CardFooter>
        </Tabs>
      </Card>
    </div>
  );
}
