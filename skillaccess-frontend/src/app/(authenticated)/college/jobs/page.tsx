"use client";
import { useState, useEffect } from "react";
import type { IJob } from "@/types/job";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import { getCookie } from "@/utils/getCookie";
import { AlertCircle, Briefcase, Settings, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/pagination";
import JobCard, { JobCardSkeleton } from "@/components/job-card";

interface JobWithApproval extends IJob {
  collegeApprovalStatus?: "pending" | "approved" | "rejected";
  allowedBatches?: number[];
}

export default function CollegeJobsListing() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const [jobs, setJobs] = useState<JobWithApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [pendingCount, setPendingCount] = useState(0);
  const [totalJobs, setTotalJobs] = useState(0);

  // Fetch jobs for this college using the new authenticated endpoint
  const fetchJobs = async (page = 1) => {
    setLoading(true);
    try {
      const token = getCookie("jwt");

      if (!token) {
        toast.error("Session expired. Please log in again.");
        return;
      }

      // Use the new authenticated endpoint
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/college/jobs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to fetch jobs (Status: ${res.status})`
        );
      }

      const data = await res.json();
      console.log("College Jobs API Response:", data);

      if (data.success && Array.isArray(data.jobs)) {
        // Filter only approved jobs for this page
        const approvedJobs = data.jobs.filter(
          (job: JobWithApproval) => job.collegeApprovalStatus === "approved"
        );

        setJobs(approvedJobs);
        setTotalJobs(approvedJobs.length);

        // Count pending jobs
        const pendingJobsCount = data.jobs.filter(
          (job: JobWithApproval) => job.collegeApprovalStatus === "pending"
        ).length;

        setPendingCount(pendingJobsCount);

        if (approvedJobs.length > 0) {
          //toast.success(`Found ${approvedJobs.length} approved jobs.`)
        } else {
          toast.info(
            "No approved jobs available for your college at the moment."
          );
        }
      } else {
        setJobs([]);
        setTotalJobs(0);
        toast.info(data.message || "No approved jobs available.");
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred.";
      toast.error(errorMessage);
      setJobs([]);
      setTotalJobs(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user._id) {
      fetchJobs(activePage);
    }
  }, [user, activePage]);

  // Add a function to refresh jobs when returning from management page
  useEffect(() => {
    const handleFocus = () => {
      if (user && user._id) {
        fetchJobs(activePage);
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [user, activePage]);

  const handlePageChange = (page: number) => {
    setActivePage(page);
  };

  const handleManageEligibility = () => {
    router.push("/college/jobs/manage-eligibility");
  };

  // Get paginated data (same as companies page)
  const paginatedJobs = jobs.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  return (
    <div className="p-0 flex flex-col min-h-[90vh]">
      <div className="flex flex-1 flex-col">
        {/* Header - Same structure as companies page */}
        <div className="flex flex-col sm:flex-row justify-between items-center mt-2.5 mb-6 gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">
            Approved Jobs ({totalJobs})
          </h1>

          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <Badge variant="destructive" className=" w-63 h-9">
                {pendingCount} Pending Approval
              </Badge>
            )}
            <Button
              onClick={handleManageEligibility}
              className="bg-[#219CAE] hover:bg-[#1a7a8a] text-white flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Manage Job Eligibility
              {pendingCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-white text-[#219CAE]"
                >
                  {pendingCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {pendingCount > 0 && (
          <Alert className="mb-6 bg-orange-50 border-orange-200 text-orange-800">
            <div className="flex items-center space-x-2 whitespace-nowrap">
              <Clock className="h-4 w-4 shrink-0" />
              <span className="flex items-center space-x-1 text-sm">
                <span>
                  You have <strong>{pendingCount}</strong> job
                  {pendingCount !== 1 ? "s" : ""} pending approval.
                </span>
                <Button
                  variant="link"
                  className="p-0 text-orange-800 underline h-auto"
                  onClick={handleManageEligibility}
                >
                  Review them now
                </Button>
              </span>
            </div>
          </Alert>
        )}

        <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only jobs that you have approved will appear here. To approve new
            jobs, use the Manage Job Eligibility button above.
          </AlertDescription>
        </Alert>

        {/* Content - Same structure as companies page */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <JobCardSkeleton key={index} />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Briefcase className="h-16 w-16 text-gray-300 mb-4" />
            <div className="text-gray-500 text-lg mb-2">
              No approved jobs found
            </div>
            <div className="text-gray-400 text-sm text-center">
              You have not approved any jobs yet. Jobs will appear here after
              you approve them.
            </div>
            <div className="text-gray-400 text-xs mt-2">
              Total jobs processed: {jobs.length}
            </div>
          </div>
        ) : (
          <>
            {/* Job Cards Grid - Same grid as companies page */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-1">
              {paginatedJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  detailsLink="/college/jobs/job-details"
                  detailsLinkText="View Details"
                  colors={{
                    primary: "#219CAE",
                    secondary: "#F68622",
                    badge1: "bg-green-50 border-green-100 text-green-700",
                    badge2: "bg-blue-50 border-blue-100 text-blue-700",
                  }}
                  userRole="college"
                  showBatchInfo={false}
                  showActions={false}
                />
              ))}
            </div>

            {/* Pagination - Same as companies page */}
            <div className="mt-auto">
              <Pagination
                currentPage={activePage}
                totalItems={totalJobs}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
                className="mt-6"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
