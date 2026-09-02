"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, MapPin, ExternalLink } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import JobCard from "@/components/job-card";
import { getCookie } from "@/utils/getCookie";
import { toast } from "sonner";
import type { ICompanyPopulated } from "@/types/job";

interface APIJobResponse {
  success: boolean;
  jobs: IJob[];
}

export interface IJob {
  _id: string;
  jobTitle: string;
  jobDescription: string;
  jobType: string;
  companyId: ICompanyPopulated;
  location?: string[];
  department?: string;
  roleLevel?: string;
  applicationDeadline?: string;
  numberOfOpenings?: number;
  employmentType?: string;
  salaryRange?: {
    min: number;
    max: number;
  };
  eligibility?: {
    minEducationLevel?: string;
    experienceRequired?: string;
    requiredSkills?: string[];
    minPercentage?: number;
  };
  benefits?: string[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICompanyBasic {
  logo?: string;
  companyName?: string;
  website?: string;
  totalEmployees?: number;
  yearFounded?: number;
  hqCity?: string;
  industry?: string;
  sector?: string;
  companyType?: string;
  annualRevenue?: number;
  description?: string;
}

export interface ICompany {
  _id: string;
  userId?: { name?: string; avatar?: string };
  basic?: ICompanyBasic;
  about?: { description?: string };
  officialInformation?: {
    companyType?: string;
    yearOfEstablishment?: number;
  };
  leader?: { name?: string; title?: string }[];
}

interface APICompanyResponse {
  success: boolean;
  company: ICompany;
}

export default function CompanyDetails() {
  const [company, setCompany] = useState<ICompany | null>(null);
  const [jobs, setJobs] = useState<IJob[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams.get("id");

  const getFallbackCompany = (): ICompany => ({
    _id: companyId ?? "unknown",
    basic: {
      companyName: `Company ${companyId?.slice(-4) ?? "Unknown"}`,
      industry: "Not Available",
      totalEmployees: 0,
      yearFounded: undefined,
      hqCity: undefined,
      description: "No data.",
    },
    about: { description: "No data." },
  });

  const fetchCompanyData = async (id: string) => {
    const token = getCookie("jwt");
    if (!token) throw new Error("Auth required");

    const compRes = await fetch(
      `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/getCompanyDetailsById/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!compRes.ok) throw new Error("Company fetch failed");

    const compJson: APICompanyResponse = await compRes.json();
    return compJson.success ? compJson.company : getFallbackCompany();
  };

  const fetchJobsForCompany = async (id: string) => {
    const token = getCookie("jwt");
    if (!token) throw new Error("Auth required");

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/available-jobs`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!res.ok) throw new Error("Jobs fetch failed");

    const data: APIJobResponse = await res.json();
    const allJobs = data.success ? data.jobs : [];

    return allJobs.filter((job) => {
      const jc = job.companyId;
      const jid = typeof jc === "string" ? jc : jc?._id;
      return jid === id;
    });
  };

  useEffect(() => {
    if (!companyId) {
      toast.error("No company ID");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const [comp, compJobs] = await Promise.all([
          fetchCompanyData(companyId),
          fetchJobsForCompany(companyId),
        ]);
        setCompany(comp);
        setJobs(compJobs);
      } catch (err) {
        console.error(err);
        toast.error("Fetch error");
        setCompany(getFallbackCompany());
        setJobs([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [companyId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#219CAE]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="w-full">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              onClick={() => router.back()}
              variant="outline"
              size="icon"
              className="rounded-md shadow-md bg-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="text-xl font-semibold text-gray-800">
              Company Details
            </h1>
          </div>
          <p className="mt-4 text-center text-gray-600">Company not found</p>
        </div>
      </div>
    );
  }

  const basic = company.basic || {};
  const desc =
    company.about?.description ||
    basic.description ||
    "No description available";
  const userId = company.userId || {};
  const avatar = userId.avatar || basic.logo;
  const userName = userId.name ?? basic.companyName ?? "Unknown Company";

  return (
    <div className="w-full">
      <div className="w-full mx-auto p-1">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="icon"
            className="rounded-md shadow-md bg-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">
            Company Details
          </h1>
        </div>

        {/* Main Company Card */}
        <div className="bg-white rounded-xl shadow-lg border mb-8">
          <div className="p-8">
            {/* Company Header */}
            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                {avatar ? (
                  <Image
                    src={avatar || "/placeholder.svg"}
                    alt="Company Logo"
                    width={64}
                    height={64}
                    className="rounded-xl object-cover"
                  />
                ) : (
                  <span className="text-2xl text-gray-500 font-semibold">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {userName}
                </h2>
                {basic.hqCity && (
                  <div className="flex items-center gap-2 text-gray-600 mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{basic.hqCity}</span>
                  </div>
                )}
                {basic.website && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <ExternalLink className="w-4 h-4" />
                    <a
                      href={basic.website}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      Visit Website
                    </a>
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="flex items-center text-lg text-gray-700">
                  <span className="h-2 w-2 rounded-full bg-[#F68622] mr-2"></span>
                  <span className="font-semibold">{jobs.length} Days ago</span>
                </div>
              </div>
            </div>

            {/* Dashed Divider */}
            <div className="border-t border-dashed border-[#219CAE] my-6"></div>

            {/* Company Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-6">
              <div className="text-center">
                <p className="text-sm text-[#F68622] font-medium mb-1">
                  Established
                </p>
                <p className="font-bold text-gray-700">
                  Since{" "}
                  {basic.yearFounded ||
                    company.officialInformation?.yearOfEstablishment ||
                    "N/A"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[#F68622] font-medium mb-1">
                  Employees
                </p>
                <p className="font-bold text-gray-700">
                  {basic.totalEmployees ? `${basic.totalEmployees}+` : "N/A"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[#F68622] font-medium mb-1">
                  Salary
                </p>
                <p className="font-bold text-gray-700">3LPA - 5LPA</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[#F68622] font-medium mb-1">
                  Job Posted
                </p>
                <div className="flex items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#F68622] mr-2"></span>
                  <span className="font-bold text-gray-700">4 Days ago</span>
                </div>
              </div>
            </div>

            {/* Another Dashed Divider */}
            <div className="border-t border-dashed border-[#219CAE] my-6"></div>

            {/* About Us Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                About Us
              </h3>
              <p className="text-gray-600 leading-relaxed text-sm">{desc}</p>
            </div>

            {/* Another Dashed Divider */}
            <div className="border-t border-dashed border-[#219CAE] my-6"></div>

            {/* Achievements Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">
                Achievements
              </h3>
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center">
                  <span className="text-gray-400 text-xs">Achievement 1</span>
                </div>
                <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center">
                  <span className="text-gray-400 text-xs">Achievement 2</span>
                </div>
                <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center">
                  <span className="text-gray-400 text-xs">Achievement 3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Jobs Section */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Available Jobs
          </h2>
        </div>

        {jobs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                colors={{
                  primary: "#219CAE",
                  secondary: "#F68622",
                  badge1: "bg-green-50 border-green-100",
                  badge2: "bg-blue-50 border-blue-100",
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              No Open Positions
            </h3>
            <p className="text-gray-500">
              This company does not have any job openings at the moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
