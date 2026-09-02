"use client";
import { useState, useEffect, useMemo } from "react";
import type { IJob } from "@/types/job";
import { Pagination } from "@/components/pagination";
import JobFilters, { type FilterState } from "@/components/job-filters";
import { useAuthStore } from "@/stores/auth-store";
import { toast } from "sonner";
import JobCard, { JobCardSkeleton } from "@/components/job-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { getCookie } from "@/utils/getCookie";

export default function CompanyJobsListing() {
  const user = useAuthStore((state) => state.user);
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage] = useState(4);
  const [favoriteJobs, setFavoriteJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    employmentType: {
      fullTime: false,
      partTime: false,
    },
    locations: {
      indore: false,
      bhopal: false,
      mumbai: false,
      delhi: false,
      pune: false,
    },
    seniorityLevel: {
      entry: false,
      medium: false,
      senior: false,
    },
    salaryRange: [10000, 10000000],
  });

  const fetchJobs = async () => {
    setLoading(true);
    const token = getCookie("jwt");

    try {
      // First try to get all jobs
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/company`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) toast.error("Failed to fetch jobs");
      const data = await res.json();

      console.log("API Response:", data);

      // Get all jobs from the response
      const allJobs = data.jobs.reverse() || [];

      // For debugging, log all jobs
      console.log(`Found ${allJobs.length} total jobs`);

      // IMPORTANT: Don't filter by company for now - show all jobs
      // This will help us see if the jobs are actually being returned
      setJobs(allJobs);

      // Later we can re-enable company filtering once we confirm jobs are showing
      /*
      // Filter jobs for the current company
      const companyJobs = allJobs.filter((job: any) => {
        // Handle different companyId formats
        const jobCompanyId = typeof job.companyId === "object" && job.companyId?._id 
          ? job.companyId._id 
          : job.companyId;
          
        return jobCompanyId === user?._id;
      });
      
      setJobs(companyJobs);
      */
    } catch (error) {
      console.error("Error fetching jobs:", error);
      toast.error("Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchJobs();
    }
  }, [user?._id]);

  // Filter jobs based on search query and filters
  const filteredJobs = useMemo(() => {
    let filtered = [...jobs];

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (job) =>
          job.jobTitle?.toLowerCase().includes(query) ||
          job.jobDescription?.toLowerCase().includes(query) ||
          job.location?.some((loc) => loc.toLowerCase().includes(query)) ||
          job.department?.toLowerCase().includes(query)
      );
    }

    // Apply employment type filter (jobType in API)
    const selectedEmploymentTypes = Object.entries(filters.employmentType)
      .filter(([_, isSelected]) => isSelected)
      .map(([type, _]) => type);

    if (selectedEmploymentTypes.length > 0) {
      filtered = filtered.filter((job) => {
        const jobType = job.jobType?.toLowerCase();
        return selectedEmploymentTypes.some((type) => {
          if (type === "fullTime") return jobType === "full-time";
          if (type === "partTime")
            return jobType === "internship" || jobType === "part-time";
          return false;
        });
      });
    }

    // Apply location filter
    const selectedLocations = Object.entries(filters.locations)
      .filter(([_, isSelected]) => isSelected)
      .map(([location, _]) => location.toLowerCase());

    if (selectedLocations.length > 0) {
      filtered = filtered.filter((job) => {
        return job.location?.some((jobLocation) =>
          selectedLocations.some((filterLocation) =>
            jobLocation.toLowerCase().includes(filterLocation)
          )
        );
      });
    }

    // Apply seniority level filter (roleLevel in API)
    const selectedSeniorityLevels = Object.entries(filters.seniorityLevel)
      .filter(([_, isSelected]) => isSelected)
      .map(([level, _]) => level);

    if (selectedSeniorityLevels.length > 0) {
      filtered = filtered.filter((job) => {
        const jobLevel = job.roleLevel?.toLowerCase();
        return selectedSeniorityLevels.some((level) => {
          if (level === "entry") return jobLevel === "entry";
          if (level === "medium") return jobLevel === "mid";
          if (level === "senior") return jobLevel === "senior";
          return false;
        });
      });
    }

    // Apply salary range filter
    const [minSalary, maxSalary] = filters.salaryRange;
    if (minSalary > 10000 || maxSalary < 10000000) {
      filtered = filtered.filter((job) => {
        if (job.salaryRange?.min && job.salaryRange?.max) {
          // API stores in lakhs, convert to rupees for comparison
          const jobMinSalary = job.salaryRange.min * 100000;
          const jobMaxSalary = job.salaryRange.max * 100000;

          // Check if job salary range overlaps with filter range
          return jobMinSalary <= maxSalary && jobMaxSalary >= minSalary;
        }
        return true; // Include jobs without salary info
      });
    }

    return filtered;
  }, [jobs, searchQuery, filters]);

  // Reset to first page when filters change
  useEffect(() => {
    setActivePage(1);
  }, [searchQuery, filters]);

  const handleDeleteSuccess = () => {
    // Refresh the jobs list after successful deletion
    fetchJobs();
  };

  // Get paginated data from the filtered jobs array
  const paginatedActive = filteredJobs.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  return (
    <div className="p-0 flex flex-col relative min-h-[90vh]">
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center mt-2.5 mb-1 gap-2">
          <h1 className="text-xl sm:text-2xl relative font-semibold text-gray-800 -mt-3">
            All Listed Jobs
          </h1>
          <div className="flex items-baseline gap-4">
            <Link href="/company/jobs/create">
              <Button className="flex bg-[#219CAE] text-white hover:bg-[#219CAE]">
                <PlusIcon className=" h-4 w-4" />
                Add New Job
              </Button>
            </Link>
            <JobFilters
              filters={filters}
              searchQuery={searchQuery}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              setSearchQuery={setSearchQuery}
              setFilters={setFilters}
            />
          </div>
        </div>

        {/* Show filter summary */}
        {(searchQuery ||
          Object.values(filters.employmentType).some(Boolean) ||
          Object.values(filters.locations).some(Boolean) ||
          Object.values(filters.seniorityLevel).some(Boolean) ||
          filters.salaryRange[0] > 10000 ||
          filters.salaryRange[1] < 10000000) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-blue-800">
                Showing {filteredJobs.length} of {jobs.length} jobs
                {searchQuery && (
                  <span className="ml-1">for &quot;{searchQuery}&quot;</span>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilters({
                    employmentType: { fullTime: false, partTime: false },
                    locations: {
                      indore: false,
                      bhopal: false,
                      mumbai: false,
                      delhi: false,
                      pune: false,
                    },
                    seniorityLevel: {
                      entry: false,
                      medium: false,
                      senior: false,
                    },
                    salaryRange: [10000, 10000000],
                  });
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <JobCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-gray-400 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {jobs.length === 0
                ? "No jobs found"
                : "No jobs match your filters"}
            </h3>
            <p className="text-gray-500 mt-1">
              {jobs.length === 0
                ? "You haven't created any job postings yet."
                : "Try adjusting your search criteria or clearing some filters."}
            </p>
            {jobs.length === 0 ? (
              <button
                onClick={() => (window.location.href = "/company/jobs/create")}
                className="mt-4 bg-[#219CAE] hover:bg-[#1a7f8e] text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create Your First Job
              </button>
            ) : (
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setFilters({
                    employmentType: { fullTime: false, partTime: false },
                    locations: {
                      indore: false,
                      bhopal: false,
                      mumbai: false,
                      delhi: false,
                      pune: false,
                    },
                    seniorityLevel: {
                      entry: false,
                      medium: false,
                      senior: false,
                    },
                    salaryRange: [10000, 10000000],
                  });
                }}
                className="mt-4 bg-[#219CAE] hover:bg-[#1a7f8e] text-white"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-1">
            {paginatedActive.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                detailsLink={`/company/jobs/company-job-details/${job._id}`}
                colors={{
                  primary: "#219CAE",
                  secondary: "#F68622",
                  badge1: "bg-green-50 border-green-100",
                  badge2: "bg-blue-50 border-blue-100",
                }}
                showActions={true}
                onDeleteSuccess={handleDeleteSuccess}
                showBatchInfo={false}
              />
            ))}
          </div>
        )}

        {filteredJobs.length > 0 && (
          <div className="mt-auto">
            <Pagination
              currentPage={activePage}
              totalItems={filteredJobs.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setActivePage}
              className="mt-6"
            />
          </div>
        )}
      </div>
    </div>
  );
}
