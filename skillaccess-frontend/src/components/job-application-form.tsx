"use client";

import type React from "react";
import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  GraduationCap,
  AlertCircle,
  Upload,
  FileText,
  CheckCircle,
  User,
  Mail,
  Phone,
  School,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "@/utils/getCookie";
import type { IJob } from "@/types/job";
import { useAuthStore } from "@/stores/auth-store";

interface StudentProfile {
  _id: string;
  userId: string;
  personal: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  education: Array<{
    institutionName: string;
    degree: string;
    fieldOfStudy: string;
    yearOfPassing: number;
    percentage?: number;
    cgpa?: number;
  }>;
  documents?: {
    resume?: string;
  };
  resumeUrl?: string;
}

interface JobApplicationFormProps {
  job: IJob;
  studentProfile: StudentProfile | null;
  onSuccess: (applicationDetails: any) => void;
  onCancel: () => void;
}

// Create dynamic schema based on job's custom questions
const createApplicationSchema = (customQuestions: any[] = []) => {
  const baseSchema = {
    coverLetter: z.string().optional(),
    personalStatement: z
      .string()
      .min(50, "Personal statement must be at least 50 characters")
      .max(1000, "Personal statement must be less than 1000 characters"),
    whyInterested: z
      .string()
      .min(30, "Please explain why you're interested (minimum 30 characters)"),
    relevantExperience: z.string().optional(),
    expectedSalary: z.preprocess(
      (val) => {
        // If it's an empty string, treat as undefined (to support optional)
        if (typeof val === "string" && val.trim() === "") return undefined;
        // Try converting to number
        return typeof val === "string" ? Number(val) : val;
      },
      z
        .number({
          invalid_type_error: "Salary must be a number",
        })
        .positive("Salary must be a positive number")
        .optional()
    ),
    availableStartDate: z.string().refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date >= new Date();
      },
      {
        message: "Start date must be today or a future date",
      }
    ),

    relocateWillingness: z.enum(["yes", "no", "maybe"], {
      required_error: "Please select your relocation preference",
    }),
  };

  const customFields: Record<string, any> = {};
  customQuestions.forEach((question, index) => {
    const fieldName = `custom_${index}`;
    if (question.required) {
      customFields[fieldName] = z
        .string()
        .min(1, `${question.question} is required`);
    } else {
      customFields[fieldName] = z.string().optional();
    }
  });

  return z.object({ ...baseSchema, ...customFields });
};

