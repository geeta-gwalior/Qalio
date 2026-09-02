"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { differenceInDays, format } from "date-fns";
import {
  ArrowLeft,
  Bookmark,
  MapPin,
  Edit,
  Trash2,
  Users,
  Building2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import type { IJob } from "@/types/job";
import Link from "next/link";
import Image from "next/image";
import { getCookie } from "@/utils/getCookie";
import { BackHeader } from "../backHeader";

interface College {
  _id: string;
  collegeName: string;
}

interface JobDetailsViewProps {
  job: IJob;
}

export default function CompanyJobDetailsView({ job }: JobDetailsViewProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [invitedColleges, setInvitedColleges] = useState<College[]>([]);
  const [isLoadingColleges, setIsLoadingColleges] = useState(false);

  // Safely access potentially undefined properties
  const applicationSettings = job.applicationSettings || {};
  const invitedCollegesIds = (applicationSettings as any).invitedColleges || [];
  const acceptFrom = (applicationSettings as any).acceptFrom || "All";

  // Fetch college details for invited colleges
  useEffect(() => {
    const fetchInvitedColleges = async () => {
      if (invitedCollegesIds.length > 0) {
        setIsLoadingColleges(true);
        try {
          const token = getCookie("jwt");
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/for-company`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.colleges) {
              // Filter colleges that are in the invited list
              const invited = data.colleges.filter((college: College) =>
                invitedCollegesIds.includes(college._id)
              );
              setInvitedColleges(invited);
            }
          }
        } catch (error) {
          toast.error(`Error fetching invited colleges: ${error}`);
        } finally {
          setIsLoadingColleges(false);
        }
      }
    };

    fetchInvitedColleges();
  }, [invitedCollegesIds]);

  const handleEdit = () => {
    router.push(`/company/jobs/create?id=${job._id}&isEdit=true`);
  };

  const handleDelete = async () => {
    if (!job._id) return;

    setIsDeleting(true);
    try {
      const token = getCookie("jwt");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/${job._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      toast.success("Job deleted successfully");
      router.push("/company/jobs");
    } catch (error) {
      toast.error("Failed to delete job");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

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

  const daysAgo = job.createdAt
    ? differenceInDays(new Date(), new Date(job.createdAt))
    : 0;
  const daysAgoText = daysAgo === 0 ? "Today" : `${daysAgo} Days ago`;

  const salaryDisplay =
    job.salaryRange?.min && job.salaryRange?.max
      ? `${job.salaryRange.min}LPA - ${job.salaryRange.max}LPA`
      : "Not disclosed";

  // Helper function to get company name and ID
  const getCompanyInfo = () => {
    if (typeof job.companyId === "object" && job.companyId !== null) {
      // If companyId is an object, extract the name and _id
      const companyObj = job.companyId as any;
      return {
        name: companyObj.companyName || companyObj.name || "Company",
        id: companyObj._id || "C",
      };
    } else if (typeof job.companyId === "string") {
      // If companyId is a string, use it directly
      return {
        name: job.companyId,
        id: job.companyId,
      };
    } else {
      // Fallback
      return {
        name: "Company",
        id: "C",
      };
    }
  };

  const companyInfo = getCompanyInfo();

  // Safely access potentially undefined properties
  const attachments = (job as any).attachments || {};
  const departmentValue = (job as any).department || "Not specified";
  const industryValue = (job as any).industry || "Not specified";
  const employmentTypeValue = (job as any).employmentType || "Not specified";
  const joiningDateValue = (job as any).joiningDate;

  const getVisibilityInfo = () => {
    if (job.publishing?.visibility === "Public") {
      return {
        type: "Public Job",
        description: "This job is visible to all students on the platform.",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        textColor: "text-green-800",
        icon: <Users className="h-5 w-5" />,
      };
    } else if (
      job.publishing?.visibility === "SelectedColleges" ||
      acceptFrom === "College-specific" ||
      acceptFrom === "Invite-only"
    ) {
      return {
        type: "Invite-Only Job",
        description:
          "This job is only visible to students from selected colleges.",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        textColor: "text-blue-800",
        icon: <Building2 className="h-5 w-5" />,
      };
    } else {
      return {
        type: "Private Job",
        description: "This job has limited visibility.",
        bgColor: "bg-gray-50",
        borderColor: "border-gray-200",
        textColor: "text-gray-800",
        icon: <Users className="h-5 w-5" />,
      };
    }
  };

  const visibilityInfo = getVisibilityInfo();

  return (
    <div className="">
      {/* Header with back button and job title */}
      <div className="flex items-center gap-4 mb-6">
        {/* <Link
          href="/company/jobs"
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-bold">{job.jobTitle}</h1> */}
        <BackHeader title={`${job.jobTitle}`} defaultRoute="/company/jobs" />
      </div>

      {/* Main job card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
        {/* Company info and key details */}
        <div className="pt-0 pr-2 p-6">
          {/* <div className="flex justify-between">
            <div className="flex gap-4">
              <div className="h-16 w-16 bg-black rounded-lg flex items-center justify-center text-white flex-shrink-0">
                {attachments.jdPdf ? (
                  <Image
                    src={attachments.jdPdf || "/placeholder.svg"}
                    alt={`${companyInfo.name} logo`}
                    width={64}
                    height={64}
                    className="rounded-lg"
                  />
                ) : (
                  <span className="text-xl font-bold">
                    {typeof companyInfo.id === "string"
                      ? companyInfo.id.substring(0, 1).toUpperCase()
                      : "C"}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#F68622] uppercase">
                  {companyInfo.name}
                </h2>
                <div className="flex items-center mt-1 text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {job.location?.join(", ") || "Location not specified"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsSaved(!isSaved)}
              className="text-gray-400 hover:text-gray-600"
              aria-label={isSaved ? "Unsave job" : "Save job"}
            ></button>
          </div> */}

          {/* Key details row */}
          <div className="grid grid-cols-4 gap-4 mt-4  border-b py-4">
            <div>
              <h3 className="text-sm text-gray-500">Time Period</h3>
              <p className="font-medium">{job.jobType}</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Seniority Level</h3>
              <p className="font-medium">{job.roleLevel || "Not specified"}</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Salary</h3>
              <p className="font-medium">{salaryDisplay}</p>
            </div>
            <div>
              <h3 className="text-sm text-gray-500">Job Posted</h3>
              <p className="font-medium text-[#F68622]">• {daysAgoText}</p>
            </div>
          </div>

          {/* Job Description */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Job Description</h3>
            <p className="text-gray-700 whitespace-pre-line">
              {job.jobDescription}
            </p>
          </div>

          {/* Role & Responsibility */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">
              Role & Responsibility
            </h3>
            <p className="text-gray-700 mb-3">
              As a {job.jobTitle} at {companyInfo.name}, you will be responsible
              for the following:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-700">
              {job.eligibility?.requiredSkills?.map((skill, index) => (
                <li key={index}>{skill}</li>
              )) || (
                <>
                  <li>
                    Develop and maintain high-quality software applications
                    using modern programming languages and frameworks
                  </li>
                  <li>
                    Collaborate with cross-functional teams to define, design,
                    and ship new features
                  </li>
                  <li>
                    Identify and fix bugs and performance issues to ensure
                    optimal application performance
                  </li>
                  <li>
                    Write clean, maintainable, and efficient code following best
                    practices and coding standards
                  </li>
                  <li>
                    Participate in code reviews and provide constructive
                    feedback to other developers
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Skills */}
          <div className="mt-6 flex flex-wrap gap-2">
            {job.eligibility?.requiredSkills
              ?.slice(0, 4)
              .map((skill, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800"
                >
                  {skill}
                </Badge>
              ))}
          </div>

          {/* Visibility and College Information */}
          <div className="mt-6">
            <div
              className={`${visibilityInfo.bgColor} ${visibilityInfo.borderColor} border rounded-lg p-4`}
            >
              <div className="flex items-center gap-2 mb-2">
                {visibilityInfo.icon}
                <h3
                  className={`text-lg font-semibold ${visibilityInfo.textColor}`}
                >
                  {visibilityInfo.type}
                </h3>
              </div>
              <p className={`text-sm ${visibilityInfo.textColor} mb-3`}>
                {visibilityInfo.description}
              </p>

              {/* Show invited colleges if applicable */}
              {invitedColleges.length > 0 && (
                <div>
                  <h4
                    className={`font-medium ${visibilityInfo.textColor} mb-2`}
                  >
                    Invited Colleges ({invitedColleges.length})
                  </h4>
                  {isLoadingColleges ? (
                    <div className="flex gap-2">
                      <div className="animate-pulse bg-gray-200 h-6 w-24 rounded"></div>
                      <div className="animate-pulse bg-gray-200 h-6 w-32 rounded"></div>
                      <div className="animate-pulse bg-gray-200 h-6 w-28 rounded"></div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {invitedColleges.slice(0, 6).map((college) => (
                        <Badge
                          key={college._id}
                          variant="outline"
                          className={`${visibilityInfo.bgColor} hover:bg-opacity-80 ${visibilityInfo.textColor} ${visibilityInfo.borderColor}`}
                        >
                          {college.collegeName}
                        </Badge>
                      ))}
                      {invitedColleges.length > 6 && (
                        <Badge
                          variant="outline"
                          className={`${visibilityInfo.bgColor} ${visibilityInfo.textColor} ${visibilityInfo.borderColor}`}
                        >
                          +{invitedColleges.length - 6} more
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Show message if no colleges are invited but job is invite-only */}
              {(acceptFrom === "College-specific" ||
                acceptFrom === "Invite-only" ||
                job.publishing?.visibility === "SelectedColleges") &&
                invitedColleges.length === 0 &&
                !isLoadingColleges && (
                  <div className={`text-sm ${visibilityInfo.textColor}`}>
                    No colleges have been invited to this job yet.
                  </div>
                )}
            </div>
          </div>

          {/* Additional Job Details */}
          {(departmentValue !== "Not specified" ||
            industryValue !== "Not specified" ||
            employmentTypeValue !== "Not specified" ||
            job.numberOfOpenings) && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Additional Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {departmentValue !== "Not specified" && (
                  <div>
                    <h4 className="text-sm text-gray-500">Department</h4>
                    <p className="font-medium">{departmentValue}</p>
                  </div>
                )}
                {industryValue !== "Not specified" && (
                  <div>
                    <h4 className="text-sm text-gray-500">Industry</h4>
                    <p className="font-medium">{industryValue}</p>
                  </div>
                )}
                {employmentTypeValue !== "Not specified" && (
                  <div>
                    <h4 className="text-sm text-gray-500">Employment Type</h4>
                    <p className="font-medium">{employmentTypeValue}</p>
                  </div>
                )}
                {job.numberOfOpenings && (
                  <div>
                    <h4 className="text-sm text-gray-500">Openings</h4>
                    <p className="font-medium">{job.numberOfOpenings}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && job.benefits.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Benefits</h3>
              <div className="flex flex-wrap gap-2">
                {job.benefits.map((benefit, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-green-50 text-green-800 border-green-200"
                  >
                    {benefit}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Important Dates */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Important Dates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm text-gray-500">Application Deadline</h4>
                <p className="font-medium">
                  {formatDate(job.applicationDeadline)}
                </p>
              </div>
              {joiningDateValue && (
                <div>
                  <h4 className="text-sm text-gray-500">Joining Date</h4>
                  <p className="font-medium">{formatDate(joiningDateValue)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex gap-3 justify-end">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleEdit}
            >
              <Edit className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="destructive"
              className="flex items-center gap-2"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this job?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job
              posting and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

{
  /* Similar Jobs */
}
{
  /* <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Similar Jobs</h2>
          <Link
            href="/company/jobs"
            className="text-[#219CAE] hover:underline font-medium"
          >
            View All
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {similarJobs.map((similarJob) => (
            <div
              key={similarJob._id}
              className="bg-white rounded-xl shadow-md overflow-hidden relative"
            >
              <div className="p-4">
                <div className="flex justify-between">
                  <div className="flex gap-3">
                    <div className="h-14 w-14 bg-black rounded-lg flex items-center justify-center text-white flex-shrink-0">
                      <span className="text-lg font-bold">
                        {similarJob.companyName.substring(0, 1)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#F68622] uppercase">
                        {similarJob.companyName}
                      </h3>
                      <p className="font-medium">{similarJob.jobTitle}</p>
                      <div className="flex items-center mt-1 text-gray-600">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="text-xs">{similarJob.location}</span>
                      </div>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <Bookmark className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Job Type</p>
                    <p className="font-medium">{similarJob.jobType}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Experience</p>
                    <p className="font-medium">{similarJob.experience}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Salary Package</p>
                    <p className="font-medium">
                      {similarJob.salaryRange?.min &&
                      similarJob.salaryRange?.max
                        ? `${similarJob.salaryRange.min}LPA - ${similarJob.salaryRange.max}LPA`
                        : "Not disclosed"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="bg-gray-100 text-gray-800 text-xs"
                  >
                    Design
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-gray-100 text-gray-800 text-xs"
                  >
                    UI/UX
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-gray-100 text-gray-800 text-xs"
                  >
                    Product
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-gray-100 text-gray-800 text-xs"
                  >
                    AI
                  </Badge>
                </div>

                <div className="mt-4">
                  <Link
                    href={`/company/jobs/company-job-details/${similarJob._id}`}
                    className="text-[#219CAE] hover:underline font-medium flex items-center"
                  >
                    View Details <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div> */
}
