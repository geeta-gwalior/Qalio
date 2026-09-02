"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/pagination";
import JobCard, { JobCardSkeleton } from "@/components/job-card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Briefcase, Filter, RefreshCw, Info } from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "@/utils/getCookie";
import type { IJob } from "@/types/job";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/auth-store";

interface JobFromAPI extends IJob {
  studentBatchYear?: number;
  batchEligible?: boolean;
  eligibleBatches?: number[];
  applicationStatus?: string;
  applicationDate?: string;
  _isAppliedJob?: boolean;
}

interface StudentProfile {
  _id: string;
  userId: string;
  batch: string;
  education: Array<{
    institutionName: string;
    degree: string;
    fieldOfStudy: string;
    yearOfPassing?: number;
    percentage?: number;
    cgpa?: number;
  }>;
}

export default function StudentJobsListing() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null
  );
  const [jobs, setJobs] = useState<JobFromAPI[]>([]);
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [selectedBatchYear, setSelectedBatchYear] = useState<string>("all");
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);
  const [showAppliedOnly, setShowAppliedOnly] = useState(false);
  const [appliedJobsData, setAppliedJobsData] = useState<any[]>([]);

  // Get student profile and jobs
  useEffect(() => {
    const initializeData = async () => {
      try {
        const token = getCookie("jwt");
        //    console.log("Token found:", !!token);

        if (!token) {
          // console.error("No JWT token found");
          setError("Authentication required. Please log in.");
          setLoading(false);
          return;
        }

        // Try multiple approaches to get jobs
        await fetchAllJobsApproaches(token);

        // Also try to get student profile
        if (user && user._id) {
          await fetchStudentProfile(token);
          await fetchAppliedJobs(token); // Add this line
        }
      } catch (error) {
        // console.error("Failed to initialize data:", error);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, [user]);

  const fetchStudentProfile = async (token: string) => {
    try {
      const profileResponse = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/profile-completion-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // console.log("Profile response status:", profileResponse.status);

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        //    console.log("Profile data received:", profileData);

        if (profileData.success) {
          setStudentProfile(profileData.student);
        }
      } else {
        console.warn(
          "Failed to fetch student profile:",
          profileResponse.status
        );
      }
    } catch (profileError) {
      console.error("Error fetching student profile:", profileError);
    }
  };

  // Update the fetchAppliedJobs function to store full application data
  const fetchAppliedJobs = async (token: string) => {
    try {
      if (!user?._id) {
        console.log("No user ID available");
        return;
      }

      // Try using the user._id directly first (this is the userId from auth)
      let applicationsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/student/${user._id}/applications`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // console.log(
      //   "Applications response status (user._id):",
      //   applicationsResponse.status
      // );

      // If that fails, try getting the student profile first
      if (!applicationsResponse.ok) {
        console.log(
          "Direct user ID failed, trying to get student profile first..."
        );

        const profileResponse = await fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          //   console.log("Student profile data:", profileData);

          if (profileData.success && profileData.student) {
            const studentId = profileData.student._id;
            //    console.log("Using student._id:", studentId);

            // Try with the student._id from profile
            applicationsResponse = await fetch(
              `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/student/${user._id}/applications`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            // console.log(
            //   "Applications response status (student._id):",
            //   applicationsResponse.status
            // );
          }
        }
      }

      if (applicationsResponse.ok) {
        const applicationsData = await applicationsResponse.json();
        // console.log("Applications data:", applicationsData);

        if (
          applicationsData.success &&
          Array.isArray(applicationsData.applications)
        ) {
          // Store full applications data
          setAppliedJobsData(applicationsData.applications);

          const appliedJobIds = applicationsData.applications.map(
            (app: any) => {
              // Handle both object and string jobId formats
              const jobId =
                typeof app.jobId === "object" ? app.jobId._id : app.jobId;
              //   console.log("Application job ID:", jobId);
              return jobId;
            }
          );

          // console.log("Applied job IDs:", appliedJobIds);
          setAppliedJobs(appliedJobIds);

          // Show success message
          if (appliedJobIds.length > 0) {
            // toast.success(`Found ${appliedJobIds.length} applied job(s)`);
            // If we have applied jobs, default to showing them
            // if (!showAppliedOnly) {
            //   setShowAppliedOnly(true);
            // }
          }
        }
      } else {
        const errorData = await applicationsResponse.json().catch(() => ({}));
        // console.log("Failed to fetch applications:", errorData);

        toast.error(
          `Failed to load applied jobs: ${errorData.message || "Unknown error"}`
        );
      }
    } catch (error) {
      // console.error("Error fetching applied jobs:", error);
      toast.error("Error loading applied jobs");
    }
  };

  const fetchAllJobsApproaches = async (token: string) => {
    let jobsFound = false;
    const debugMessages: string[] = [];

    // Approach 1: Try student-specific endpoint if we have user ID
    if (user && user._id) {
      try {
        debugMessages.push(
          `Trying student-specific endpoint for user: ${user._id}`
        );
        //  console.log("Fetching jobs for student:", user._id);

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/student/${user._id}/available`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        // console.log("Student jobs API response status:", response.status);
        const data = await response.json();
        //   console.log("Student Jobs API Response:", data);

        if (
          response.ok &&
          data.success &&
          Array.isArray(data.jobs) &&
          data.jobs.length > 0
        ) {
          const validJobs = data.jobs.filter((job: any) => job && job._id);
          setJobs((validJobs as JobFromAPI[]).reverse());
          debugMessages.push(
            `✅ Found ${validJobs.length} student-specific jobs`
          );
          // toast.success(`Found ${validJobs.length} personalized jobs.`);
          jobsFound = true;
        } else {
          debugMessages.push(
            `❌ Student-specific endpoint: ${data.message || "No jobs found"}`
          );
        }
      } catch (err: any) {
        debugMessages.push(
          `❌ Student-specific endpoint error: ${err.message}`
        );
        console.error("Error fetching student-specific jobs:", err);
      }
    }

    // Approach 2: Try public jobs endpoint
    if (!jobsFound) {
      try {
        debugMessages.push("Trying public jobs endpoint...");
        // console.log("Fetching public jobs...");

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/public`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        //   console.log("Public jobs response status:", response.status);
        const data = await response.json();
        //  console.log("Public jobs response:", data);

        if (response.ok && data.success) {
          if (Array.isArray(data.jobs) && data.jobs.length > 0) {
            setJobs(data.jobs);
            debugMessages.push(`✅ Found ${data.jobs.length} public jobs`);
            toast.info(`Showing ${data.jobs.length} public jobs.`);
            jobsFound = true;
          } else {
            debugMessages.push("❌ Public jobs endpoint returned empty array");
          }
        } else {
          debugMessages.push(
            `❌ Public jobs endpoint failed: ${data.message || "Unknown error"}`
          );
        }
      } catch (err: any) {
        debugMessages.push(`❌ Public jobs endpoint error: ${err.message}`);
        toast.error("Error fetching public jobs:" + err);
      }
    }

    // Approach 3: Try getting all jobs (fallback)
    // if (!jobsFound) {
    //   try {
    //     debugMessages.push("Trying all jobs endpoint as fallback...");
    //     //   console.log("Fetching all jobs as fallback...");

    //     const response = await fetch(
    //       `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs`,
    //       {
    //         headers: {
    //           Authorization: `Bearer ${token}`,
    //           "Content-Type": "application/json",
    //         },
    //       }
    //     );

    //     // console.log("All jobs response status:", response.status);
    //     const data = await response.json();
    //     //  console.log("All jobs response:", data);

    //     if (response.ok && data.success && Array.isArray(data.jobs)) {
    //       // Filter for published jobs with future deadlines
    //       const availableJobs = data.jobs.filter((job: any) => {
    //         const hasValidDeadline =
    //           job.applicationDeadline &&
    //           new Date(job.applicationDeadline) >= new Date();
    //         const isPublished =
    //           job.publishing?.status === "Published" || !job.publishing?.status;
    //         return hasValidDeadline && isPublished;
    //       });

    //       if (availableJobs.length > 0) {
    //         setJobs(availableJobs);
    //         debugMessages.push(
    //           `✅ Found ${availableJobs.length} available jobs from all jobs`
    //         );
    //         toast.info(`Showing ${availableJobs.length} available jobs.`);
    //         jobsFound = true;
    //       } else {
    //         debugMessages.push(
    //           `❌ No available jobs found (${data.jobs.length} total jobs, but none are published/available)`
    //         );
    //       }
    //     } else {
    //       debugMessages.push(
    //         `❌ All jobs endpoint failed: ${data.message || "Unknown error"}`
    //       );
    //     }
    //   } catch (err: any) {
    //     debugMessages.push(`❌ All jobs endpoint error: ${err.message}`);
    //     console.error("Error fetching all jobs:", err);
    //   }
    // }

    // Set debug info and final state
    setDebugInfo(debugMessages.join("\n"));

    if (!jobsFound) {
      setJobs([]);
      setError(
        "No jobs are currently available. This could be because:\n• No jobs are published\n• All job deadlines have passed\n• There are database configuration issues"
      );
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setError(null);
    setDebugInfo("");

    const token = getCookie("jwt");
    if (!token) {
      setError("Authentication required. Please log in.");
      setLoading(false);
      return;
    }

    Promise.all([
      fetchAllJobsApproaches(token),
      user?._id ? fetchAppliedJobs(token) : Promise.resolve(),
    ]).finally(() => {
      setLoading(false);
    });
  };

  // Get student batch year directly from batch field
  const studentActualBatchYear = useMemo(() => {
    if (studentProfile?.batch) {
      const batchYear = Number.parseInt(studentProfile.batch, 10);
      return isNaN(batchYear) ? null : batchYear;
    }
    return null;
  }, [studentProfile]);

  // Get available batch years from jobs
  const availableBatchYears = useMemo(() => {
    const years = new Set<number>();
    jobs.forEach((job) => {
      if (job.eligibleBatches && job.eligibleBatches.length > 0) {
        job.eligibleBatches.forEach((year) => years.add(year));
      } else if (
        job.eligibility?.graduationYears &&
        job.eligibility.graduationYears.length > 0
      ) {
        job.eligibility.graduationYears.forEach((year) => years.add(year));
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [jobs]);

  // Filter jobs by batch year and applied status
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    // Filter by applied status FIRST
    if (showAppliedOnly) {
      // Convert applied jobs data to job format for display
      const appliedJobsForDisplay = appliedJobsData
        .map((application: any) => {
          const jobData = application.job;
          if (jobData) {
            return {
              ...jobData,
              applicationStatus: application.status,
              applicationDate: application.applicationDate,
              _isAppliedJob: true,
            };
          }
          return null;
        })
        .filter(Boolean) as JobFromAPI[];

      filtered = appliedJobsForDisplay;
    }

    // Then filter by batch year (only if not showing applied jobs)
    if (selectedBatchYear !== "all" && !showAppliedOnly) {
      const yearToFilter = Number.parseInt(selectedBatchYear, 10);
      filtered = filtered.filter((job) => {
        if (job.eligibleBatches && job.eligibleBatches.length > 0) {
          return job.eligibleBatches.includes(yearToFilter);
        }
        if (
          job.eligibility?.graduationYears &&
          job.eligibility.graduationYears.length > 0
        ) {
          return job.eligibility.graduationYears.includes(yearToFilter);
        }
        return true; // Show jobs with no batch restrictions
      });
    }

    return filtered;
  }, [jobs, selectedBatchYear, showAppliedOnly, appliedJobs, appliedJobsData]);

  const paginatedJobs = filteredJobs.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  // Check if a job has been applied to
  const isJobApplied = (jobId: string) => {
    return appliedJobs.some((appliedId) => appliedId === jobId);
  };

  // if (error) {
  //   return (
  //     <div className="p-4 flex flex-col items-center justify-center min-h-[80vh]">
  //       <Alert variant="destructive" className="max-w-2xl mb-4">
  //         <AlertCircle className="h-4 w-4" />
  //         <AlertDescription className="whitespace-pre-line">
  //           {error}
  //         </AlertDescription>
  //       </Alert>

  //       <Button onClick={handleRefresh} className="mt-4">
  //         <RefreshCw className="h-4 w-4 mr-2" />
  //         Try Again
  //       </Button>
  //     </div>
  //   );
  // }

  return (
    <div className="flex flex-col relative min-h-[90vh] bg-gradient-to-br from-gray-50 to-white">
      <div className="flex flex-1 flex-col">
        {/* Enhanced Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Available Jobs
            </h1>
            <p className="text-lg text-gray-600">
              {filteredJobs.length}{" "}
              {filteredJobs.length === 1 ? "opportunity" : "opportunities"}{" "}
              waiting for you
              {appliedJobs.length > 0 && (
                <span className="text-green-600 ml-2">
                  • {appliedJobs.length} applied
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Applied Jobs Filter */}
            <Button
              variant={showAppliedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAppliedOnly(!showAppliedOnly)}
              className={`${
                showAppliedOnly
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-white shadow-sm border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    showAppliedOnly ? "bg-white" : "bg-green-500"
                  }`}
                ></div>
                Applied ({appliedJobs.length})
              </div>
            </Button>

            {availableBatchYears.length > 0 && (
              <Select
                value={selectedBatchYear}
                onValueChange={setSelectedBatchYear}
              >
                <SelectTrigger className="w-[200px] bg-white shadow-sm border-gray-300">
                  <Filter className="h-4 w-4 mr-2 text-[#4AA3B1]" />
                  <SelectValue placeholder="Filter by Batch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  {availableBatchYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                      {studentActualBatchYear === year && " (Your Batch)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="icon"
              className="h-11 w-11 bg-white shadow-sm border-gray-300 hover:bg-gray-50"
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 text-[#4AA3B1] ${
                  loading ? "animate-spin" : ""
                }`}
              />
            </Button>
          </div>
        </div>

        {/* Batch year mismatch warning */}
        {studentActualBatchYear &&
          selectedBatchYear !== "all" &&
          Number.parseInt(selectedBatchYear) !== studentActualBatchYear && (
            <Alert
              variant="default"
              className="mb-6 bg-yellow-50 border-yellow-200 text-yellow-700"
            >
              <AlertCircle className="h-4 w-4 !text-yellow-700" />
              <AlertDescription>
                You are viewing jobs for batch {selectedBatchYear}. Your batch
                year is {studentActualBatchYear}.
              </AlertDescription>
            </Alert>
          )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {Array.from({ length: itemsPerPage }).map((_, index) => (
              <JobCardSkeleton key={index} />
            ))}
          </div>
        ) : paginatedJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center flex-grow">
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-8 mb-6">
              <Briefcase className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              {showAppliedOnly ? "No Applied Jobs Found" : "No Jobs Found"}
            </h3>
            <p className="text-gray-500 text-lg mb-6 max-w-md">
              {showAppliedOnly
                ? "You haven't applied to any jobs yet. Start browsing and applying!"
                : selectedBatchYear === "all"
                ? "No jobs are currently available that match your profile."
                : `No jobs found for batch ${selectedBatchYear}. Try selecting "All Batches".`}
            </p>
            {showAppliedOnly ? (
              <Button
                onClick={() => setShowAppliedOnly(false)}
                className="mb-4 bg-[#4AA3B1] hover:bg-[#3A8391] text-white px-8 py-3 text-lg"
              >
                Browse All Jobs
              </Button>
            ) : selectedBatchYear !== "all" ? (
              <Button
                variant="link"
                onClick={() => setSelectedBatchYear("all")}
                className="mb-4 text-[#4AA3B1] hover:text-[#3A8391]"
              >
                Show all jobs
              </Button>
            ) : null}
            <Button
              onClick={handleRefresh}
              className="bg-[#4AA3B1] hover:bg-[#3A8391] text-white px-8 py-3 text-lg"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh Jobs
            </Button>
          </div>
        ) : (
          <>
            {/* Enhanced Job Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mb-8">
              {paginatedJobs.map((job) => {
                const hasApplied = isJobApplied(job._id);
                return (
                  <div
                    key={job._id}
                    className={`  relative ${
                      hasApplied ? "ring-2 ring-green-200" : ""
                    }`}
                    onClick={() => {
                      const detailsUrl = `/student/jobs/job-details?id=${job._id}`;
                      const urlWithParams = hasApplied
                        ? `${detailsUrl}&applied=true`
                        : detailsUrl;
                      router.push(urlWithParams);
                    }}
                  >
                    {hasApplied && (
                      <div className="absolute top-3 right-3 z-10 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Applied - Pending
                      </div>
                    )}
                    <JobCard
                      job={job}
                      showBatchInfo={false}
                      userRole="student"
                      className={`h-full border-0 shadow-lg ${
                        hasApplied ? "bg-green-50/50" : ""
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Enhanced Pagination */}
            {filteredJobs.length > itemsPerPage && (
              <div className="mt-auto flex justify-center pt-8">
                <div className="bg-white  p-4">
                  <Pagination
                    currentPage={activePage}
                    totalItems={filteredJobs.length}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setActivePage}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
