"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import JobCard from "@/components/job-card";
import { getCookie } from "@/utils/getCookie";
import JobApplicationForm from "@/components/job-application-form";
import type { IJob } from "@/types/job";
import { useAuthStore } from "@/stores/auth-store";

interface JobDetailsFromAPI extends IJob {
  eligibilityCheck?: {
    eligible: boolean;
    reasons: string[];
    batchYearMatch?: boolean;
  };
  responsibilities?: string[];
}

interface StudentProfile {
  _id: string;
  userId: string;
  batch: string;
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

interface ApplicationStatus {
  hasApplied: boolean;
  status?: string;
  applicationDate?: string;
  assessmentCompleted?: boolean;
  applicationId?: string;
}

export default function StudentJobDetailsPage() {
  const { user } = useAuthStore();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null
  );
  const [job, setJob] = useState<JobDetailsFromAPI | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>(
    { hasApplied: false }
  );
  const [bookmarked, setBookmarked] = useState(false);
  const [relatedJobsLoading, setRelatedJobsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("id");
  const now = new Date();
  // Get student profile data
  useEffect(() => {
    const getStudentProfile = async () => {
      try {
        const token = getCookie("jwt");
        if (!token) return;

        const profileResponse = await fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/profile-completion-status`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.success) {
            setStudentProfile(profileData.student);
          }
        }
      } catch (error) {
        console.error("Failed to get student profile:", error);
      }
    };

    getStudentProfile();
  }, []);

  const studentActualBatchYear = useMemo(() => {
    if (studentProfile?.batch) {
      const batchYear = Number.parseInt(studentProfile.batch, 10);
      return isNaN(batchYear) ? null : batchYear;
    }
    return null;
  }, [studentProfile]);

  const isEligibleByBatchYear = useMemo(() => {
    if (!job || !studentActualBatchYear) return true;
    if (
      !job.eligibility?.graduationYears ||
      job.eligibility.graduationYears.length === 0
    )
      return true;
    return job.eligibility.graduationYears.includes(studentActualBatchYear);
  }, [job, studentActualBatchYear]);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
      fetchRelatedJobs();
      // Remove this line: if (user?._id) { checkApplicationStatus() }
    } else {
      setError("Job ID not provided.");
      setLoading(false);
    }
  }, [jobId, user]);

  const fetchJobDetails = async () => {
    if (!jobId) return;
    setLoading(true);
    setError(null);
    try {
      const token = getCookie("jwt");
      if (!token) {
        setError("Authentication required.");
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/${jobId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(
          errData.message ||
            `Failed to fetch job details (Status: ${res.status})`
        );
      }
      const data = await res.json();
      if (data.success && data.job) {
        setJob(data.job);
      } else {
        throw new Error(data.message || "Job not found or invalid data.");
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedJobs = async () => {
    if (!user?._id) return;
    setRelatedJobsLoading(true);
    try {
      const token = getCookie("jwt");
      if (!token) return;

      // First try to get student-specific available jobs
      let res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/student/${user._id}/available`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      let jobs = [];
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.jobs)) {
          jobs = data.jobs;
        }
      }

      // If no student-specific jobs or need more, fetch public jobs
      if (jobs.length < 4) {
        res = await fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/public`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.ok) {
          const publicData = await res.json();
          if (publicData.success && Array.isArray(publicData.jobs)) {
            // Combine and deduplicate
            const existingIds = jobs.map((j: IJob) => j._id);
            const additionalJobs = publicData.jobs.filter(
              (j: IJob) => !existingIds.includes(j._id)
            );
            jobs = [...jobs, ...additionalJobs];
          }
        }
      }

      // Filter out current job and limit to 4
      const filteredJobs = jobs
        .filter((j: IJob) => j._id !== jobId)
        .slice(0, 4);

      setRelatedJobs(filteredJobs);
    } catch (err) {
      console.error("Failed to fetch related jobs:", err);
      // Fallback: try to fetch public jobs only
      try {
        const token = getCookie("jwt");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/public`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.jobs)) {
            setRelatedJobs(
              data.jobs.filter((j: IJob) => j._id !== jobId).slice(0, 4)
            );
          }
        }
      } catch (fallbackErr) {
        console.error("Fallback fetch also failed:", fallbackErr);
      }
    } finally {
      setRelatedJobsLoading(false);
    }
  };

  const checkApplicationStatus = async () => {
    if (!user?._id || !jobId) return;
    try {
      const token = getCookie("jwt");
      if (!token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/student/${user._id}/applications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.applications)) {
        // Find application that matches current jobId - let backend handle the matching
        const application = data.applications.find((app: any) => {
          // Direct comparison since backend should return matched applications
          return app.job._id === jobId;
        });

        if (application) {
          setApplicationStatus({
            hasApplied: true,
            status: application.status,
            applicationDate: application.applicationDate,
            assessmentCompleted: application.assessmentCompleted,
            applicationId: application._id,
          });
        } else {
          setApplicationStatus({ hasApplied: false });
        }
      }
    } catch (err) {
      console.error("Failed to check application status:", err);
    }
  };

  // Check if job was accessed from applied jobs and also check application status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isFromApplied = urlParams.get("applied") === "true";

    if (isFromApplied) {
      setApplicationStatus((prev) => ({ ...prev, hasApplied: true }));
    } else if (job && user?._id) {
      checkApplicationStatus();
    }
  }, [job, user]);
  // console.log(job, "job details page job");
  const handleApply = () => {
    if (applicationStatus.hasApplied) {
      toast.info("You have already applied to this job.");
      return;
    }
    if (job?.applicationDeadline && !applicationStatus.hasApplied) {
      const deadline = new Date(job.applicationDeadline);
      if (deadline < now) {
        toast.error("Application deadline has passed for this job.");
        return;
      }
    }
    if (job?.assessment && !hasTakenAssessment) {
      router.push(
        `/student/tests/take-test?assessmentId=${job.assessment._id}`
      );
      return;
    }

    if (!isEligibleByBatchYear) {
      toast.error(
        "You are not eligible for this job based on your batch year."
      );
      return;
    }

    setShowApplicationForm(true);
  };

  const handleApplicationSuccess = (applicationDetails: any) => {
    setShowApplicationForm(false);
    setApplicationStatus({
      hasApplied: true,
      status: "Applied",
      applicationDate: new Date().toISOString(),
      assessmentCompleted: false,
    });

    const successUrl = new URL(
      "/student/jobs/application-success",
      window.location.origin
    );
    successUrl.searchParams.set("jobTitle", job?.jobTitle ?? "");

    const companyName = (() => {
      if (
        typeof job?.companyId === "object" &&
        job?.companyId !== null &&
        "basic" in job.companyId
      ) {
        const company = job.companyId as { basic: { name?: string } };
        return company.basic.name !== undefined
          ? company.basic.name
          : "the company";
      }
      return "the company";
    })();

    successUrl.searchParams.set("companyName", companyName);

    if (applicationDetails.requiresAssessment) {
      successUrl.searchParams.set("requiresAssessment", "true");
      if (applicationDetails.assessmentId) {
        successUrl.searchParams.set(
          "assessmentId",
          applicationDetails.assessmentId
        );
      }
      toast.success(
        `Successfully applied for ${
          job?.jobTitle ?? "the job"
        }! Please complete the assessment.`
      );
    } else {
      toast.success(
        `Successfully applied for ${
          job?.jobTitle ?? "the job"
        } at ${companyName}!`
      );
    }

    router.push(successUrl.toString());
  };
  const hasTakenAssessment = useMemo(() => {
    if (!job?.assessment?.appearedStudents || !user?._id) return false;
    return job.assessment.appearedStudents.some(
      (studentId) => String(studentId) === String(user._id)
    );
  }, [job, user]);

  const getButtonText = useMemo(() => {
    if (job?.applicationDeadline && !applicationStatus.hasApplied) {
      const deadline = new Date(job.applicationDeadline);
      if (deadline < now) {
        return "Application Closed";
      }
    }

    if (
      hasTakenAssessment &&
      applicationStatus.status == "Assessment Completed and Applied"
    ) {
      return "Applied";
    }
    if (
      job?.assessment &&
      applicationStatus.status !== "Applied" &&
      !hasTakenAssessment &&
      applicationStatus.status !== "Assessment Completed and Applied"
    ) {
      return "Apply with Assessment";
    }

    if (applicationStatus.status) {
      switch (applicationStatus.status) {
        case "Applied":
          return "Applied";
        case "Assessment Pending":
          return "Assessment Pending";
        case "Under Review":
          return "Under Review";
        case "Interview Scheduled":
          return "Interview Scheduled";
        case "Selected":
          return "Selected";
        case "Rejected":
          return "Rejected";
        case "Assessment Completed and Applied":
        default:
          return "Apply";
      }
    }

    return "Apply";
  }, [hasTakenAssessment, job?.assessment, applicationStatus.status]);
  const getButtonVariant = () => {
    if (!applicationStatus.hasApplied) return "default";

    switch (applicationStatus.status) {
      case "Selected":
        return "success";
      case "Rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const isButtonDisabled = () => {
    return applicationStatus.hasApplied || !isEligibleByBatchYear;
  };

  const formatSalary = (salaryRange?: { min?: number; max?: number }) => {
    if (
      !salaryRange ||
      salaryRange.min === undefined ||
      salaryRange.max === undefined
    )
      return "Not disclosed";
    if (!salaryRange || (salaryRange.min === 0 && salaryRange.max === 0))
      return "Not disclosed";
    const min =
      salaryRange.min > 1000
        ? salaryRange.min.toLocaleString()
        : `${salaryRange.min}LPA`;
    const max =
      salaryRange.max > 1000
        ? salaryRange.max.toLocaleString()
        : `${salaryRange.max}LPA`;
    return `${min} - ${max}`;
  };

  const getDaysAgo = (date?: string | Date) => {
    if (!date) return "";
    const diff = Math.floor(
      (Date.now() - new Date(date).getTime()) / (1000 * 3600 * 24)
    );
    return diff === 0 ? "Today" : `${diff} Days ago`;
  };

  const getSkillsFromJob = () => {
    if (
      job?.eligibility?.requiredSkills &&
      job.eligibility.requiredSkills.length > 0
    ) {
      return job.eligibility.requiredSkills;
    }
    return ["Not Specified"];
  };

  const formatApplicationDate = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="max-w mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-10 w-10 rounded-md bg-gray-200 animate-pulse"></div>
          <div className="h-6 w-48 bg-gray-200 animate-pulse"></div>
        </div>
        <div className="h-[400px] w-full bg-gray-200 animate-pulse rounded-lg mb-8"></div>
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-40 bg-gray-200 animate-pulse"></div>
          <div className="h-5 w-16 bg-gray-200 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="h-32 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w mx-auto px-1 py-5.5">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="icon"
            className="rounded-md shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">Job Details</h1>
        </div>
        <Alert variant="destructive" className="rounded-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error || "Job not found."}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (showApplicationForm) {
    return (
      <div className="max-w mx-auto px-1 py-5.5">
        <JobApplicationForm
          job={job}
          studentProfile={studentProfile}
          onSuccess={handleApplicationSuccess}
          onCancel={() => setShowApplicationForm(false)}
        />
      </div>
    );
  }

  const companyName = (() => {
    if (job && typeof job.companyId === "object" && job.companyId !== null) {
      // Handle different company data structures
      if ("basic" in job.companyId && job.companyId.basic?.companyName) {
        return job.companyId.basic.companyName;
      } else if ("name" in job.companyId) {
        return job.companyId.name;
      }
    }
    return "Unknown Company";
  })();

  const companyLogo = (() => {
    if (
      typeof job.companyId === "object" &&
      job.companyId !== null &&
      "basic" in job.companyId
    ) {
      const company = job.companyId as { basic: { logo?: string } };
      return company.basic?.logo || null;
    }
    return null;
  })();

  return (
    <div className="max-w mx-auto px-1 py-5.5">
      {/* Back button and title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.push("/student/jobs")}
            variant="outline"
            size="icon"
            className="rounded-md shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">
            {job.jobTitle}
          </h1>
        </div>

        {/* Apply button in top right */}
        {/* <Button
          onClick={handleApply}
          className={`px-6 ${
            applicationStatus.status === "Selected"
              ? "bg-green-600 hover:bg-green-700"
              : applicationStatus.status === "Rejected"
              ? "bg-red-600 hover:bg-red-700"
              : applicationStatus.hasApplied
              ? "bg-gray-500 hover:bg-gray-600"
              : "bg-[#219CAE] hover:bg-[#1a7a8a]"
          } text-white`}
          disabled={isButtonDisabled()}
        >
          {getButtonText()}
        </Button> */}
        <Button
          onClick={handleApply}
          className={`px-6 ${
            applicationStatus.status === "Selected"
              ? "bg-green-600 hover:bg-green-700"
              : applicationStatus.status === "Rejected"
              ? "bg-red-600 hover:bg-red-700"
              : applicationStatus.hasApplied
              ? "bg-gray-500 hover:bg-gray-600"
              : "bg-[#219CAE] hover:bg-[#1a7a8a]"
          } text-white`}
          disabled={isButtonDisabled()}
        >
          {getButtonText}
        </Button>
      </div>

      {/* Status Alerts */}
      {hasTakenAssessment && (
        <Alert
          className={`mb-4 rounded-md ${
            applicationStatus.status === "Selected"
              ? "bg-green-50 border-green-200"
              : applicationStatus.status === "Rejected"
              ? "bg-red-50 border-red-200"
              : "bg-emerald-50 border-emerald-200"
          }`}
        >
          <CheckCircle
            className={`h-4 w-4 ${
              applicationStatus.status === "Selected"
                ? "text-green-600"
                : applicationStatus.status === "Rejected"
                ? "text-red-600"
                : "text-emerald-600"
            }`}
          />
          <AlertTitle
            className={
              applicationStatus.status === "Selected"
                ? "text-green-800"
                : applicationStatus.status === "Rejected"
                ? "text-red-800"
                : "text-emerald-800"
            }
          >
            Application Status:{" "}
            {hasTakenAssessment ? "Assessment Completed" : ""}
          </AlertTitle>
          <AlertDescription
            className={
              applicationStatus.status === "Selected"
                ? "text-green-700"
                : applicationStatus.status === "Rejected"
                ? "text-red-700"
                : "text-emerald-700"
            }
          >
            {applicationStatus.status === "Selected" &&
              "Congratulations! You have been selected for this position."}
            {applicationStatus.status === "Rejected" &&
              "Unfortunately, your application was not successful this time."}
            {applicationStatus.status === "Applied" &&
              "Your application has been submitted successfully."}
            {applicationStatus.status === "Assessment Pending" &&
              "Please complete the required assessment."}
            {applicationStatus.status === "Under Review" &&
              "Your application is currently under review."}
            {applicationStatus.status === "Interview Scheduled" &&
              "An interview has been scheduled for you."}
            {applicationStatus.applicationDate && (
              <span className="block mt-1 text-sm">
                Applied on:{" "}
                {formatApplicationDate(applicationStatus.applicationDate)}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {!isEligibleByBatchYear && (
        <Alert variant="destructive" className="mb-4 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Eligibility Check</AlertTitle>
          <AlertDescription>
            This job requires batch year(s):{" "}
            {job.eligibility?.graduationYears?.join(", ")}. Your batch year is{" "}
            {studentActualBatchYear || "not specified"}. You may not be
            eligible.
          </AlertDescription>
        </Alert>
      )}

      {job.assessment && (
        <Alert className="mb-4 bg-blue-50 border-blue-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Assessment Required</AlertTitle>
          <AlertDescription className="text-blue-700">
            This job requires an assessment.
            {job.assessment.description && (
              <p className="mt-1 text-sm">{job.assessment.description}</p>
            )}
            {applicationStatus.hasApplied &&
              applicationStatus.status === "Assessment Pending" && (
                <p className="mt-2 text-sm font-medium">
                  ⚠️ You need to complete the assessment to proceed with your
                  application.
                </p>
              )}
          </AlertDescription>
        </Alert>
      )}

      {/* Main job card */}
      <div className="bg-white rounded-lg border shadow-xl mb-8 relative">
        {/* Company info */}
        <div className="p-2">
          <div className="flex flex-wrap gap-9.5">
            <div className="flex">
              <div className="pr-2">
                <div className="bg-black rounded-lg w-16 h-16 flex items-center justify-center">
                  {companyLogo ? (
                    <Image
                      src={companyLogo || "/placeholder.svg?height=64&width=64"}
                      alt={`${companyName} logo`}
                      width={64}
                      height={64}
                      className="rounded-lg"
                    />
                  ) : (
                    <span className="text-white font-bold text-lg">
                      {String(companyName).substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div>
                  <h2 className="text-gray-700 font-semibold uppercase mt-2">
                    {String(companyName)}
                  </h2>
                  <div className="flex items-center gap-1 text-gray-600 mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-700"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>
                      {job.location?.join(", ") || "Vijay Nagar, Indore"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x md:divide-dashed md:divide-[#219CAE] items-start md:items-center md:pl-7 mt-4 md:mt-0">
              <div className="px-0 md:px-8">
                <h3 className="text-gray-700 font-semibold">Time Period</h3>
                <p className="text-gray-600">{job.jobType}</p>
              </div>
              <div className="px-0 md:px-8">
                <h3 className="text-gray-700 font-semibold">Seniority Level</h3>
                <p className="text-gray-600">
                  {job.roleLevel || "Medium Level"}
                </p>
              </div>
              <div className="px-0 md:px-8">
                <h3 className="text-gray-700 font-semibold">Salary</h3>
                <p className="text-gray-600">{formatSalary(job.salaryRange)}</p>
              </div>
              <div className="px-0 md:px-8">
                <h3 className="text-gray-700 font-semibold">Job Posted</h3>
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                  <p className="text-gray-600">{getDaysAgo(job.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Job details grid */}
          <div className="w-full border-t border-dashed border-cyan-500 my-6"></div>

          {/* Job description */}
          <div className="mt-6">
            <h3 className="text-gray-700 font-semibold mb-2">
              Job Description
            </h3>
            <div className="bg-white rounded-lg p-4 max-h-[200px] overflow-y-auto border">
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {job.jobDescription}
              </p>
            </div>
          </div>

          {/* Eligibility Criteria */}
          {job.eligibility && (
            <div className="mt-6">
              <h3 className="text-gray-700 font-semibold mb-2">
                Eligibility Criteria
              </h3>
              <div className="text-gray-600 text-sm leading-relaxed">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                  {job.eligibility.minEducationLevel && (
                    <p>
                      <strong>Min. Education:</strong>{" "}
                      {job.eligibility.minEducationLevel}
                    </p>
                  )}
                  {job.eligibility.allowedDegrees &&
                    job.eligibility.allowedDegrees.length > 0 && (
                      <p>
                        <strong>Degrees:</strong>{" "}
                        {job.eligibility.allowedDegrees.join(", ")}
                      </p>
                    )}
                  {job.eligibility.graduationYears &&
                    job.eligibility.graduationYears.length > 0 && (
                      <p>
                        <strong>Batch Years:</strong>{" "}
                        {job.eligibility.graduationYears.join(", ")}
                      </p>
                    )}
                  {job.eligibility.minPercentage && (
                    <p>
                      <strong>Minimum Percentage/CGPA:</strong>{" "}
                      {job.eligibility.minPercentage}{" "}
                      {job.eligibility.minPercentage > 10 ? "%" : "CGPA"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="mt-6">
              <h3 className="text-gray-700 font-semibold mb-2">
                Benefits & Perks
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 text-sm">
                {job.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          <div className="mt-6">
            <h3 className="text-gray-700 font-semibold mb-2">
              Required Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {getSkillsFromJob().map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className={`rounded-md py-1.5 px-4 ${
                    index % 2 === 0 ? "bg-green-50" : "bg-blue-50"
                  }`}
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Similar Jobs Section */}
      <div className="mt-8">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Similar Jobs</h2>
          <Button
            variant="link"
            className="text-[#219CAE] hover:text-[#1a7a8a] underline font-medium"
            onClick={() => router.push("/student/jobs")}
          >
            View All Jobs
          </Button>
        </div>

        {relatedJobsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-lg border shadow-sm p-4 animate-pulse"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : relatedJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedJobs.map((relatedJob) => (
              <JobCard
                key={relatedJob._id}
                job={relatedJob}
                detailsLink={`/student/jobs/job-details?id=${relatedJob._id}`}
                userRole="student"
                showBatchInfo={false}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-gray-500 mb-2">
              <svg
                className="w-12 h-12 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Similar Jobs Found
            </h3>
            <p className="text-gray-500 mb-4">
              We could not find any similar jobs at the moment.
            </p>
            <Button
              onClick={() => router.push("/student/jobs")}
              className="bg-[#219CAE] hover:bg-[#1a7a8a] text-white"
            >
              Browse All Jobs
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
