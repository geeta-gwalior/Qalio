"use client";

import {
  MapPin,
  ArrowRight,
  Edit,
  Trash2,
  Calendar,
  Users,
  GraduationCap,
  BriefcaseBusiness,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import type { IJob } from "@/types/job";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/auth-store";
import Image from "next/image";
import { getCookie } from "@/utils/getCookie";

export interface JobCardProps {
  job: IJob;
  favoriteJobs?: string[];
  toggleFavorite?: (jobId: string) => void;
  detailsLink?: string;
  detailsLinkText?: string;
  showFavoriteButton?: boolean;
  cardStyle?: "default" | "compact" | "expanded" | "company";
  className?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    badge1?: string;
    badge2?: string;
  };
  onDeleteSuccess?: () => void;
  showActions?: boolean;
  showBatchInfo?: boolean;
  userRole?: "student" | "college" | "company";
}

export default function JobCard({
  job,
  detailsLink = "/college/jobs/job-details",
  detailsLinkText = "View Details",
  className = "",
  colors = {
    primary: "#219CAE",
    secondary: "#F68622",
    badge1: "bg-green-50 border-green-100",
    badge2: "bg-blue-50 border-blue-100",
  },
  onDeleteSuccess,
  showActions = false,
  showBatchInfo = true,
  userRole = "student",
}: JobCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const user: any = useAuthStore((state) => state.user);

  const getSalaryDisplay = () => {
    const min = job.salaryRange?.min;
    const max = job.salaryRange?.max;

    if (min && max) {
      if (min > 1000) {
        return `₹${min.toLocaleString()} – ₹${max.toLocaleString()}`;
      } else {
        return `₹${min}L – ₹${max}L`;
      }
    }
    return "Not disclosed";
  };

  const skills = job.eligibility?.requiredSkills || [];
  const experience = job.eligibility?.experienceRequired || "N/A";
  const locations = job.location?.join(", ") || "Location not specified";
  const daysAgo = job.createdAt
    ? Math.floor(
        (new Date().getTime() - new Date(job.createdAt).getTime()) /
          (1000 * 3600 * 24)
      )
    : 0;

  const getCompanyName = () => {
    if (!job.companyId) return "Unknown Company!!!!!";
    if (typeof job.companyId === "string") return job.companyId;
    const company = job.companyId as any;
    return company.name || company.companyName || "Unknown Company";
  };

  const getCompanyInitial = () => {
    return getCompanyName().charAt(0).toUpperCase();
  };

  const getApplicationDeadline = () => {
    if (!job.applicationDeadline) return "No deadline";
    const deadline = new Date(job.applicationDeadline);
    const now = new Date();
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Expired";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "1 day left";
    return `${diffDays} days left`;
  };

  const getStatusBadge = () => {
    const status = job.publishing?.status || "Draft";
    const visibility = job.publishing?.visibility || "Private";

    if (status === "Published") {
      return { text: visibility, color: "bg-green-100 text-green-800" };
    }
    if (status === "Draft") {
      return { text: "Draft", color: "bg-gray-100 text-gray-800" };
    }
    return { text: status, color: "bg-yellow-100 text-yellow-800" };
  };

  const getBatchDisplay = () => {
    if (!showBatchInfo) return null;

    // Only use eligibility.graduationYears
    if (
      job.eligibility?.graduationYears &&
      job.eligibility.graduationYears.length > 0
    ) {
      return job.eligibility.graduationYears.join(", ");
    }

    return "All Batches";
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
      onDeleteSuccess?.();
    } catch (error) {
      console.error("Error deleting job:", error);
      toast.error("Failed to delete job");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const statusBadge = getStatusBadge();
  const deadlineText = getApplicationDeadline();
  const isExpired = deadlineText === "Expired";

  return (
    <>
      <div
        className={`bg-white rounded-xl shadow-md overflow-hidden relative w-full ${className}`}
      >
        <div className="bg-card px-4 w-full text-card-foreground flex flex-col gap-3 rounded-xl border py-4 shadow-sm overflow-hidden">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="h-16 w-16 bg-black rounded-lg flex items-center justify-center text-white flex-shrink-0">
              <span className="text-lg font-bold">
                {(job.companyId?.avatar && user?.role === "college") ||
                user?.role === "student" ? (
                  job.companyId?.avatar ? (
                    <Image
                      src={job.companyId.avatar || "/placeholder.svg"}
                      alt="Company Logo"
                      width={70}
                      height={70}
                      className="rounded-lg object-fill"
                    />
                  ) : (
                    <span className="text-2xl capitalize">
                      {job.companyId?.name?.charAt(0) || "C"}
                    </span>
                  )
                ) : (
                  <BriefcaseBusiness />
                )}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <span
                className="text-xs font-semibold uppercase truncate"
                style={{ color: colors.secondary }}
              >
                {user?.role === "company"
                  ? " "
                  : getCompanyName() || "Company not specified"}
              </span>
              <h3 className="text-base font-semibold text-gray-700 mt-0.5 line-clamp-1">
                {job.jobTitle}
              </h3>
              <div className="flex items-center mt-0.5 text-gray-700">
                <MapPin className="w-[13px] h-[13px] flex-shrink-0" />
                <span className="text-xs line-clamp-1">
                  {locations || "Location not specified"}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 min-w-[100px]">
              {/* Badges container - always rendered */}
              <div className="flex flex-col gap-1 w-full items-end min-h-[42px]">
                {statusBadge.text ? (
                  <Badge className={`text-xs px-2 py-1 ${statusBadge.color}`}>
                    {statusBadge.text}
                  </Badge>
                ) : (
                  <div className="h-[20px]"></div>
                )}

                {job.assessment ? (
                  <Badge className="text-xs px-2 py-1 bg-purple-100 text-purple-800 border border-purple-200">
                    Assessment Attached
                  </Badge>
                ) : (
                  <div className="h-[26px]"></div>
                )}
              </div>

              {/* Date indicator */}
              <div className="flex items-center text-sm text-gray-700 min-w-[80px] justify-end">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F68622] mr-1.5 flex-shrink-0"></span>
                <span className="truncate">
                  {daysAgo === 0 ? "Today" : `${daysAgo} Days ago`}
                </span>
              </div>
            </div>
          </div>

          <hr className="border-t border-dashed my-1 border-gray-200" />

          {/* Job Details Grid */}
          <div className="flex flex-wrap justify-between gap-y-2">
            <div className="min-w-[25%]">
              <p className="text-xs mb-0.5" style={{ color: colors.secondary }}>
                Job Type
              </p>
              <p className="text-xs font-bold text-gray-700 truncate">
                {job.jobType || "Not specified"}
              </p>
            </div>
            <div className="min-w-[25%] text-center">
              <p className="text-xs mb-0.5" style={{ color: colors.secondary }}>
                Experience
              </p>
              <p className="text-xs font-bold text-gray-700 truncate">
                {experience}
              </p>
            </div>
            <div className="min-w-[25%] text-center">
              <p className="text-xs mb-0.5" style={{ color: colors.secondary }}>
                Salary
              </p>
              <p className="text-xs font-bold text-gray-700 truncate">
                {getSalaryDisplay()}
              </p>
            </div>
            <div className="min-w-[25%] text-center">
              <p className="text-xs mb-0.5" style={{ color: colors.secondary }}>
                Openings
              </p>
              <p className="text-xs font-bold text-gray-700 truncate">
                {job.numberOfOpenings || "Not specified"}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="space-y-1">
            {/* Application Deadline */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center text-gray-700">
                <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                <span>Application Deadline</span>
              </div>
              <span
                className={`font-medium ${
                  isExpired ? "text-red-600" : "text-gray-700"
                }`}
              >
                {deadlineText}
              </span>
            </div>

            {/* Batch Info */}
            {showBatchInfo && (
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center text-gray-700">
                  <GraduationCap className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                  <span>Eligible Batches</span>
                </div>
                <span className="font-medium text-blue-600">
                  {getBatchDisplay() || "All Batches"}
                </span>
              </div>
            )}

            {/* Role Level */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center text-gray-700">
                <Users className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                <span>Role Level</span>
              </div>
              <span className="font-medium text-gray-700">
                {job.roleLevel || "Not specified"}
              </span>
            </div>
          </div>

          {/* Skills Section */}
          <div>
            <p
              className="text-xs font-medium mb-1.5"
              style={{ color: colors.secondary }}
            >
              Required Skills
            </p>
            <div className="min-h-[28px] flex items-start flex-wrap gap-1.5">
              {skills.length > 0 ? (
                <>
                  {skills.slice(0, 4).map((skill, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className={`rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap text-gray-700 ${
                        index % 2 === 0 ? colors.badge1 : colors.badge2
                      }`}
                    >
                      {skill}
                    </Badge>
                  ))}
                  {skills.length > 4 && (
                    <Badge
                      variant="outline"
                      className="rounded px-2 py-0.5 text-xs font-medium text-gray-700 border-gray-300"
                    >
                      +{skills.length - 4} more
                    </Badge>
                  )}
                </>
              ) : (
                <span className="text-xs text-gray-500">
                  No specific skills required
                </span>
              )}
            </div>
          </div>

          {/* Actions Section */}
          <div className="flex items-center justify-between mt-2 min-h-[28px]">
            <Link
              href={`${detailsLink}?id=${job._id}`}
              className="flex items-center gap-1 font-bold text-xs"
              style={{ color: colors.primary }}
            >
              {detailsLinkText}
              <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Link>

            {showActions && (
              <div className="flex gap-1">
                <Link
                  href={`/company/jobs/create?id=${job._id}&isEdit=true`}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  title="Edit job"
                >
                  <Edit size={14} style={{ color: colors.primary }} />
                </Link>
                <button
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="p-1.5 rounded-full hover:bg-red-50 transition-colors"
                  title="Delete job"
                >
                  <Trash2 size={14} className="text-red-500" />
                </button>
              </div>
            )}
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
              posting {job.jobTitle}.
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
    </>
  );
}

export function JobCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden relative w-full">
      <div className="bg-card px-4 w-full text-card-foreground flex flex-col gap-3 rounded-xl border py-4 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-16 w-16 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-48" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="flex items-center">
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="border-t border-dashed border-[#219CAE] mx-1"></div>
        <div className="flex flex-wrap justify-between">
          <div className="space-y-1">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="space-y-1 text-center">
            <Skeleton className="h-2.5 w-16 mx-auto" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
          <div className="space-y-1 text-center">
            <Skeleton className="h-2.5 w-16 mx-auto" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
          <div className="space-y-1 text-center">
            <Skeleton className="h-2.5 w-16 mx-auto" />
            <Skeleton className="h-3 w-20 mx-auto" />
          </div>
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-5 w-16 rounded" />
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-24" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-6 w-6 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
