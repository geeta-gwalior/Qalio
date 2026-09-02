"use client";

import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Users,
  Calendar,
  Globe,
  ArrowRight,
  BriefcaseBusiness,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface Company {
  _id: string;
  companyName: string;
  industry: string;
  location: string[];
  website?: string;
  description?: string;
  logo?: {
    url: string;
  };
  yearEstablished?: number;
  employeeCount?: string;
  headquarters?: string;
  jobCount?: number;
  latestJobDate?: string;
  // Additional fields from your API
  avatar?: string;
  address?: string;
  totalEmployees?: number;
  yearFounded?: number;
  hqCity?: string;
  annualRevenue?: number;
  sector?: string;
  companyType?: string;
  corporateEmail?: string;
  status?: string;
  userId?: string;
}

interface CompanyCardProps {
  company: Company;
  detailsLink: string;
  colors: {
    primary: string;
    secondary: string;
    badge1: string;
    badge2: string;
  };
}

export default function CompanyCard({
  company,
  detailsLink,
  colors,
}: CompanyCardProps) {
  const formatRevenue = (revenue?: number) => {
    if (!revenue) return "Not disclosed";
    if (revenue >= 1000000000) return `$${(revenue / 1000000000).toFixed(1)}B`;
    if (revenue >= 1000000) return `$${(revenue / 1000000).toFixed(1)}M`;
    if (revenue >= 1000) return `$${(revenue / 1000).toFixed(1)}K`;
    return `$${revenue}`;
  };

  const formatEmployees = (count?: number) => {
    if (!count) return "Not specified";
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K+`;
    return `${count}`;
  };

  const getStatusBadge = () => {
    if (!company.status) return null;
    if (company.status === "approved") {
      return { text: "Approved", color: "bg-green-100 text-green-800" };
    }
    return { text: company.status, color: "bg-gray-100 text-gray-800" };
  };

  const statusBadge = getStatusBadge();

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden relative w-full h-full">
      <div className="bg-card px-4 w-full text-card-foreground flex flex-col rounded-xl border py-4 shadow-sm overflow-hidden h-full min-h-[320px]">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {company.avatar || company.logo?.url ? (
              <img
                src={company.avatar || company.logo?.url}
                alt={`${company.companyName} logo`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.parentElement!.innerHTML = `<BriefcaseBusiness className="w-8 h-8 text-gray-400" />`;
                }}
              />
            ) : (
              <BriefcaseBusiness className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span
              className="text-xs font-semibold uppercase truncate"
              style={{ color: colors.secondary }}
            >
              {company.industry || "Technology"}
            </span>
            <h3 className="text-base font-semibold text-gray-700 mt-0.5 line-clamp-1">
              {company.companyName}
            </h3>
            <div className="flex items-center mt-0.5 text-gray-700">
              <MapPin className="w-[13px] h-[13px] flex-shrink-0" />
              <span className="text-xs line-clamp-1">
                {company.location?.[0] ||
                  company.address ||
                  "Location not specified"}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 min-w-[100px]">
            {/* Badges container */}
            <div className="flex flex-col gap-1 w-full items-end min-h-[42px]">
              {/* {statusBadge ? (
                <Badge className={`text-xs px-2 py-1 ${statusBadge.color}`}>
                  {statusBadge.text}
                </Badge>
              ) : (
                <div className="h-[20px]"></div>
              )} */}
              {company.jobCount && company.jobCount > 0 ? (
                <Badge className="text-xs px-2 py-1 bg-blue-100 text-blue-800 border border-blue-200">
                  {company.jobCount} Jobs
                </Badge>
              ) : (
                <div className="h-[26px]"></div>
              )}
            </div>
            {/* Established year */}
            <div className="flex items-center text-sm text-gray-700 min-w-[80px] justify-end">
              <span className="h-1.5 w-1.5 rounded-full bg-[#F68622] mr-1.5 flex-shrink-0"></span>
              <span className="truncate">
                {company.yearEstablished
                  ? `Est. ${company.yearEstablished}`
                  : "Est. N/A"}
              </span>
            </div>
          </div>
        </div>

        <hr className="border-t border-dashed my-2 border-gray-200" />

        {/* Company Details Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div>
            <p className="text-xs mb-0.5" style={{ color: colors.secondary }}>
              Employees
            </p>
            <p className="text-xs font-bold text-gray-700 truncate">
              {company.totalEmployees
                ? formatEmployees(company.totalEmployees)
                : company.employeeCount || "N/A"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs mb-0.5" style={{ color: colors.secondary }}>
              Revenue
            </p>
            <p className="text-xs font-bold text-gray-700 truncate">
              {formatRevenue(company.annualRevenue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs mb-0.5" style={{ color: colors.secondary }}>
              Type
            </p>
            <p className="text-xs font-bold text-gray-700 truncate">
              {company.companyType || "Not specified"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs mb-0.5" style={{ color: colors.secondary }}>
              HQ
            </p>
            <p className="text-xs font-bold text-gray-700 truncate">
              {company.hqCity || "N/A"}
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-1 mt-2">
          {/* Website */}
          {company.website && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center text-gray-700">
                <Globe className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                <span>Website</span>
              </div>
              <div
                className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer truncate max-w-[150px]"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(company.website, "_blank", "noopener,noreferrer");
                }}
              >
                {company.website.replace(/^https?:\/\//, "")}
              </div>
            </div>
          )}
          {/* Founded Year */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center text-gray-700">
              <Calendar className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              <span>Founded</span>
            </div>
            <span className="font-medium text-gray-700">
              {company.yearFounded ||
                company.yearEstablished ||
                "Not specified"}
            </span>
          </div>
          {/* Employee Count */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center text-gray-700">
              <Users className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
              <span>Team Size</span>
            </div>
            <span className="font-medium text-gray-700">
              {company.totalEmployees
                ? `${formatEmployees(company.totalEmployees)} employees`
                : company.employeeCount || "Not specified"}
            </span>
          </div>
        </div>

        {/* Sectors/Tags Section */}
        <div className="mt-auto pt-3">
          <p
            className="text-xs font-medium mb-1.5"
            style={{ color: colors.secondary }}
          >
            Sectors & Tags
          </p>
          <div className="flex items-start flex-wrap gap-1.5">
            {company.sector && (
              <Badge
                variant="outline"
                className={`rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap text-gray-700 ${colors.badge1}`}
              >
                {company.sector}
              </Badge>
            )}
            {company.industry && company.industry !== company.sector && (
              <Badge
                variant="outline"
                className={`rounded px-2 py-0.5 text-xs font-medium whitespace-nowrap text-gray-700 ${colors.badge2}`}
              >
                {company.industry}
              </Badge>
            )}
            {company.companyType && (
              <Badge
                variant="outline"
                className="rounded px-2 py-0.5 text-xs font-medium text-gray-700 border-gray-300"
              >
                {company.companyType}
              </Badge>
            )}
            {!company.sector && !company.industry && !company.companyType && (
              <span className="text-xs text-gray-500">
                No sectors specified
              </span>
            )}
          </div>
        </div>

        {/* Actions Section */}
        <div className="flex items-center justify-between mt-3">
          <Link
            href={`${detailsLink}?id=${company?.userId}`}
            className="flex items-center gap-1 font-bold text-xs"
            style={{ color: colors.primary }}
          >
            View Details
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CompanyCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden relative w-full h-full">
      <div className="bg-card px-4 w-full text-card-foreground flex flex-col rounded-xl border py-4 shadow-sm overflow-hidden min-h-[320px]">
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
        <div className="border-t border-dashed border-gray-200 mx-1 my-2"></div>
        <div className="grid grid-cols-4 gap-2">
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
        <div className="space-y-1 mt-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-full" />
        </div>
        <div className="mt-auto pt-3">
          <Skeleton className="h-2.5 w-24 mb-2" />
          <div className="flex gap-1.5">
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-5 w-16 rounded" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>
        </div>
        <div className="flex justify-between items-center mt-3">
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}