export default function JobApplicationForm({
  job,
  studentProfile,
  onSuccess,
  onCancel,
}: JobApplicationFormProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedResume, setUploadedResume] = useState<{
    file: File;
    url: string;
    fileName: string;
  } | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const customQuestions = job.applicationSettings?.customQuestions || [];
  const applicationSchema = createApplicationSchema(customQuestions);

  const form = useForm<any>({
    resolver: zodResolver(applicationSchema),
    mode: "onChange", // Enable real-time validation
    defaultValues: {
      coverLetter: "",
      personalStatement: "",
      whyInterested: "",
      relevantExperience: "",
      expectedSalary: "",
      availableStartDate: "",
      relocateWillingness: "yes",
      ...customQuestions.reduce((acc, _, index) => {
        acc[`custom_${index}`] = "";
        return acc;
      }, {} as Record<string, string>),
    },
  });

  const steps = [
    {
      id: 1,
      name: "Review Job",
      icon: "📋",
      description: "Job details & requirements",
    },
    {
      id: 2,
      name: "Personal Info",
      icon: "👤",
      description: "Your background & motivation",
    },
    {
      id: 3,
      name: "Application Details",
      icon: "📝",
      description: "Specific questions & documents",
    },
    { id: 4, name: "Review & Submit", icon: "🚀", description: "Final review" },
  ];

  const progressPercentage = (currentStep / steps.length) * 100;

  // Check batch eligibility
  const studentGraduationYear = studentProfile?.education?.[0]?.yearOfPassing;
  const isEligibleByBatch = () => {
    if (!studentGraduationYear) return true;
    const jobWithBatches = job as IJob & { eligibleBatches?: number[] };
    if (
      jobWithBatches.eligibleBatches &&
      jobWithBatches.eligibleBatches.length > 0
    ) {
      return jobWithBatches.eligibleBatches.includes(studentGraduationYear);
    }
    if (
      job.eligibility?.graduationYears &&
      job.eligibility.graduationYears.length > 0
    ) {
      return job.eligibility.graduationYears.includes(studentGraduationYear);
    }
    return true;
  };

  const batchEligible = isEligibleByBatch();

  const getCompanyName = () => {
    if (typeof job?.companyId === "object" && job?.companyId !== null) {
      const company = job.companyId as { name?: string };
      return company.name !== undefined ? company.name : "the company";
    }
    return "the company";
  };

  const getCompanyLogo = () => {
    if (
      typeof job.companyId === "object" &&
      job.companyId !== null &&
      "basic" in job.companyId
    ) {
      const company = job.companyId as { basic: { logo?: string } };
      return company.basic?.logo || null;
    }
    return null;
  };

  // Step validation functions
  const validateStep1 = () => {
    if (!batchEligible) {
      toast.error(
        "You are not eligible for this job based on your graduation year"
      );
      return false;
    }
    return true;
  };

  const validateStep2 = async () => {
    const step2Fields = [
      "personalStatement",
      "whyInterested",
      "availableStartDate",
      "relocateWillingness",
    ];

    // Trigger validation for step 2 fields
    const isValid = await form.trigger(step2Fields);

    if (!isValid) {
      const errors = form.formState.errors;
      const errorMessages = [];

      if (errors.personalStatement) {
        errorMessages.push(
          "Personal statement is required and must be at least 50 characters"
        );
      }
      if (errors.whyInterested) {
        errorMessages.push(
          "Please explain why you're interested (minimum 30 characters)"
        );
      }
      if (errors.availableStartDate) {
        errorMessages.push("Available start date is required");
      }
      if (errors.relocateWillingness) {
        errorMessages.push("Please select your relocation preference");
      }

      toast.error(
        `Please fix the following errors:\n• ${errorMessages.join("\n• ")}`
      );
      return false;
    }

    return true;
  };

  const validateStep3 = async () => {
    // Check if resume is available
    const hasResume =
      uploadedResume?.url ||
      studentProfile?.documents?.resume ||
      studentProfile?.resumeUrl;

    if (!hasResume) {
      toast.error("Please upload a resume before proceeding");
      return false;
    }

    // Validate custom questions
    const customFieldNames = customQuestions.map(
      (_, index) => `custom_${index}`
    );
    const requiredCustomFields = customQuestions
      .map((question, index) => (question.required ? `custom_${index}` : null))
      .filter(Boolean);

    if (requiredCustomFields.length > 0) {
      const errorMessages: string[] = [];

      const validCustomFields = requiredCustomFields.filter(
        (field): field is string => field !== null
      );
      const isValid = await form.trigger(validCustomFields);

      if (!isValid) {
        const errors = form.formState.errors;

        validCustomFields.forEach((fieldName) => {
          if (fieldName && errors[fieldName]) {
            const questionIndex = Number.parseInt(fieldName.split("_")[1]);
            errorMessages.push(
              `${customQuestions[questionIndex].question} is required`
            );
          }
        });

        if (errorMessages.length > 0) {
          toast.error(
            `Please answer the following required questions:\n• ${errorMessages.join(
              "\n• "
            )}`
          );
          return false;
        }
      }
    }

    return true;
  };

  // Updated resume upload function
  const handleResumeUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a PDF or Word document");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setResumeUploading(true);
    try {
      const token = getCookie("jwt");
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("studentId", user?._id || "");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/upload-resume`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload resume");
      }

      const result = await response.json();
      setUploadedResume({
        file: file,
        url: result.resumeUrl,
        fileName: result.fileName,
      });
      toast.success("Resume uploaded successfully!");
    } catch (error: any) {
      console.error("Resume upload error:", error);
      toast.error(error.message || "Failed to upload resume");
    } finally {
      setResumeUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleResumeUpload(file);
    }
  };

  const handleSubmit = async (data: any) => {
    if (!batchEligible) {
      toast.error(
        "You are not eligible for this job based on your graduation year"
      );
      return;
    }

    if (!user?._id) {
      toast.error("User not authenticated");
      return;
    }

    // Check if resume is available
    const hasResume =
      uploadedResume?.url ||
      studentProfile?.documents?.resume ||
      studentProfile?.resumeUrl;

    if (!hasResume) {
      toast.error("Please upload a resume before submitting");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getCookie("jwt");
      // Prepare application data
      const applicationData: Record<string, any> = {
        personalStatement: data.personalStatement,
        whyInterested: data.whyInterested,
        relevantExperience: data.relevantExperience,
        expectedSalary: data.expectedSalary,
        availableStartDate: data.availableStartDate,
        relocateWillingness: data.relocateWillingness,
      };

      customQuestions.forEach((question, index) => {
        const fieldName = `custom_${index}`;
        if (data[fieldName]) {
          applicationData[question.question] = data[fieldName];
        }
      });

      // Use the uploaded resume URL or fallback to profile resume
      const resumeUrl =
        uploadedResume?.url ||
        studentProfile?.documents?.resume ||
        studentProfile?.resumeUrl;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/apply-with-validation`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            studentId: user._id,
            jobId: job._id,
            applicationData,
            resumeUrl: resumeUrl,
            coverLetter: data.coverLetter,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit application");
      }

      const result = await response.json();

      // Handle assessment redirect if required
      if (result.requiresAssessment) {
        toast.success("Hurray! Applied successfully.");
        router.push("/student/jobs/");
        return;
      }

      // Redirect to success page with job details
      const companyName = getCompanyName();
      const successUrl = `/student/jobs/application-success?jobTitle=${encodeURIComponent(
        job.jobTitle as string
      )}&companyName=${encodeURIComponent(companyName)}`;
      router.push("/student/jobs/");
    } catch (error: any) {
      console.error("Application submission error:", error);
      toast.error(error.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced nextStep function with validation
  const nextStep = async () => {
    if (currentStep >= steps.length) return;

    let canProceed = false;

    switch (currentStep) {
      case 1:
        canProceed = validateStep1();
        break;
      case 2:
        canProceed = await validateStep2();
        break;
      case 3:
        canProceed = await validateStep3();
        break;
      default:
        canProceed = true;
    }

    if (canProceed) {
      setCurrentStep(currentStep + 1);
      toast.success(`Step ${currentStep} completed successfully!`);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const formatDate = (date?: Date | string) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const getEligibleBatches = () => {
    const jobWithBatches = job as IJob & { eligibleBatches?: number[] };
    return (
      jobWithBatches.eligibleBatches || job.eligibility?.graduationYears || []
    );
  };

  return (
    <div className="max mx-auto p-4">
      <div className="bg-[#4AA3B1] text-white p-6 rounded-t-lg shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="text-white hover:bg-white/20 rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{job.jobTitle}</h2>
            <p className="text-white/80">at {getCompanyName()}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>
              Step {currentStep} of {steps.length}
            </span>
            <span>{Math.round(progressPercentage)}% Complete</span>
          </div>
          <Progress
            value={progressPercentage}
            className="h-2 bg-white/20 [&>div]:bg-white"
          />
        </div>
      </div>

      {/* Step Navigation */}
      <div className="flex overflow-x-auto py-4 px-2 gap-2 bg-gray-50 border-x">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap ${
              currentStep === step.id
                ? "bg-[#4AA3B1] text-white"
                : currentStep > step.id
                ? "bg-gray-100 text-gray-700"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            <div
              className={`flex items-center justify-center w-6 h-6 rounded-full text-sm ${
                currentStep === step.id
                  ? "bg-white text-[#4AA3B1]"
                  : currentStep > step.id
                  ? "bg-[#4AA3B1] text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            >
              {currentStep > step.id ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                step.id
              )}
            </div>
            <span>{step.name}</span>
          </div>
        ))}
      </div>

      <Form {...form}>
        <div className="bg-white p-6 rounded-b-lg border-x border-b shadow-lg">
          {/* Step 1: Review Job */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold">Review Job Details</h3>
                <p className="text-muted-foreground">
                  Please review the job details and requirements before
                  proceeding.
                </p>
              </div>

              {!batchEligible && (
                <Alert
                  variant="destructive"
                  className="border-red-200 bg-red-50"
                >
                  <AlertCircle className="h-5 w-5" />
                  <AlertDescription className="text-red-800">
                    <strong>Batch Eligibility Issue:</strong> This job requires
                    graduation year(s): {getEligibleBatches().join(", ")}. Your
                    graduation year is {studentGraduationYear}. You may not be
                    eligible to apply.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="shadow-sm border bg-gradient-to-br from-white to-gray-50">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-6">
                    {getCompanyLogo() ? (
                      <img
                        src={getCompanyLogo()! || "/placeholder.svg"}
                        alt={`${getCompanyName()} logo`}
                        className="w-20 h-20 rounded-xl object-cover shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-md">
                        <Building2 className="h-10 w-10 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-2xl text-gray-900 mb-2">
                        {job.jobTitle}
                      </CardTitle>
                      <p className="text-lg text-gray-600 mb-3">
                        {getCompanyName()}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
                          <MapPin className="h-4 w-4 text-[#4AA3B1]" />
                          {job.location?.join(", ") || "Remote"}
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
                          <Calendar className="h-4 w-4 text-[#4AA3B1]" />
                          Deadline: {formatDate(job.applicationDeadline)}
                        </div>
                        <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm">
                          <GraduationCap className="h-4 w-4 text-[#4AA3B1]" />
                          {job.jobType}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-lg mb-3 text-gray-900">
                      Job Description
                    </h4>
                    <div className="bg-white p-4 rounded-lg border">
                      <p className="text-gray-700 leading-relaxed">
                        {job.jobDescription}
                      </p>
                    </div>
                  </div>

                  {job.eligibility?.requiredSkills &&
                    job.eligibility.requiredSkills.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-3 text-gray-900">
                          Required Skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {job.eligibility.requiredSkills.map(
                            (skill, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="px-3 py-1 bg-[#4AA3B1]/10 text-[#4AA3B1] border-[#4AA3B1]/20"
                              >
                                {skill}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {getEligibleBatches().length > 0 && (
                    <div>
                      <h4 className="font-semibold text-lg mb-3 text-gray-900">
                        Eligible Graduation Years
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {getEligibleBatches().map(
                          (year: number, index: number) => (
                            <Badge
                              key={index}
                              variant={
                                year === studentGraduationYear
                                  ? "default"
                                  : "outline"
                              }
                              className={`px-3 py-1 ${
                                year === studentGraduationYear
                                  ? "bg-green-600 hover:bg-green-700"
                                  : ""
                              }`}
                            >
                              {year}{" "}
                              {year === studentGraduationYear && "(Your Batch)"}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {job.assessment && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        <strong>Assessment Required:</strong> This job requires
                        completing an assessment after application submission.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold">Personal Information</h3>
                <p className="text-muted-foreground">
                  Tell us about yourself and your motivation for this role.
                </p>
              </div>

              {/* Student Profile Summary */}
              {studentProfile && (
                <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <User className="h-5 w-5" />
                      Your Profile Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Name:</span>
                      <span>
                        {studentProfile.personal.firstName}{" "}
                        {studentProfile.personal.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Email:</span>
                      <span>{studentProfile.personal.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">Phone:</span>
                      <span>{studentProfile.personal.phone}</span>
                    </div>
                    {studentProfile.education?.[0] && (
                      <div className="flex items-center gap-2 text-sm">
                        <School className="h-4 w-4 text-blue-600" />
                        <span className="font-medium">Education:</span>
                        <span>
                          {studentProfile.education[0].degree} -{" "}
                          {studentProfile.education[0].yearOfPassing}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="personalStatement"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel className="text-lg font-semibold">
                        Personal Statement *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write a compelling personal statement that highlights your background, achievements, and career goals..."
                          className="min-h-[120px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-sm text-gray-500">
                        {field.value?.length || 0}/1000 characters
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whyInterested"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel className="text-lg font-semibold">
                        Why are you interested in this role? *
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explain what attracts you to this position and company..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="relevantExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">
                        Relevant Experience
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe any relevant work experience, internships, or projects..."
                          className="min-h-[100px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expectedSalary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">
                        Expected Salary
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 5,00,000 " {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availableStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">
                        Available Start Date *
                      </FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="relocateWillingness"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">
                        Willing to Relocate? *
                      </FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="yes" id="relocate-yes" />
                            <label
                              htmlFor="relocate-yes"
                              className="text-sm font-medium"
                            >
                              Yes
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="no" id="relocate-no" />
                            <label
                              htmlFor="relocate-no"
                              className="text-sm font-medium"
                            >
                              No
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="maybe" id="relocate-maybe" />
                            <label
                              htmlFor="relocate-maybe"
                              className="text-sm font-medium"
                            >
                              Maybe
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* Step 3: Application Details */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold">Application Details</h3>
                <p className="text-muted-foreground">
                  Complete your application with additional details and
                  documents.
                </p>
              </div>

              <div className="space-y-6">
                {/* Cover Letter */}
                <FormField
                  control={form.control}
                  name="coverLetter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">
                        Cover Letter (Optional)
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write a personalized cover letter for this specific role..."
                          className="min-h-[150px] resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Custom Questions */}
                {customQuestions.map((question, index) => (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`custom_${index}` as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-lg font-semibold">
                          {question.question}
                          {(question as any).required === true && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </FormLabel>
                        <FormControl>
                          {question.type === "text" && (
                            <Input
                              placeholder="Enter your answer..."
                              {...field}
                            />
                          )}
                          {question.type === "dropdown" && (
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select an option" />
                              </SelectTrigger>
                              <SelectContent>
                                {question.options?.map((option, optIndex) => (
                                  <SelectItem key={optIndex} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {question.type === "radio" && (
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              {question.options?.map((option, optIndex) => (
                                <div
                                  key={optIndex}
                                  className="flex items-center space-x-2"
                                >
                                  <RadioGroupItem
                                    value={option}
                                    id={`${index}-${optIndex}`}
                                  />
                                  <label
                                    htmlFor={`${index}-${optIndex}`}
                                    className="text-sm"
                                  >
                                    {option}
                                  </label>
                                </div>
                              ))}
                            </RadioGroup>
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}

                {/* Resume Upload Section */}
                <Card className="border-2 border-dashed border-gray-300 hover:border-[#4AA3B1] transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <FileText className="h-5 w-5 text-[#4AA3B1]" />
                      Resume Upload
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {studentProfile?.documents?.resume ||
                    studentProfile?.resumeUrl ? (
                      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">
                            Resume from your profile
                          </p>
                          <p className="text-xs text-green-600">
                            Your existing resume will be used for this
                            application
                          </p>
                        </div>
                      </div>
                    ) : null}

                    {uploadedResume ? (
                      <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-800">
                            {uploadedResume.fileName}
                          </p>
                          <p className="text-xs text-blue-600">
                            {(uploadedResume.file.size / 1024 / 1024).toFixed(
                              2
                            )}{" "}
                            MB • Uploaded successfully
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadedResume(null)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600">
                            {studentProfile?.documents?.resume ||
                            studentProfile?.resumeUrl
                              ? "Upload a new resume (optional)"
                              : "Upload your resume (required)"}
                          </p>
                          <p className="text-xs text-gray-500">
                            PDF, DOC, or DOCX • Max 5MB
                          </p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={resumeUploading}
                          className="mt-4 border-[#4AA3B1] text-[#4AA3B1] hover:bg-[#4AA3B1] hover:text-white"
                        >
                          {resumeUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Choose File
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {!studentProfile?.documents?.resume &&
                      !studentProfile?.resumeUrl &&
                      !uploadedResume && (
                        <Alert
                          variant="destructive"
                          className="bg-red-50 border-red-200"
                        >
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-red-800">
                            A resume is required to submit your application.
                            Please upload one above.
                          </AlertDescription>
                        </Alert>
                      )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Step 4: Review & Submit */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold">Review & Submit</h3>
                <p className="text-muted-foreground">
                  Please review your application before submitting.
                </p>
              </div>

              <Card className="shadow-sm">
                <CardHeader className="bg-gradient-to-r from-[#4AA3B1] to-[#3A8391] text-white rounded-t-lg">
                  <CardTitle className="text-xl">Application Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Position Details
                      </h4>
                      <p>
                        <strong>Role:</strong> {job.jobTitle}
                      </p>
                      <p>
                        <strong>Company:</strong> {getCompanyName()}
                      </p>
                      <p>
                        <strong>Location:</strong>{" "}
                        {job.location?.join(", ") || "Remote"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Application Info
                      </h4>
                      <p>
                        <strong>Start Date:</strong>{" "}
                        {form.getValues("availableStartDate")}
                      </p>
                      <p>
                        <strong>Relocate:</strong>{" "}
                        {form.getValues("relocateWillingness")}
                      </p>
                      <p>
                        <strong>Expected Salary:</strong>{" "}
                        {form.getValues("expectedSalary") || "Not specified"}
                      </p>
                    </div>
                  </div>

                  {form.getValues("personalStatement") && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Personal Statement
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700">
                          {form.getValues("personalStatement")}
                        </p>
                      </div>
                    </div>
                  )}

                  {form.getValues("whyInterested") && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Why Interested
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700">
                          {form.getValues("whyInterested")}
                        </p>
                      </div>
                    </div>
                  )}

                  {form.getValues("coverLetter") && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Cover Letter
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-700">
                          {form.getValues("coverLetter")}
                        </p>
                      </div>
                    </div>
                  )}

                  {customQuestions.map((question, index) => {
                    const answer = form.getValues(`custom_${index}` as any);
                    if (!answer) return null;
                    return (
                      <div key={index}>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          {question.question}
                        </h4>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <p className="text-sm text-gray-700">{answer}</p>
                        </div>
                      </div>
                    );
                  })}

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Resume</h4>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#4AA3B1]" />
                      <span className="text-sm">
                        {uploadedResume
                          ? `New resume: ${uploadedResume.fileName}`
                          : studentProfile?.documents?.resume ||
                            studentProfile?.resumeUrl
                          ? "Resume from profile"
                          : "No resume attached"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {!batchEligible && (
                <Alert
                  variant="destructive"
                  className="bg-red-50 border-red-200"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">
                    You are not eligible for this job based on your graduation
                    year. Submitting this application may result in automatic
                    rejection.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={currentStep === 1 ? onCancel : prevStep}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              {currentStep === 1 ? "Cancel" : "Previous"}
            </Button>

            {currentStep < steps.length ? (
              <Button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-2 bg-[#4AA3B1] hover:bg-[#3A8391]"
                disabled={isSubmitting}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={form.handleSubmit(handleSubmit)}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                disabled={
                  isSubmitting ||
                  (!uploadedResume?.url &&
                    !studentProfile?.documents?.resume &&
                    !studentProfile?.resumeUrl)
                }
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            )}
          </div>
        </div>
      </Form>
    </div>
  );
}
