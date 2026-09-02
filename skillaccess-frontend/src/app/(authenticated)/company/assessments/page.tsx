"use client";

import type React from "react";
import { useEffect, useState } from "react";
import {
  Search,
  Eye,
  UserPlus,
  Filter,
  Plus,
  Clock,
  UserRoundCheck,
  X,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import axios from "axios";
import { getCookie } from "@/utils/getCookie";
import { Pagination } from "@/components/pagination";
import { Skeleton } from "@/components/ui/skeleton";

interface Assessment {
  _id: string;
  name: string;
  inviteOnly?: boolean;
  totalTime: string;
  startDate: string;
  timezone?: string;
  endDate: string;
  candidates?: number;
  totalAttempts?: number;
  createdAt?: string;
  config?: {
    openContest: boolean;
  };
  invitedStudents: [];
}

export default function AssessmentsPage() {
  const [filterStatus, setFilterStatus] = useState("all");
  const [creationDate, setCreationDate] = useState("any");
  const [testTypes, setTestTypes] = useState({
    public: true,
    private: true,
  });
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [assessmentData, setAllAssessmentData] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredAssessments, setFilteredAssessments] = useState<Assessment[]>(
    []
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 8;
  const router = useRouter();

  useEffect(() => {
    const token = getCookie("jwt");
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        // Filter out assessments whose names include '#'
        const filteredAssessments = response.data.assessments
          .filter((assessment: Assessment) => !assessment.name.includes("#"))
          .reverse();
        setAllAssessmentData(filteredAssessments);
      } catch (error) {
        console.error("Error fetching assessments:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = assessmentData;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((assessment) =>
        assessment.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    const now = new Date();
    if (filterStatus !== "all") {
      filtered = filtered.filter((assessment) => {
        const startDate = new Date(assessment.startDate);
        const endDate = new Date(assessment.endDate);
        if (filterStatus === "upcoming") {
          return now < startDate;
        } else if (filterStatus === "ongoing") {
          return now >= startDate && now <= endDate;
        } else if (filterStatus === "completed") {
          return now > endDate;
        }
        return true;
      });
    }

    // Apply test type filter
    filtered = filtered.filter((assessment) => {
      const isPublic = assessment.config?.openContest === true;
      if (isPublic && !testTypes.public) return false;
      if (!isPublic && !testTypes.private) return false;
      return true;
    });

    // Apply creation date filter
    if (creationDate !== "any") {
      const now = new Date();
      filtered = filtered.filter((assessment) => {
        const createdDate = new Date(
          assessment.createdAt || assessment.startDate
        ); // Use createdAt field
        const daysDiff = Math.floor(
          (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        switch (creationDate) {
          case "7days":
            return daysDiff <= 7;
          case "30days":
            return daysDiff <= 30;
          case "90days":
            return daysDiff <= 90;
          default:
            return true;
        }
      });
    }

    setFilteredAssessments(filtered);
  }, [assessmentData, searchQuery, filterStatus, testTypes, creationDate]);

  const handleStatusChange = (status: string) => {
    setFilterStatus(status);
  };

  const handleTestTypeChange = (type: "public" | "private") => {
    setTestTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  const resetFilters = () => {
    setFilterStatus("all");
    setCreationDate("any");
    setTestTypes({
      public: true,
      private: true,
    });
    setSearchQuery("");
    setSearchInput("");
  };

  const getAssessmentStatus = (assessment: Assessment) => {
    const now = new Date();
    const startDate = new Date(assessment.startDate);
    const endDate = new Date(assessment.endDate);

    if (now < startDate) {
      return {
        label: "Upcoming",
        variant: "secondary" as const,
        className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
      };
    } else if (now >= startDate && now <= endDate) {
      return {
        label: "Live",
        variant: "default" as const,
        className: "bg-green-100 text-green-800 hover:bg-green-100",
      };
    } else {
      return {
        label: "Completed",
        variant: "outline" as const,
        className: "bg-red-100 text-red-800 hover:bg-red-100",
      };
    }
  };

  const getTestType = (assessment: Assessment) => {
    return assessment.config?.openContest === true ? "Public" : "Private";
  };

  const paginatedActiveAssessment = filteredAssessments.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  return (
    <div className="min-h-screen p-2">
      <div className="w-full mx-auto">
        <div className="flex justify-between">
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-32 mb-6" />
            ) : (
              <h1 className="text-2xl font-[#jost] mb-6">Assessment</h1>
            )}
          </div>
          <div className="flex gap-3">
            <div className="flex justify-end items-center mb-5.5 gap-2">
              <div className="bg-white relative w-full max-w-md">
                <Input
                  type="text"
                  placeholder="Search by test name"
                  className="pl-10 pr-20 py-2 border rounded-md w-full focus:ring-2 focus:ring-[#219CAE] focus:border-[#219CAE]"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  disabled={isLoading}
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                {searchInput && !isLoading && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 hover:text-gray-600"
                    onClick={clearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <Button
                onClick={handleSearch}
                className="bg-[#219CAE] hover:bg-[#1a7f8e] text-white px-4 py-2"
                disabled={isLoading}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex h-8.5 items-center gap-2 border-[#219CAE] text-[#219CAE] bg-transparent"
                  disabled={isLoading}
                >
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              {!isLoading && (
                <DropdownMenuContent align="end" className="w-72 p-4">
                  <div className="space-y-6">
                    {/* Test status */}
                    <div>
                      <h3 className="font-medium mb-3">Test status</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="all"
                            name="testStatus"
                            className="h-4 w-4 rounded-full text-[#219CAE] focus:ring-[#219CAE]"
                            checked={filterStatus === "all"}
                            onChange={() => handleStatusChange("all")}
                          />
                          <Label htmlFor="all">All</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="upcoming"
                            name="testStatus"
                            className="h-4 w-4 rounded-full text-[#219CAE] focus:ring-[#219CAE]"
                            checked={filterStatus === "upcoming"}
                            onChange={() => handleStatusChange("upcoming")}
                          />
                          <Label htmlFor="upcoming">Upcoming</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="ongoing"
                            name="testStatus"
                            className="h-4 w-4 rounded-full text-[#219CAE] focus:ring-[#219CAE]"
                            checked={filterStatus === "ongoing"}
                            onChange={() => handleStatusChange("ongoing")}
                          />
                          <Label htmlFor="ongoing">Ongoing</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id="completed"
                            name="testStatus"
                            className="h-4 w-4 rounded-full text-[#219CAE] focus:ring-[#219CAE]"
                            checked={filterStatus === "completed"}
                            onChange={() => handleStatusChange("completed")}
                          />
                          <Label htmlFor="completed">Completed</Label>
                        </div>
                      </div>
                    </div>

                    {/* Creation date */}
                    {/* <div>
                      <h3 className="font-medium mb-3">Creation date</h3>
                      <select
                        className="w-full border rounded-md p-2 text-gray-700 focus:ring-2 focus:ring-[#219CAE] focus:border-[#219CAE]"
                        value={creationDate}
                        onChange={(e) => setCreationDate(e.target.value)}
                      >
                        <option value="any">Any time</option>
                        <option value="7days">Last 7 days</option>
                        <option value="30days">Last 30 days</option>
                        <option value="90days">Last 90 days</option>
                        <option value="custom">Custom range</option>
                      </select>
                    </div> */}

                    {/* Test type */}
                    <div>
                      <h3 className="font-medium mb-3">Test type</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="public"
                            checked={testTypes.public}
                            onCheckedChange={() =>
                              handleTestTypeChange("public")
                            }
                          />
                          <Label htmlFor="public">Public</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="private"
                            checked={testTypes.private}
                            onCheckedChange={() =>
                              handleTestTypeChange("private")
                            }
                          />
                          <Label htmlFor="private">Private</Label>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t flex justify-between">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={resetFilters}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          </div>
        </div>

        {/* Create new test button - Always functional */}
        <div className="flex justify-end mb-6">
          <Button
            className="bg-[#219CAE] hover:bg-[#1a7f8e] text-white"
            onClick={() =>
              router.push("/company/assessments/create-assessment")
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            Create new test
          </Button>
        </div>

        {/* Loading skeleton for content area */}
        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="border rounded-lg bg-white p-4 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-6 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-3">
                  <Skeleton className="h-8 w-40 rounded-md" />
                </div>
              </div>
            ))}
            {/* Pagination skeleton */}
            <div className="mt-6">
              <div className="flex justify-center items-center gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Empty states */}
            {filteredAssessments.length === 0 &&
              assessmentData.length === 0 && (
                <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                  <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                    No assessments created yet
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Start by creating your first assessment.
                  </p>
                  <Button
                    onClick={() =>
                      router.push("/company/assessments/create-assessment")
                    }
                    className="mt-6 bg-[#219CAE] hover:bg-[#1a7f8e]"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Assessment
                  </Button>
                </div>
              )}

            {filteredAssessments.length === 0 && assessmentData.length > 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  No assessments match your current filters
                </p>
              </div>
            )}

            {/* Assessment cards */}
            <div className="space-y-4">
              {paginatedActiveAssessment.map((assessment: Assessment) => {
                const status = getAssessmentStatus(assessment);
                const testType = getTestType(assessment);

                return (
                  <div
                    key={assessment._id}
                    className={`border rounded-lg bg-white p-4 hover:shadow-md transition-all cursor-pointer ${
                      selectedCardId === assessment._id
                        ? "border-[#219CAE] border-2"
                        : ""
                    }`}
                    onClick={() => setSelectedCardId(assessment._id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-lg font-medium">{assessment.name}</h2>
                      <div className="flex gap-2">
                        <Badge
                          variant={status.variant}
                          className={status.className}
                        >
                          {status.label}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="bg-purple-100 text-purple-800 hover:bg-purple-100"
                        >
                          {testType}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <UserPlus className="h-4 w-4 text-[#219CAE]" />
                        <span>{testType}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-[#219CAE]" />
                        <span>{assessment.totalTime} Minutes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <UserRoundCheck className="h-4 w-4 text-[#219CAE]" />
                        <span>{assessment.totalAttempts} Attempts Allowed</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-end gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#219CAE] border-[#219CAE] bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `assessments/preview-config-assessment/${assessment._id}`
                          );
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Preview & Configure test
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <div>
              {filteredAssessments.length > 0 && (
                <Pagination
                  currentPage={activePage}
                  totalItems={filteredAssessments.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setActivePage}
                  className="mt-6"
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
