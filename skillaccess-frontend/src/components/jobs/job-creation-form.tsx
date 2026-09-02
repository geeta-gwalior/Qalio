"use client";
import type React from "react";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Path } from "react-hook-form"; // Import Path
import { z } from "zod";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuthStore } from "@/stores/auth-store";
import { getCookie } from "@/utils/getCookie";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface College {
  _id: string;
  collegeName: string;
}

interface Assessment {
  _id: string;
  name: string;
  additionalDescription: string;
  totalTime: number;
  totalMarks: number;
  level: string;
  type: string;
  status: string;
}

export const jobFormSchema = z
  .object({
    jobTitle: z
      .string()
      .min(3, { message: "Job title must be at least 3 characters" }),
    jobDescription: z
      .string()
      .min(10, { message: "Job description must be at least 10 characters" }),
    jobType: z.enum(["Full-Time", "Part-Time", "Internship", "Contract"]),
    department: z.string().optional(),
    industry: z.string().optional(),
    location: z
      .array(z.string())
      .min(1, { message: "At least one location is required" }),
    salaryRange: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional(),
    roleLevel: z.enum(["Entry", "Mid", "Senior"]).optional(),
    joiningDate: z.date().optional(),
    applicationDeadline: z.date(),
    numberOfOpenings: z.number().int().positive().optional(),
    employmentType: z
      .enum(["Permanent", "Temporary", "Contractual"])
      .optional(),
    benefits: z.array(z.string()).optional(),
    eligibility: z
      .object({
        minEducationLevel: z.string().optional(),
        allowedDegrees: z.array(z.string()).optional(),
        branches: z.array(z.string()).optional(),
        minPercentage: z.number().min(0).max(100).optional(),
        graduationYears: z.array(z.number()).optional(),
        experienceRequired: z.string().optional(),
        requiredSkills: z.array(z.string()).optional(),
        preferredCertifications: z.array(z.string()).optional(),
      })
      .optional(),
    interview: z
      .object({
        interviewRequired: z.boolean(),
        nextRoundType: z.string().optional(),
        mode: z.enum(["Online", "Offline", "Phone"]).optional(),
        panelMembers: z.array(z.string()).optional(),
        evaluationCriteria: z.array(z.string()).optional(),
      })
      .optional(),
    applicationSettings: z
      .object({
        acceptFrom: z.enum(["All", "College-specific", "Invite-only"]),
        invitedColleges: z.array(z.string()).optional(),
        autoShortlistScore: z.number().optional(),
        resumeRequired: z.boolean(),
        assessmentRequired: z.boolean().optional(),
        selectedAssessment: z.string().optional(),
        // New fields for assessment date and time
        assessmentStartTime: z.date().optional(),
        assessmentEndTime: z.date().optional(),
      })
      .optional(),
    publishing: z
      .object({
        status: z.enum(["Draft", "Published", "Scheduled"]),
        publishDate: z.date().optional(),
        visibility: z.enum(["Public", "SelectedColleges"]),
        internalNotes: z.string().optional(),
      })
      .optional(),
  })
  .refine(
    (data) => !data.joiningDate || data.joiningDate >= data.applicationDeadline,
    {
      message: "Joining date cannot be before the application deadline",
      path: ["joiningDate"], // shows the error under the joiningDate field
    }
  )
  .refine(
    (data) => {
      if (data.applicationSettings?.assessmentRequired) {
        const startTime = data.applicationSettings.assessmentStartTime;
        const endTime = data.applicationSettings.assessmentEndTime;

        // If assessment is required, both start and end times must be present
        if (!startTime || !endTime) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Assessment start and end times are required when assessment is required.",
      path: ["applicationSettings.assessmentStartTime"], // Point to start time for general requirement
    }
  )
  .refine(
    (data) => {
      if (
        data.applicationSettings?.assessmentRequired &&
        data.applicationSettings.assessmentStartTime &&
        data.applicationSettings.assessmentEndTime
      ) {
        const startTime = data.applicationSettings.assessmentStartTime;
        const endTime = data.applicationSettings.assessmentEndTime;
        // End time must be after start time
        return endTime > startTime;
      }
      return true; // No assessment required, or times are valid
    },
    {
      message: "Assessment end time must be after start time.",
      path: ["applicationSettings.assessmentEndTime"],
    }
  );

type JobFormValues = z.infer<typeof jobFormSchema>;

export default function JobCreationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("id");
  const isEditMode = searchParams.get("isEdit") === "true";

  const [currentStep, setCurrentStep] = useState(1);
  const [locations, setLocations] = useState<string[]>([]);
  const [showAllColleges, setShowAllColleges] = useState(false);
  const [newLocation, setNewLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [benefits, setBenefits] = useState<string[]>([]);
  const [newBenefit, setNewBenefit] = useState("");
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(false);
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollegeIds, setSelectedCollegeIds] = useState<string[]>([]);
  const [isLoadingColleges, setIsLoadingColleges] = useState(false);

  // Assessment related state
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoadingAssessments, setIsLoadingAssessments] = useState(false);

  const steps = [
    { id: 1, name: "Basic Info" },
    { id: 2, name: "Eligibility" },
    { id: 3, name: "Application & Publishing" }, // Updated step name
  ];

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      jobTitle: "",
      jobType: "Full-Time",
      roleLevel: "Entry",
      department: "",
      industry: "",
      employmentType: "Permanent",
      numberOfOpenings: 1,
      salaryRange: {
        min: 0,
        max: 0,
      },
      location: [],
      applicationDeadline: new Date(),
      eligibility: {
        requiredSkills: [],
        minEducationLevel: "",
        allowedDegrees: [],
        branches: [],
        minPercentage: 0,
        graduationYears: [],
        experienceRequired: "",
        preferredCertifications: [],
      },
      interview: {
        interviewRequired: false,
        nextRoundType: "",
        mode: "Online",
        panelMembers: [],
        evaluationCriteria: [],
      },
      applicationSettings: {
        acceptFrom: "All",
        resumeRequired: true,
        assessmentRequired: false,
        selectedAssessment: "",
        invitedColleges: [],
        autoShortlistScore: 0,
        assessmentStartTime: undefined, // New default
        assessmentEndTime: undefined, // New default
      },
      publishing: {
        status: "Draft",
        visibility: "SelectedColleges",
        publishDate: undefined,
        internalNotes: "",
      },
      benefits: [],
      joiningDate: undefined,
    },
  });

  const fetchColleges = async () => {
    setIsLoadingColleges(true);
    try {
      const token = getCookie("jwt");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const endpoint = `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/for-company`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        toast.error(`API returned ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      if (data.success && data.colleges && Array.isArray(data.colleges)) {
        const filteredColleges = data.colleges.filter(
          (college: College) =>
            college.collegeName && college.collegeName.trim() !== ""
        );
        setColleges(filteredColleges);
      } else {
        console.warn("No colleges found or invalid data structure");
        setColleges([]);
      }
    } catch (error) {
      toast.error("Failed to load colleges");
      setColleges([]);
    } finally {
      setIsLoadingColleges(false);
    }
  };

  const fetchAssessments = async () => {
    setIsLoadingAssessments(true);
    try {
      const token = getCookie("jwt");
      if (!token) {
        throw new Error("No authentication token found");
      }
      const endpoint = `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/assessments/company`;
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        toast.error(`API returned ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      if (data.success && data.assessments && Array.isArray(data.assessments)) {
        const filteredAssessments = data.assessments.filter(
          (assessment: Assessment) => !assessment.name.includes("#")
        );
        setAssessments(filteredAssessments);
      } else {
        console.warn("No assessments found or invalid data structure");
        setAssessments([]);
      }
    } catch (error) {
      console.log("Error fetching assessments:", error);
      toast.error("Failed to load assessments");
      setAssessments([]);
    } finally {
      setIsLoadingAssessments(false);
    }
  };

  useEffect(() => {
    fetchColleges();
    fetchAssessments();
  }, []);

  const handleCollegeSelection = (collegeId: string) => {
    const updatedSelection = selectedCollegeIds.includes(collegeId)
      ? selectedCollegeIds.filter((id) => id !== collegeId)
      : [...selectedCollegeIds, collegeId];
    setSelectedCollegeIds(updatedSelection);
    form.setValue("applicationSettings.invitedColleges", updatedSelection);
  };

  const selectAllColleges = () => {
    const allCollegeIds = colleges.map((college) => college._id);
    setSelectedCollegeIds(allCollegeIds);
    form.setValue("applicationSettings.invitedColleges", allCollegeIds);
  };

  const deselectAllColleges = () => {
    setSelectedCollegeIds([]);
    form.setValue("applicationSettings.invitedColleges", []);
  };

  useEffect(() => {
    const fetchJobData = async () => {
      if (isEditMode && jobId) {
        setIsLoading(true);
        try {
          const token = getCookie("jwt");
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/${jobId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (!response.ok) {
            toast.error("Failed to fetch job data");
          }
          const result = await response.json();
          const jobData = result.job || result;
          populateFormWithJobData(jobData);
        } catch (error) {
          console.log("Error fetching job data:", error);
          toast.error("Failed to load job data. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchJobData();
  }, [isEditMode, jobId]);

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "publishing.visibility") {
        if (value.publishing?.visibility === "Public") {
          // If visibility becomes Public, uncheck assessmentRequired
          if (form.getValues("applicationSettings.assessmentRequired")) {
            form.setValue("applicationSettings.assessmentRequired", false, {
              shouldDirty: true,
              shouldValidate: true,
            });
            toast.info("Assessment Required unchecked", {
              description:
                "Assessment is not available for Public job visibility.",
            });
          }
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const populateFormWithJobData = (jobData: any) => {
    form.reset({
      jobTitle: jobData.jobTitle,
      jobDescription: jobData.jobDescription,
      jobType: jobData.jobType,
      department: jobData.department,
      industry: jobData.industry,
      location: jobData.location || [],
      salaryRange: jobData.salaryRange,
      roleLevel: jobData.roleLevel,
      joiningDate: jobData.joiningDate
        ? new Date(jobData.joiningDate)
        : undefined,
      applicationDeadline: jobData.applicationDeadline
        ? new Date(jobData.applicationDeadline)
        : new Date(),
      numberOfOpenings: jobData.numberOfOpenings,
      employmentType: jobData.employmentType,
      benefits: jobData.benefits || [],
      eligibility: jobData.eligibility || {
        requiredSkills: [],
      },
      interview: jobData.interview || {
        interviewRequired: false,
        mode: "Online",
      },
      applicationSettings: jobData.applicationSettings
        ? {
            ...jobData.applicationSettings,
            assessmentRequired: !!jobData.assessment,
            selectedAssessment:
              jobData.assessment?._id || jobData.assessment || "",
            invitedColleges: jobData.applicationSettings?.invitedColleges || [],
            // New: Populate assessment start and end times from ISO strings
            assessmentStartTime: jobData.applicationSettings
              ?.assessmentStartTime
              ? new Date(jobData.applicationSettings.assessmentStartTime)
              : undefined,
            assessmentEndTime: jobData.applicationSettings?.assessmentEndTime
              ? new Date(jobData.applicationSettings.assessmentEndTime)
              : undefined,
          }
        : {
            acceptFrom: "All",
            resumeRequired: true,
            assessmentRequired: false,
            selectedAssessment: "",
            invitedColleges: [],
            assessmentStartTime: undefined, // New default
            assessmentEndTime: undefined, // New default
          },
      publishing: {
        status: jobData.publishing?.status || "Draft",
        visibility: jobData.publishing?.visibility || "Public",
        publishDate: jobData.publishing?.publishDate
          ? new Date(jobData.publishing.publishDate)
          : undefined,
        internalNotes: jobData.publishing?.internalNotes || "",
      },
    });
    setLocations(jobData.location || []);
    setSkills(jobData.eligibility?.requiredSkills || []);
    setBenefits(jobData.benefits || []);
    setSelectedCollegeIds(jobData.applicationSettings?.invitedColleges || []);
  };

  const addLocation = () => {
    if (newLocation && !locations.includes(newLocation)) {
      const updatedLocations = [...locations, newLocation];
      setLocations(updatedLocations);
      form.setValue("location", updatedLocations);
      setNewLocation("");
    }
  };

  const removeLocation = (location: string) => {
    const updatedLocations = locations.filter((loc) => loc !== location);
    setLocations(updatedLocations);
    form.setValue("location", updatedLocations);
  };

  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      const updatedSkills = [...skills, newSkill];
      setSkills(updatedSkills);
      form.setValue("eligibility.requiredSkills", updatedSkills);
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    const updatedSkills = skills.filter((s) => s !== skill);
    setSkills(updatedSkills);
    form.setValue("eligibility.requiredSkills", updatedSkills);
  };

  const addBenefit = () => {
    if (newBenefit && !benefits.includes(newBenefit)) {
      const updatedBenefits = [...benefits, newBenefit];
      setBenefits(updatedBenefits);
      form.setValue("benefits", updatedBenefits);
      setNewBenefit("");
    }
  };

  const removeBenefit = (benefit: string) => {
    const updatedBenefits = benefits.filter((b) => b !== benefit);
    setBenefits(updatedBenefits);
    form.setValue("benefits", updatedBenefits);
  };

  async function handleFormSubmit(data: JobFormValues) {
    try {
      setIsLoading(true);
      // CUSTOM VALIDATION: Check if visibility is Public and Assessment Required is checked
      if (
        data.publishing?.visibility === "Public" &&
        data.applicationSettings?.assessmentRequired
      ) {
        toast.error("Visibility Conflict", {
          description:
            "When visibility is 'Public', 'Assessment Required' cannot be checked. Please uncheck 'Assessment Required'.",
        });
        setIsLoading(false);
        return; // Stop form submission
      }
      // CUSTOM VALIDATION: Check if either Resume Required or Assessment Required is checked
      if (
        !data.applicationSettings?.resumeRequired &&
        !data.applicationSettings?.assessmentRequired
      ) {
        toast.error("Application Method Required", {
          description:
            "Please check either 'Resume Required' or 'Assessment Required'.",
        });
        setIsLoading(false);
        return; // Stop form submission
      }
      // Additional validation for assessment selection
      if (
        data.applicationSettings?.assessmentRequired &&
        !data.applicationSettings?.selectedAssessment
      ) {
        toast.error("Assessment Selection Required", {
          description:
            "Please select an assessment when assessment is required.",
        });
        setIsLoading(false);
        return; // Stop form submission
      }
      // Additional validation for college selection
      if (
        data.applicationSettings?.acceptFrom === "College-specific" &&
        (!data.applicationSettings?.invitedColleges ||
          data.applicationSettings.invitedColleges.length === 0)
      ) {
        toast.error("College Selection Required", {
          description:
            "Please select at least one college for college-specific visibility.",
        });
        setIsLoading(false);
        return; // Stop form submission
      }
      if (
        data.publishing?.visibility === "SelectedColleges" &&
        (!selectedCollegeIds || selectedCollegeIds.length === 0)
      ) {
        toast.error("College Selection Required", {
          description:
            "Please select at least one college for selected colleges visibility.",
        });
        setIsLoading(false);
        return; // Stop form submission
      }

      const jobDataToSend = {
        jobTitle: data.jobTitle,
        jobDescription: data.jobDescription,
        jobType: data.jobType,
        department: data.department || "",
        industry: data.industry || "",
        location: data.location,
        salaryRange: data.salaryRange,
        roleLevel: data.roleLevel,
        joiningDate: data.joiningDate?.toISOString(), // Convert to ISO string
        applicationDeadline: data.applicationDeadline.toISOString(), // Convert to ISO string
        numberOfOpenings: data.numberOfOpenings || 1,
        employmentType: data.employmentType,
        benefits: data.benefits || [],
        eligibility: data.eligibility,
        interview: data.interview,
        applicationSettings: {
          ...data.applicationSettings,
          invitedColleges: selectedCollegeIds,
          // New: Convert assessment times to ISO strings if they exist
          assessmentStartTime:
            data.applicationSettings?.assessmentStartTime?.toISOString(),
          assessmentEndTime:
            data.applicationSettings?.assessmentEndTime?.toISOString(),
        },
        publishing: data.publishing,

        companyId: user?._id,
        // Add assessment if required
        assessmentId: data.applicationSettings?.assessmentRequired
          ? data.applicationSettings?.selectedAssessment
          : null,
      };

      const token = getCookie("jwt");
      const endpoint = isEditMode
        ? `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/${jobId}`
        : `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/create`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(jobDataToSend), // Use jobDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(
          ` ${errorData.message} || Failed to ${
            isEditMode ? "update" : "create"
          } job`
        );
      }
      const result = await response.json();
      toast.success(isEditMode ? "Job Updated" : "Job Created", {
        description: isEditMode
          ? "Your job has been successfully updated."
          : "Your job has been successfully created.",
      });
      router.push("/company/jobs");
    } catch (error) {
      console.log(`Error ${isEditMode ? "updating" : "creating"} job:`, error);
      toast.error("Error", {
        description: `Failed to ${
          isEditMode ? "update" : "create"
        } job. Please try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  }

  const nextStep = async () => {
    let fieldsToValidate: Path<JobFormValues>[] = []; // Changed type to Path<JobFormValues>[]
    switch (currentStep) {
      case 1:
        fieldsToValidate = [
          "jobTitle",
          "jobDescription",
          "jobType",
          "location",
          "applicationDeadline",
          "joiningDate", // Include for refine validation
        ];
        break;
      case 2:
        fieldsToValidate = [
          "eligibility.minEducationLevel",
          "eligibility.minPercentage",
          "eligibility.experienceRequired",
          "eligibility.requiredSkills",
        ];
        break;
      case 3: // This is now the combined Application & Publishing step
        fieldsToValidate = [
          "applicationSettings.acceptFrom",
          "applicationSettings.resumeRequired",
          "applicationSettings.assessmentRequired",
          "applicationSettings.selectedAssessment",
          "applicationSettings.invitedColleges",
          "applicationSettings.assessmentStartTime", // New field to validate
          "applicationSettings.assessmentEndTime", // New field to validate
          "publishing.status",
          "publishing.publishDate",
          "publishing.visibility",
          "publishing.internalNotes",
        ];
        break;
    }
    const isValid = await form.trigger(fieldsToValidate); // Removed 'as any' cast

    if (isValid) {
      // CUSTOM VALIDATION: Check if application deadline is in the future
      if (currentStep === 1) {
        const values = form.getValues();
        const applicationDeadline = values.applicationDeadline;
        const today = new Date();
        // Set today to start of day for comparison
        today.setHours(0, 0, 0, 0);
        // Set application deadline to start of day for comparison
        const deadlineDate = new Date(applicationDeadline);
        deadlineDate.setHours(0, 0, 0, 0);
        if (deadlineDate <= today) {
          toast.error("Invalid Application Deadline", {
            description:
              "Application deadline must be a future date. Please select a date after today.",
          });
          return; // Stop progression
        }
      }
      // Add custom conditional validations for step 3 (now combined)
      if (currentStep === 3) {
        const values = form.getValues();

        // New Validation: If visibility is Public, assessment required cannot be checked
        if (
          values.publishing?.visibility === "Public" &&
          values.applicationSettings?.assessmentRequired
        ) {
          toast.error("Visibility Conflict", {
            description:
              "When visibility is 'Public', 'Assessment Required' cannot be checked. Please uncheck 'Assessment Required'.",
          });
          return; // Stop progression
        }
        // Validation: Either Resume Required or Assessment Required must be checked
        if (
          !values.applicationSettings?.resumeRequired &&
          !values.applicationSettings?.assessmentRequired
        ) {
          toast.error("Application Method Required", {
            description:
              "Please check either 'Resume Required' or 'Assessment Required'.",
          });
          return; // Stop progression
        }
        if (
          values.applicationSettings?.assessmentRequired &&
          !values.applicationSettings?.selectedAssessment
        ) {
          toast.error("Assessment Selection Required", {
            description:
              "Please select an assessment when assessment is required.",
          });
          return; // Stop progression
        }
        if (
          values.applicationSettings?.acceptFrom === "College-specific" &&
          (!values.applicationSettings?.invitedColleges ||
            values.applicationSettings.invitedColleges.length === 0)
        ) {
          toast.error("College Selection Required", {
            description:
              "Please select at least one college for college-specific visibility.",
          });
          return; // Stop progression
        }
        // Additional validation for publishing.visibility if needed, similar to above
        if (
          values.publishing?.visibility === "SelectedColleges" &&
          (!selectedCollegeIds || selectedCollegeIds.length === 0)
        ) {
          toast.error("College Selection Required", {
            description:
              "Please select at least one college for selected colleges visibility.",
          });
          return; // Stop progression
        }
      }
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      toast.error("Please fill in all required fields correctly.", {
        description:
          "Some fields on the current step have errors. Please review them.",
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isLastStep = currentStep === steps.length;
  const progressPercentage = (currentStep / steps.length) * 100;

  if (isLoading && isEditMode) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4AA3B1] mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading job data...</p>
        </div>
      </div>
    );
  }

  const CollegeSelectionList: React.FC = () => (
    <div className="space-y-4">
      <div>
        <FormLabel>Select Colleges</FormLabel>
        <FormDescription>
          Choose which colleges can see and apply to this job posting.
        </FormDescription>
      </div>
      <div className="flex justify-between items-center">
        <div className="text-sm">
          {selectedCollegeIds.length > 0 ? (
            <span>
              {selectedCollegeIds.length} college
              {selectedCollegeIds.length !== 1 ? "s" : ""} selected
            </span>
          ) : (
            <span>No colleges selected</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={selectAllColleges}
            disabled={colleges.length === 0}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={deselectAllColleges}
            disabled={selectedCollegeIds.length === 0}
          >
            Clear All
          </Button>
        </div>
      </div>
      <div className="border rounded-lg max-h-64 overflow-y-auto">
        {isLoadingColleges ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : colleges.length > 0 ? (
          <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-2">
            {colleges.map((college) => (
              <div
                key={college._id}
                className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md"
              >
                <Checkbox
                  id={`college-${college._id}`}
                  checked={selectedCollegeIds.includes(college._id)}
                  onCheckedChange={() => handleCollegeSelection(college._id)}
                />
                <Label
                  htmlFor={`college-${college._id}`}
                  className="font-medium cursor-pointer"
                >
                  {college.collegeName}
                </Label>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">
            No colleges available.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="bg-[#4AA3B1] text-white p-6 rounded-t-lg">
        <h2 className="text-2xl font-bold">
          {isEditMode ? "Edit Job" : "Create Job"}
        </h2>
        <p className="text-white/80">
          {isEditMode
            ? "Update the job posting information"
            : "Fill out the form to create a new job posting"}
        </p>
        <Progress
          value={progressPercentage}
          className="h-2 mt-4 bg-white/20 [&>div]:bg-white"
        />
      </div>
      <div className="flex overflow-x-auto py-4 px-2 gap-2">
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
              {step.id}
            </div>
            <span>{step.name}</span>
          </div>
        ))}
      </div>
      <Form {...form}>
        <div className="bg-white p-6 rounded-lg border">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold">Basic Information</h3>
                <p className="text-muted-foreground">
                  Enter the basic details about the job position.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title*</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Software Engineer"
                          value={field.value}
                          onChange={(e) => {
                            const value = e.target.value;
                            const valid = /^[a-zA-Z0-9\s-]*$/.test(value);
                            if (valid) {
                              field.onChange(value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jobType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="!w-full">
                            <SelectValue placeholder="Select job type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Full-Time">Full-Time</SelectItem>
                          <SelectItem value="Part-Time">Part-Time</SelectItem>
                          <SelectItem value="Internship">Internship</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Engineering" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Technology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description*</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the job responsibilities, requirements, and other details"
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormLabel>Location*</FormLabel>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add location (e.g. Remote, Hybrid, City name)"
                    value={newLocation}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only letters, numbers, spaces, and hyphens
                      const valid = /^[a-zA-Z0-9\s-]*$/.test(value);
                      if (valid) {
                        setNewLocation(value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addLocation();
                      }
                    }}
                  />
                  <Button type="button" onClick={addLocation} size="sm">
                    Add
                  </Button>
                </div>
                {locations.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {locations.map((location, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md"
                      >
                        <span>{location}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => removeLocation(location)}
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {form.formState.errors.location && (
                  <p className="text-sm font-medium text-destructive mt-2">
                    {form.formState.errors.location.message}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FormLabel>Salary Range (In Lakhs)</FormLabel>
                  <div className="flex items-center gap-2 mt-2">
                    <FormField
                      control={form.control}
                      name="salaryRange.min"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Min"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? Number.parseInt(e.target.value)
                                    : undefined
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <span>to</span>
                    <FormField
                      control={form.control}
                      name="salaryRange.max"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Max"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? Number.parseInt(e.target.value)
                                    : undefined
                                )
                              }
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <FormField
                  control={form.control}
                  name="numberOfOpenings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Openings</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 5"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number.parseInt(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="roleLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="!w-full">
                            <SelectValue placeholder="Select role level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Entry">Entry Level</SelectItem>
                          <SelectItem value="Mid">Mid Level</SelectItem>
                          <SelectItem value="Senior">Senior Level</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="!w-full">
                            <SelectValue placeholder="Select employment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Permanent">Permanent</SelectItem>
                          <SelectItem value="Temporary">Temporary</SelectItem>
                          <SelectItem value="Contractual">
                            Contractual
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="joiningDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Joining Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="applicationDeadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Application Deadline*</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div>
                <FormLabel>Benefits</FormLabel>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add benefit (e.g. Health Insurance, Remote Work)"
                    value={newBenefit}
                    onChange={(e) => setNewBenefit(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addBenefit();
                      }
                    }}
                  />
                  <Button type="button" onClick={addBenefit} size="sm">
                    Add
                  </Button>
                </div>
                {benefits.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md"
                      >
                        <span>{benefit}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => removeBenefit(benefit)}
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold">Eligibility Criteria</h3>
                <p className="text-muted-foreground">
                  Define the eligibility requirements for applicants.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="eligibility.minEducationLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Education Level</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="!w-full">
                            <SelectValue placeholder="Select education level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="High School">
                            High School
                          </SelectItem>
                          <SelectItem value="Bachelor's">
                            Bachelor&apos;s Degree
                          </SelectItem>
                          <SelectItem value="Master's">
                            Master&apos;s Degree
                          </SelectItem>
                          <SelectItem value="PhD">PhD</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="eligibility.minPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Percentage/CGPA</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g. 70"
                          {...field}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? Number.parseFloat(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="eligibility.experienceRequired"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Required</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. 2+ years in web development"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormLabel>Required Skills</FormLabel>
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="Add skill (e.g. React Nodejs)"
                    value={newSkill}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Allow only letters, numbers, and spaces
                      const valid = /^[a-zA-Z0-9\s+]*$/.test(value);
                      if (valid) {
                        setNewSkill(value);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                  />
                  <Button type="button" onClick={addSkill} size="sm">
                    Add
                  </Button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {skills.map((skill, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-md"
                      >
                        <span>{skill}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0"
                          onClick={() => removeSkill(skill)}
                        >
                          <TrashIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Application Settings Section */}
              <div>
                <h3 className="text-xl font-bold">Application Settings</h3>
                <p className="text-muted-foreground">
                  Configure how candidates can apply for this job.
                </p>
              </div>
              <FormField
                control={form.control}
                name="applicationSettings.acceptFrom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accept Applications From</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="All">All Candidates</SelectItem>
                        <SelectItem value="College-specific" disabled>
                          College-specific (Upcoming)
                        </SelectItem>
                        <SelectItem value="Invite-only" disabled>
                          Invite-only (Upcoming)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applicationSettings.resumeRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Resume Required</FormLabel>
                      <FormDescription>
                        Check if candidates must submit a resume
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applicationSettings.assessmentRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          const currentVisibility = form.getValues(
                            "publishing.visibility"
                          );
                          if (currentVisibility === "Public" && checked) {
                            toast.error("Visibility Conflict", {
                              description:
                                "Assessment is not available for Public job visibility. Please select 'Selected Colleges Only' or uncheck 'Assessment Required'.",
                            });
                            field.onChange(false); // Force uncheck
                          } else {
                            field.onChange(checked);
                          }
                        }}
                        disabled={
                          form.watch("publishing.visibility") === "Public"
                        } // Disable if Public visibility is selected
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Assessment Required</FormLabel>
                      <FormDescription>
                        Check if candidates must complete an assessment before
                        applying
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              {form.watch("applicationSettings.assessmentRequired") && (
                <>
                  <FormField
                    control={form.control}
                    name="applicationSettings.selectedAssessment"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="text-base font-semibold">
                          Select Assessment *
                        </FormLabel>
                        <FormDescription className="text-sm text-muted-foreground mb-1">
                          Choose an assessment that candidates must complete
                          before applying to this job.
                        </FormDescription>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-12 rounded-xl border border-input shadow-sm hover:shadow-md transition">
                              <SelectValue placeholder="Select an assessment" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="rounded-xl border shadow-lg">
                            {isLoadingAssessments ? (
                              <div className="p-4 space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-4 w-2/3" />
                              </div>
                            ) : assessments.length > 0 ? (
                              assessments.map((assessment) => (
                                <SelectItem
                                  key={assessment._id}
                                  value={assessment._id}
                                  className="px-3 py-2 hover:bg-muted/50 rounded-md transition flex flex-col items-start gap-0.5"
                                >
                                  <span className="font-medium">
                                    {assessment.name}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    ⏱ {assessment.totalTime} min • 📝{" "}
                                    {assessment.totalMarks} marks • 📊{" "}
                                    {assessment.level}
                                  </span>
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-4 text-center text-muted-foreground text-sm">
                                No published assessments available.
                                <br />
                                <span>
                                  Create and publish assessments first.
                                </span>
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* New: Assessment Start Date & Time */}
                  <FormField
                    control={form.control}
                    name="applicationSettings.assessmentStartTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Assessment Start Date & Time*</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${
                                  !field.value ? "text-muted-foreground" : ""
                                }`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP hh:mm a")
                                ) : (
                                  <span>Pick a date and time</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                if (date) {
                                  // Preserve existing time if any, otherwise set to 00:00
                                  const existingDate =
                                    field.value || new Date();
                                  existingDate.setFullYear(
                                    date.getFullYear(),
                                    date.getMonth(),
                                    date.getDate()
                                  );
                                  field.onChange(existingDate);
                                } else {
                                  field.onChange(undefined);
                                }
                              }}
                              initialFocus
                            />
                            <div className="p-3 border-t">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="HH"
                                  value={
                                    field.value
                                      ? (field.value.getHours() % 12 === 0
                                          ? 12
                                          : field.value.getHours() % 12
                                        )
                                          .toString()
                                          .padStart(2, "0")
                                      : ""
                                  }
                                  onChange={(e) => {
                                    let newHours = parseInt(e.target.value, 10);
                                    if (isNaN(newHours)) newHours = 0;
                                    if (newHours < 1 || newHours > 12)
                                      newHours = 1; // Clamp to 1-12

                                    const currentMinutes = field.value
                                      ? field.value.getMinutes()
                                      : 0;
                                    const ampm = field.value
                                      ? field.value.getHours() >= 12
                                        ? "PM"
                                        : "AM"
                                      : "AM";

                                    const newDate = field.value
                                      ? new Date(field.value)
                                      : new Date();
                                    newDate.setHours(
                                      ampm === "PM" && newHours !== 12
                                        ? newHours + 12
                                        : ampm === "AM" && newHours === 12
                                        ? 0
                                        : newHours,
                                      currentMinutes,
                                      0,
                                      0
                                    );
                                    field.onChange(newDate);
                                  }}
                                  min={1}
                                  max={12}
                                  className="w-16"
                                />
                                <span>:</span>
                                <Input
                                  type="number"
                                  placeholder="MM"
                                  value={
                                    field.value
                                      ? field.value
                                          .getMinutes()
                                          .toString()
                                          .padStart(2, "0")
                                      : ""
                                  }
                                  onChange={(e) => {
                                    let newMinutes = parseInt(
                                      e.target.value,
                                      10
                                    );
                                    if (isNaN(newMinutes)) newMinutes = 0;
                                    if (newMinutes < 0 || newMinutes > 59)
                                      newMinutes = 0; // Clamp to 0-59

                                    const newDate = field.value
                                      ? new Date(field.value)
                                      : new Date();
                                    newDate.setMinutes(newMinutes, 0, 0);
                                    field.onChange(newDate);
                                  }}
                                  min={0}
                                  max={59}
                                  className="w-16"
                                />
                                <Select
                                  value={
                                    field.value
                                      ? field.value.getHours() >= 12
                                        ? "PM"
                                        : "AM"
                                      : "AM"
                                  }
                                  onValueChange={(newAmPm) => {
                                    const newDate = field.value
                                      ? new Date(field.value)
                                      : new Date();
                                    const currentHours = newDate.getHours();
                                    if (newAmPm === "PM" && currentHours < 12) {
                                      newDate.setHours(currentHours + 12);
                                    } else if (
                                      newAmPm === "AM" &&
                                      currentHours >= 12
                                    ) {
                                      newDate.setHours(currentHours - 12);
                                    }
                                    field.onChange(newDate);
                                  }}
                                >
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="AM">AM</SelectItem>
                                    <SelectItem value="PM">PM</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* New: Assessment End Date & Time */}
                  <FormField
                    control={form.control}
                    name="applicationSettings.assessmentEndTime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Assessment End Date & Time*</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${
                                  !field.value ? "text-muted-foreground" : ""
                                }`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP hh:mm a")
                                ) : (
                                  <span>Pick a date and time</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                if (date) {
                                  const existingDate =
                                    field.value || new Date();
                                  existingDate.setFullYear(
                                    date.getFullYear(),
                                    date.getMonth(),
                                    date.getDate()
                                  );
                                  field.onChange(existingDate);
                                } else {
                                  field.onChange(undefined);
                                }
                              }}
                              initialFocus
                            />
                            <div className="p-3 border-t">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  placeholder="HH"
                                  value={
                                    field.value
                                      ? (field.value.getHours() % 12 === 0
                                          ? 12
                                          : field.value.getHours() % 12
                                        )
                                          .toString()
                                          .padStart(2, "0")
                                      : ""
                                  }
                                  onChange={(e) => {
                                    let newHours = parseInt(e.target.value, 10);
                                    if (isNaN(newHours)) newHours = 0;
                                    if (newHours < 1 || newHours > 12)
                                      newHours = 1;

                                    const currentMinutes = field.value
                                      ? field.value.getMinutes()
                                      : 0;
                                    const ampm = field.value
                                      ? field.value.getHours() >= 12
                                        ? "PM"
                                        : "AM"
                                      : "AM";

                                    const newDate = field.value
                                      ? new Date(field.value)
                                      : new Date();
                                    newDate.setHours(
                                      ampm === "PM" && newHours !== 12
                                        ? newHours + 12
                                        : ampm === "AM" && newHours === 12
                                        ? 0
                                        : newHours,
                                      currentMinutes,
                                      0,
                                      0
                                    );
                                    field.onChange(newDate);
                                  }}
                                  min={1}
                                  max={12}
                                  className="w-16"
                                />
                                <span>:</span>
                                <Input
                                  type="number"
                                  placeholder="MM"
                                  value={
                                    field.value
                                      ? field.value
                                          .getMinutes()
                                          .toString()
                                          .padStart(2, "0")
                                      : ""
                                  }
                                  onChange={(e) => {
                                    let newMinutes = parseInt(
                                      e.target.value,
                                      10
                                    );
                                    if (isNaN(newMinutes)) newMinutes = 0;
                                    if (newMinutes < 0 || newMinutes > 59)
                                      newMinutes = 0;

                                    const newDate = field.value
                                      ? new Date(field.value)
                                      : new Date();
                                    newDate.setMinutes(newMinutes, 0, 0);
                                    field.onChange(newDate);
                                  }}
                                  min={0}
                                  max={59}
                                  className="w-16"
                                />
                                <Select
                                  value={
                                    field.value
                                      ? field.value.getHours() >= 12
                                        ? "PM"
                                        : "AM"
                                      : "AM"
                                  }
                                  onValueChange={(newAmPm) => {
                                    const newDate = field.value
                                      ? new Date(field.value)
                                      : new Date();
                                    const currentHours = newDate.getHours();
                                    if (newAmPm === "PM" && currentHours < 12) {
                                      newDate.setHours(currentHours + 12);
                                    } else if (
                                      newAmPm === "AM" &&
                                      currentHours >= 12
                                    ) {
                                      newDate.setHours(currentHours - 12);
                                    }
                                    field.onChange(newDate);
                                  }}
                                >
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="AM">AM</SelectItem>
                                    <SelectItem value="PM">PM</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {form.watch("applicationSettings.assessmentRequired") &&
                form.watch("applicationSettings.selectedAssessment") && (
                  <div className="bg-white border border-[#219CAE]/30 rounded-xl p-5 shadow-sm">
                    <h4 className="text-lg font-semibold text-[#219CAE] mb-3">
                      Assessment Details
                    </h4>
                    {(() => {
                      const selectedAssessmentId = form.watch(
                        "applicationSettings.selectedAssessment"
                      );
                      const selectedAssessment = assessments.find(
                        (a) => a._id === selectedAssessmentId
                      );
                      return selectedAssessment ? (
                        <div className="text-sm text-black space-y-2">
                          <div className="flex justify-between">
                            <span className="font-medium text-[#219CAE]">
                              Name:
                            </span>
                            <span>{selectedAssessment.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-[#219CAE]">
                              Duration:
                            </span>
                            <span>{selectedAssessment.totalTime} minutes</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-[#219CAE]">
                              Total Marks:
                            </span>
                            <span>{selectedAssessment.totalMarks}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-[#219CAE]">
                              Level:
                            </span>
                            <span>{selectedAssessment.level}</span>
                          </div>
                          {selectedAssessment.additionalDescription && (
                            <div>
                              <span className="font-medium text-[#219CAE]">
                                Description:
                              </span>
                              <p className="mt-1 text-sm text-gray-800">
                                {selectedAssessment.additionalDescription}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No assessment selected.
                        </p>
                      );
                    })()}
                  </div>
                )}
              {/* Publishing Settings Section - MOVED HERE */}
              <div className="mt-8">
                <h3 className="text-xl font-bold">Publishing Settings</h3>
                <p className="text-muted-foreground">
                  Configure how and when this job will be published.
                </p>
              </div>
              <FormField
                control={form.control}
                name="publishing.status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publishing Status</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Draft" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Save as Draft
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Published" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Publish Immediately
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="Scheduled" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Schedule for Later
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {form.watch("publishing.status") === "Scheduled" && (
                <FormField
                  control={form.control}
                  name="publishing.publishDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Publish Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant={"outline"}
                              className={`w-full pl-3 text-left font-normal ${
                                !field.value ? "text-muted-foreground" : ""
                              }`}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="publishing.visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="SelectedColleges">
                            Selected Colleges Only
                          </SelectItem>
                          <SelectItem value="Public">
                            Public (Visible to all)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(form.watch("publishing.visibility") === "SelectedColleges" ||
                form.watch("applicationSettings.acceptFrom") ===
                  "College-specific" ||
                form.watch("applicationSettings.acceptFrom") ===
                  "Invite-only") && <CollegeSelectionList />}
              <FormField
                control={form.control}
                name="publishing.internalNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any internal notes about this job posting"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      These notes are only visible to your team, not to
                      applicants.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedCollegeIds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Selected Colleges ({selectedCollegeIds.length})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(showAllColleges
                      ? selectedCollegeIds
                      : selectedCollegeIds.slice(0, 5)
                    ).map((collegeId) => {
                      const college = colleges.find((c) => c._id === collegeId);
                      return college ? (
                        <span
                          key={collegeId}
                          className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm"
                        >
                          {college.collegeName}
                        </span>
                      ) : null;
                    })}
                    {!showAllColleges && selectedCollegeIds.length > 5 && (
                      <button
                        onClick={() => setShowAllColleges(true)}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm underline cursor-pointer"
                      >
                        +{selectedCollegeIds.length - 5} more
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <div
          className={`mt-6 flex ${
            currentStep === 1 ? "justify-end" : "justify-between"
          }`}
        >
          {currentStep != 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2 bg-transparent"
            >
              <ChevronLeftIcon className="h-4 w-4" /> Previous
            </Button>
          )}
          {isLastStep ? (
            <Button
              type="button"
              onClick={() =>
                form.handleSubmit(handleFormSubmit, (errors) => {
                  // This callback is executed if Zod validation fails
                  toast.error("Please fill in all required fields correctly.", {
                    description:
                      "Some fields on the form have errors. Please review them.",
                  });
                  console.log("Form validation errors:", errors);
                })()
              }
              className="bg-[#4AA3B1] hover:bg-[#3A8391]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  {isEditMode ? "Updating..." : "Creating..."}
                </>
              ) : isEditMode ? (
                "Update Job"
              ) : (
                "Create Job"
              )}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={nextStep}
              className="flex items-center gap-2 bg-[#4AA3B1] hover:bg-[#3A8391]"
            >
              Next <ChevronRightIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
}
