"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, MapPin, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import JobCard from "@/components/job-card";
import { getCookie } from "@/utils/getCookie";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";
import type { IJob } from "@/types/job";

interface Company {
  _id: string;
  name: string;
  industry: string;
  location: string[];
  website?: string;
  description?: string;
  avatar?: {
    url: string;
  };
}

export default function CollegeJobDetails() {
  const [bookmarked, setBookmarked] = useState(false);
  const [job, setJob] = useState<IJob | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("id");

  // Fetch job details
  const fetchJobDetails = async (jobId: string) => {
    try {
      const token = getCookie("jwt");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      console.log("Fetching job details for:", jobId);
      // Fixed: Removed /api prefix from jobs endpoint
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/${jobId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch job details");
      }

      const data = await response.json();
      console.log("Job details response:", data);

      if (data.success && data.job) {
        setJob(data.job);

        // If job has company info populated, use it
        if (
          data.job.companyId &&
          typeof data.job.companyId === "object" &&
          data.job.companyId !== null
        ) {
          console.log("Using populated company data:", data.job.companyId);
          const companyData = data.job.companyId;
          setCompany({
            _id: companyData._id,
            name:
              companyData?.name || companyData.companyName || "Unknown Company",
            industry:
              companyData.basic?.industry ||
              companyData.industry ||
              "Technology",
            location: companyData.basic?.location ||
              companyData.location || ["Location not specified"],
            website: companyData.basic?.website || companyData.website,
            description:
              companyData.basic?.description || companyData.description,
            avatar: companyData.basic?.logo || companyData.logo,
          });
        } else if (
          data.job.companyId &&
          typeof data.job.companyId === "string"
        ) {
          // Fetch company details separately if not populated
          console.log("Fetching company details for ID:", data.job.companyId);
          await fetchCompanyDetails(data.job.companyId);
        } else {
          // Handle jobs without company
          setCompany({
            _id: "direct-hiring",
            name: "Direct Hiring",
            industry: "Various",
            location: ["Multiple Locations"],
            description: "Direct hiring opportunity",
          });
        }
      }
    } catch (error) {
      toast.error("Failed to load job details");
    }
  };

  // Fetch company details
  const fetchCompanyDetails = async (companyId: string) => {
    try {
      const token = getCookie("jwt");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/company/${companyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log("Company details response:", data);
        if (data.success && data.company) {
          const company = data.company;
          setCompany({
            _id: companyId,
            name: company.name || company.companyName || "Unknown Company",
            industry:
              company.basic?.industry || company.industry || "Technology",
            location: company.basic?.location ||
              company.location || ["Location not specified"],
            website: company.basic?.website || company.website,
            description: company.basic?.description || company.description,
            avatar: company.basic?.logo || company.logo || company?.avatar,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching company details:", error);
    }
  };

  // Fetch related jobs from available jobs
  const fetchRelatedJobs = async () => {
    try {
      const token = getCookie("jwt");

      // Get available jobs for this college
      const jobsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/available-jobs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (jobsResponse.ok) {
        const jobsData = await jobsResponse.json();
        if (jobsData.success && jobsData.jobs) {
          // Filter out current job and limit to 4
          const filtered = jobsData.jobs
            .filter((j: IJob) => j._id !== jobId)
            .slice(0, 4);
          setRelatedJobs(filtered);
        }
      }
    } catch (error) {
      console.error("Error fetching related jobs:", error);
    }
  };

  useEffect(() => {
    if (jobId) {
      const loadData = async () => {
        setLoading(true);
        await fetchJobDetails(jobId);
        await fetchRelatedJobs();
        setLoading(false);
      };
      loadData();
    } else {
      setLoading(false);
      toast.error("Job ID not found");
    }
  }, [jobId]);

  const formatDate = (dateString?: string | Date) => {
    if (!dateString) return "Not specified";
    try {
      // Convert Date object to string if needed
      const dateValue =
        typeof dateString === "string" ? dateString : dateString.toISOString();
      return format(new Date(dateValue), "PPP");
    } catch (error) {
      return "Invalid date";
    }
  };

  const getDaysAgo = (dateValue?: string | Date) => {
    if (!dateValue) return "Unknown";
    try {
      const dateStr =
        typeof dateValue === "string" ? dateValue : dateValue.toISOString();
      const days = differenceInDays(new Date(), new Date(dateStr));
      return days === 0 ? "Today" : `${days} Days ago`;
    } catch (error) {
      return "Unknown";
    }
  };

  const getSalaryDisplay = () => {
    if (job?.salaryRange?.min && job?.salaryRange?.max) {
      return `${job.salaryRange.min}LPA - ${job.salaryRange.max}LPA`;
    }
    return "Not disclosed";
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

  if (!job) {
    return (
      <div className="max-w mx-auto px-4 py-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            onClick={() => router.push("/college/jobs")}
            variant="outline"
            size="icon"
            className="rounded-md shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">Job Not Found</h1>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">The requested job could not be found.</p>
        </div>
      </div>
    );
  }

  // Access potentially undefined properties safely
  const departmentValue = (job as any).department || "Not specified";
  const employmentTypeValue = (job as any).employmentType || "Not specified";

  return (
    <div className="max-w mx-auto px-1 py-6">
      {/* Back button and title */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={() => router.push("/college/jobs")}
          variant="outline"
          size="icon"
          className="rounded-md shadow-md"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-semibold text-gray-800">{job.jobTitle}</h1>
      </div>

      {/* Main job card */}
      <div className="bg-white rounded-lg border shadow-xl mb-8 relative">
        {/* Company info */}
        <div className="p-2">
          <div className="flex flex-wrap gap-9.5">
            <div className="flex">
              <div className="pr-2">
                <div className="bg-black rounded-lg w-16 h-16 flex items-center justify-center">
                  {company?.avatar?.url ? (
                    <Image
                      src={company.avatar.url || "/placeholder.svg"}
                      alt={`${company?.name || "Company"} logo`}
                      width={64}
                      height={64}
                      className="rounded-lg"
                    />
                  ) : (
                    <Building2 className="h-8 w-8 text-white" />
                  )}
                </div>
              </div>
              <div>
                <div>
                  <h2 className="text-gray-700 font-semibold uppercase mt-2">
                    {company?.name || "Unknown Company"}
                  </h2>
                  <div className="flex items-center gap-1 text-gray-600 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {job.location?.join(", ") || "Location not specified"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-0 md:divide-x md:divide-dashed md:divide-[#219CAE] items-start md:items-center md:pl-7 mt-4 md:mt-0">
              <div className="px-0 md:px-8">
                <h3 className="text-gray-700 font-semibold">Time Period</h3>
                <p className="text-gray-600">
                  {job.jobType || "Not specified"}
                </p>
              </div>
              <div className="px-0 md:px-8">
                <h3 className="text-gray-700 font-semibold">Seniority Level</h3>
                <p className="text-gray-600">
                  {job.roleLevel || "Not specified"}
                </p>
              </div>
              <div className="px-0 md:px-8">
                <h3 className="text-gray-700 font-semibold">Salary</h3>
                <p className="text-gray-600">{getSalaryDisplay()}</p>
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
            <div className="text-gray-600 text-sm leading-relaxed max-h-[200px] overflow-y-auto">
              <p className="mb-4 whitespace-pre-line">{job.jobDescription}</p>
            </div>
          </div>

          {/* Role & Responsibility */}
          <div className="mt-6">
            <h3 className="text-gray-700 font-semibold mb-2">
              Role & Responsibility
            </h3>
            <div className="text-gray-600 text-sm leading-relaxed max-h-[200px] overflow-y-auto">
              <p className="mb-4">
                As a {job.jobTitle} at {company?.name || "our company"}, you
                will be responsible for:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                {job.eligibility?.requiredSkills?.map((skill, index) => (
                  <li key={index}>Working with {skill}</li>
                )) || (
                  <>
                    <li>Develop and maintain high-quality applications</li>
                    <li>Collaborate with cross-functional teams</li>
                    <li>Identify and fix bugs and performance issues</li>
                    <li>Write clean, maintainable code</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Skills */}
          {job.eligibility?.requiredSkills &&
            job.eligibility.requiredSkills.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {job.eligibility.requiredSkills.map((skill, index) => (
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
            )}

          {/* Additional Details */}
          {(departmentValue !== "Not specified" ||
            employmentTypeValue !== "Not specified" ||
            job.applicationDeadline) && (
            <>
              <div className="w-full border-t border-dashed border-cyan-500 my-6"></div>
              <div className="mt-6">
                <h3 className="text-gray-700 font-semibold mb-2">
                  Additional Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {departmentValue !== "Not specified" && (
                    <div>
                      <h4 className="text-sm text-gray-500">Department</h4>
                      <p className="font-medium">{departmentValue}</p>
                    </div>
                  )}
                  {employmentTypeValue !== "Not specified" && (
                    <div>
                      <h4 className="text-sm text-gray-500">Employment Type</h4>
                      <p className="font-medium">{employmentTypeValue}</p>
                    </div>
                  )}
                  {job.applicationDeadline && (
                    <div>
                      <h4 className="text-sm text-gray-500">
                        Application Deadline
                      </h4>
                      <p className="font-medium">
                        {formatDate(job.applicationDeadline)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Similar Jobs */}
      {relatedJobs.length > 0 && (
        <>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              More Available Jobs
            </h2>
            <Button variant="link" className="text-orange-500 underline">
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {relatedJobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                detailsLink={`/college/jobs/job-details?id=${job._id}`}
                colors={{
                  primary: "#219CAE",
                  secondary: "#F68622",
                  badge1: "bg-green-50 border-green-100",
                  badge2: "bg-blue-50 border-blue-100",
                }}
                showActions={false}
                showBatchInfo={false}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
