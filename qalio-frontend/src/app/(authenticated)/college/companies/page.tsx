"use client";

import { useState, useEffect } from "react";
import { Search, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getCookie } from "@/utils/getCookie";
import { toast } from "sonner";
import { Pagination } from "@/components/pagination";
import CompanyCard, { CompanyCardSkeleton } from "@/components/company-card";

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

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Fetch companies from the new API
  const fetchCompanies = async () => {
    try {
      const token = getCookie("jwt");
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/designatedCompanies`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        throw new Error("Failed to fetch companies");
      }

      const data = await response.json();

      if (!data.success || !Array.isArray(data.companies)) {
        setCompanies([]);
        toast.info("No companies found");
        return;
      }

      // Transform the API data to match our Company interface
      const transformedCompanies: Company[] = data.companies.map(
        (company: any) => {
          // Handle cases where basic object might not exist
          const basicInfo = company.basic || {};
          const userInfo = company.userId || {};
          const locationInfo = company.location || {};

          return {
            _id: company._id,
            companyName:
              basicInfo.companyName || userInfo.name || "Unknown Company",
            industry: basicInfo.industry || "Technology", // Required field with fallback
            location: [
              locationInfo.address ||
                userInfo.address ||
                "Address not available",
            ],
            website: basicInfo.website,
            description:
              company.about?.description || "No description available",
            logo: basicInfo.logo ? { url: basicInfo.logo } : undefined,
            yearEstablished: basicInfo.yearFounded,
            employeeCount: basicInfo.totalEmployees
              ? `${basicInfo.totalEmployees}`
              : undefined,
            headquarters: basicInfo.hqCity || locationInfo.town,
            jobCount: company.jobs?.length || 0,
            latestJobDate: company.updatedAt,
            // Additional fields
            avatar: userInfo.avatar || basicInfo.logo,
            address: locationInfo.address || userInfo.address,
            totalEmployees: basicInfo.totalEmployees,
            yearFounded: basicInfo.yearFounded,
            hqCity: basicInfo.hqCity,
            annualRevenue: basicInfo.annualRevenue,
            sector: basicInfo.sector,
            companyType: basicInfo.companyType,
            corporateEmail: basicInfo.corporateEmail,
            status: company.status,
            userId: company.userId._id,
          };
        }
      );

      setCompanies(transformedCompanies);

      if (transformedCompanies.length > 0) {
        toast.success(`Found ${transformedCompanies.length} companies`);
      } else {
        toast.info("No companies found");
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
      toast.error("Failed to load companies");
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Filter companies based on search query
  const filteredCompanies = companies.filter((company) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      company.companyName?.toLowerCase().includes(searchLower) ||
      company.industry?.toLowerCase().includes(searchLower) ||
      company.sector?.toLowerCase().includes(searchLower) ||
      company.address?.toLowerCase().includes(searchLower) ||
      company.hqCity?.toLowerCase().includes(searchLower)
    );
  });

  // Get paginated data
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  return (
    <div className="w-full">
      <div className="w-full mx-auto p-2">
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center mt-2.5 mb-8 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Companies ({filteredCompanies.length})
            </h1>

            {/* Search */}
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-base border-gray-200 rounded-lg shadow-sm"
              />
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <CompanyCardSkeleton key={index} />
              ))}
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Building2 className="h-20 w-20 text-gray-300 mb-6" />
              <div className="text-gray-500 text-xl mb-2">
                No companies found
              </div>
              <div className="text-gray-400 text-base text-center">
                {searchQuery
                  ? "Try adjusting your search criteria"
                  : "No companies available at the moment"}
              </div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {paginatedCompanies.map((company) => (
                  <CompanyCard
                    key={company._id}
                    company={company}
                    detailsLink="/college/companies/company-details"
                    colors={{
                      primary: "#219CAE",
                      secondary: "#F68622",
                      badge1: "bg-green-50 border-green-100",
                      badge2: "bg-blue-50 border-blue-100",
                    }}
                  />
                ))}
              </div>

              <div className="mt-12">
                <Pagination
                  currentPage={currentPage}
                  totalItems={filteredCompanies.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  className="mt-6"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
