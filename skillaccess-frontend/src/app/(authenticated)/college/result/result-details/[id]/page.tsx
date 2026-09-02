"use client";

import axios from "axios";
import { useEffect } from "react";
import type React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { use, useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CalendarDays,
  Users,
  UserCheck,
  Trophy,
  Star,
  Eye,
  CheckCircle,
  Shield,
  XCircle,
  Search,
  X,
  ArrowUpDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import QalioTable from "@/components/QalioTable";
import { getCookie } from "@/utils/getCookie";
import { toast } from "sonner";
import { BackHeader } from "@/components/backHeader";
import { useAuthStore } from "@/stores/auth-store";
import { Pagination } from "@/components/pagination";
import EnhancedPDFReport2 from "@/components/pdf/enhanced-pdf-report2";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"; // Add DialogTitle
import * as VisuallyHidden from "@radix-ui/react-visually-hidden"; // Import VisuallyHidden

interface AssessmentConfig {
  resultPolicy: "auto" | "manual";
}

interface Assessment {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  appearedStudents: any[];
  invitedStudents: any[];
  level: string;
  totalMarks: number;
  description?: string;
  duration?: number;
  resultList?: any;
  config: AssessmentConfig;
  resultPolicy?: "auto" | "manual";
  totalTime?: number;
  totalQuestionsCount?: number;
  topics?: any[];
  manualResultPublishStatus: string;
  resultPublishedAt: Date;
}

export default function ResultDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobTitle = searchParams.get("jobTitle") || "";
  const { id } = use(params);
  const user: any = useAuthStore((state) => state.user);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appeared");
  const [appearedCandidates, setAppearedCandidates] = useState([]);
  const [shortlisted, setShortlisted] = useState([]);
  const [autoCutoff, setAutoCutoff] = useState<number | "">("");
  const [isApplyingCutoff, setIsApplyingCutoff] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [activePage2, setActivePage2] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [tempSearchTerm, setTempSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>("desc");
  const [minMarks, setMinMarks] = useState<number | "">("");
  const [maxMarks, setMaxMarks] = useState<number | "">("");
  const [studentResponse, setStudentResponse] = useState<any[]>([]);
  const itemsPerPage = 10;

  // Added state to control PDF report visibility
  const [showPdfReport, setShowPdfReport] = useState(false);
  const [examDate, setExamDate] = useState("");
  const columnsData = [
    { label: "Student Name", value: "name" },
    { label: "Email", value: "email" },
    { label: "Total Marks", value: "totalMarksScored" },
    { label: "Submit Date", value: "submittedAt", isFormateDate: true },
    { label: "Time Taken", value: "timeTaken" },
  ];

  const fetchResults = async () => {
    const token = getCookie("jwt");
    if (!token) {
      console.error("Token missing");
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments/results/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // const assessment = response.data.assessment;
      const resultList = response.data.resultList;
      const updatedAssessment = { ...response.data.assessment };

      // const modifiedResultList = resultList.map((candidate: any) => {
      //   const resultPolicy = updatedAssessment.config?.resultPolicy;
      //   const evaluatedStatus = candidate.evaluatedStatus?.toLowerCase();

      //   return {
      //     ...candidate,
      //     totalMarksScored:
      //       resultPolicy === "manual" && evaluatedStatus === "pending"
      //         ? "Pending"
      //         : candidate.totalMarksScored,
      //   };
      // });
      const studentResponses = response.data.studentResponses || [];
      const modifiedResultList = resultList.map((candidate: any) => {
        const resultPolicy = updatedAssessment.config?.resultPolicy;
        const evaluatedStatus = candidate.evaluatedStatus?.toLowerCase();
        const isManual = resultPolicy === "manual";
        const isPublished =
          updatedAssessment.manualResultPublishStatus === "published";

        return {
          ...candidate,
          totalMarksScored:
            isManual && !isPublished && evaluatedStatus === "pending"
              ? "Pending"
              : candidate.totalMarksScored,
          timeTaken: Math.round(
            (new Date(candidate.submittedAt).getTime() -
              new Date(candidate.startedAt).getTime()) /
              60000
          ),
        };
      });

      setAssessment(updatedAssessment);
      setAppearedCandidates(modifiedResultList);
      setShortlisted(response.data.shortlistedList);
      setStudentResponse(studentResponses || []);
      const formattedDate = new Date(
        studentResponses[0].submittedAt
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      setExamDate(formattedDate);
    } catch (err: any) {
      toast.error("Failed to load assessment data");
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      await fetchResults();
      setLoading(false);
    };
    fetchAll();
  }, [id]);

  const filterAndSortCandidates = (
    candidates: any[],
    searchTerm: string,
    sortOrder: "asc" | "desc" | null,
    minMarks: number | "",
    maxMarks: number | ""
  ) => {
    let filtered = candidates;
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim();
      filtered = filtered.filter((candidate) => {
        const name = candidate.name?.toLowerCase() || "";
        const email = candidate.email?.toLowerCase() || "";
        return name.includes(search) || email.includes(search);
      });
    }
    if (minMarks !== "" || maxMarks !== "") {
      filtered = filtered.filter((candidate) => {
        const marks = candidate.totalMarksScored;
        if (typeof marks !== "number") return false;
        const meetsMin = minMarks === "" || marks >= minMarks;
        const meetsMax = maxMarks === "" || marks <= maxMarks;
        return meetsMin && meetsMax;
      });
    }
    if (sortOrder) {
      filtered.sort((a, b) => {
        const marksA =
          typeof a.totalMarksScored === "number"
            ? a.totalMarksScored
            : Number.NEGATIVE_INFINITY;
        const marksB =
          typeof b.totalMarksScored === "number"
            ? b.totalMarksScored
            : Number.NEGATIVE_INFINITY;
        if (sortOrder === "asc") {
          return marksA - marksB;
        } else {
          return marksB - marksA;
        }
      });
    }
    return filtered;
  };

  const filteredAppearedCandidates = useMemo(() => {
    return filterAndSortCandidates(
      appearedCandidates,
      searchTerm,
      sortOrder,
      minMarks,
      maxMarks
    );
  }, [appearedCandidates, searchTerm, sortOrder, minMarks, maxMarks]);

  const filteredShortlisted = useMemo(() => {
    return filterAndSortCandidates(
      shortlisted,
      searchTerm,
      sortOrder,
      minMarks,
      maxMarks
    );
  }, [shortlisted, searchTerm, sortOrder, minMarks, maxMarks]);

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      setSearchTerm(tempSearchTerm);
      setActivePage(1);
      setActivePage2(1);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setTempSearchTerm("");
    setActivePage(1);
    setActivePage2(1);
  };

  const handleAutoCutoff = async () => {
    if (!autoCutoff || autoCutoff <= 0) {
      toast.error("Please enter a valid cutoff score");
      return;
    }
    setIsApplyingCutoff(true);
    const token = getCookie("jwt");
    if (!token) {
      toast.error("Authentication required");
      setIsApplyingCutoff(false);
      return;
    }
    try {
      const qualifiedCandidates = appearedCandidates.filter(
        (candidate: any) =>
          typeof candidate.totalMarksScored === "number" &&
          candidate.totalMarksScored >= autoCutoff
      );
      if (qualifiedCandidates.length === 0) {
        toast.error("No candidates meet the cutoff criteria");
        // setIsApplyingCutoff(false);
        // return;
      }
      const studentIds = qualifiedCandidates.map(
        (candidate: any) => candidate.studentId
      );
      await axios.patch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments/${id}`,
        { selectedStudents: studentIds, cutOff: autoCutoff },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success(
        `${qualifiedCandidates.length} candidates have been shortlisted based on cutoff score of ${autoCutoff}`
      );
      await fetchResults();
      setAutoCutoff("");
    } catch (err: any) {
      console.error("Error applying auto cutoff:", err);
      toast.error("Error applying auto cutoff. Please try again.");
    } finally {
      setIsApplyingCutoff(false);
    }
  };

  const handlePublishResults = async () => {
    const token = getCookie("jwt");
    if (!token) {
      toast.error("Authentication required");
      return;
    }
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments/${id}/evaluate`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("Results published successfully!");
      await fetchResults();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to publish results.";
      toast.error(message);
      console.error("Error publishing results:", error);
    }
  };

  const paginatedActiveAppeared = filteredAppearedCandidates.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  const paginatedActiveShorlisted = filteredShortlisted.slice(
    (activePage2 - 1) * itemsPerPage,
    activePage2 * itemsPerPage
  );

  const StatusBadge = ({
    status,
  }: {
    status: "appeared" | "shortlisted" | "pending";
  }) => {
    let badgeColor =
      "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200";
    let icon = <XCircle className="h-3 w-3" />;
    let text = "Not Selected";

    if (status === "shortlisted") {
      badgeColor =
        "bg-green-100 text-green-800 border-green-200 hover:bg-green-200";
      icon = <Shield className="h-3 w-3" />;
      text = "Selected";
    } else if (status === "pending") {
      badgeColor =
        "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200";
      icon = <CalendarDays className="h-3 w-3" />;
      text = "Pending";
    }

    return (
      <Badge className={`${badgeColor} flex items-center gap-1`}>
        {icon}
        {text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#219CAE] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assessment details...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Assessment Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The assessment you&apos;re looking for doesn&apos;t exist.
          </p>
          <Button
            onClick={() => router.back()}
            className="bg-[#219CAE] hover:bg-[#1a7a8a]"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <BackHeader
            title={
              user?.role === "company"
                ? `${jobTitle} (${assessment.name.split("#")[0].trim()})`
                : assessment.name
            }
          />
        </div>
        <Card className="bg-white border-0 shadow-sm mb-8">
          <CardContent className="p-1 pl-3 pr-3">
            <div className="mb-6 flex justify-between">
              <Badge className="bg-[#F68622] capitalize text-white hover:bg-[#e5761f] px-4 py-2 text-sm font-medium">
                {assessment.level}
              </Badge>
              <div className="flex justify-end gap-3">
                {/* Conditionally render the PDF report component */}
                <Button
                  onClick={() => setShowPdfReport(true)}
                  className="bg-[#219CAE] hover:bg-[#608b92]"
                >
                  View PDF Report
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <div className="bg-[#EEF6FD] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="h-5 w-5 text-[#219CAE]" />
                  <span className="text-sm font-medium text-gray-700">
                    Completed Test
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#219CAE]">
                    {assessment.appearedStudents?.length || 0}
                  </span>
                  <span className="text-sm text-gray-600">Students</span>
                </div>
              </div>
              <div className="bg-[#FFF7E6] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-[#F68622]" />
                  <span className="text-sm font-medium text-gray-700">
                    Invited
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#F68622]">
                    {assessment.invitedStudents?.length || 0}
                  </span>
                  <span className="text-sm text-gray-600">Students</span>
                </div>
              </div>
              <div className="bg-[#EFFCEF] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Total Marks
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-green-600">
                    {assessment.totalMarks || 0}
                  </span>
                  <span className="text-sm text-gray-600">Marks</span>
                </div>
              </div>
              <div className="bg-white border-2 border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded bg-green-100 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-green-600"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Participation Rate
                  </span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-green-600">
                    {assessment?.invitedStudents?.length > 0
                      ? Math.round(
                          (assessment.appearedStudents.length /
                            assessment.invitedStudents.length) *
                            100
                        )
                      : 0}
                  </span>
                  <span className="text-sm text-gray-600">.00%</span>
                </div>
              </div>
              <div className="bg-[#EFFCEF] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">
                    Assessment Period
                  </span>
                </div>
                <div className="space-y-1">
                  <div>
                    <span className="text-xs text-gray-500">Start Date</span>
                    <p className="text-sm font-semibold text-gray-900">
                      {assessment.startDate
                        ? new Date(assessment.startDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-red-500">End Date</span>
                    <p className="text-sm font-semibold text-gray-900">
                      {assessment.endDate
                        ? new Date(assessment.endDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className=" border-0 shadow-sm mb-6">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            {/* Search Input - shifted to the left */}
            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search students by name or email..."
                value={tempSearchTerm}
                onChange={(e) => setTempSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#219CAE] focus:border-transparent w-full"
              />
              {(tempSearchTerm || searchTerm) && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            {/* Right-side filters: Min/Max and Sort */}
            <div className="flex items-center gap-4 flex-wrap justify-end">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Min Marks"
                  value={minMarks}
                  onChange={(e) =>
                    setMinMarks(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-28"
                  min="0"
                  max={assessment?.totalMarks}
                />
                <Input
                  type="number"
                  placeholder="Max Marks"
                  value={maxMarks}
                  onChange={(e) =>
                    setMaxMarks(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-28"
                  min="0"
                  max={assessment?.totalMarks}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="shrink-0 bg-transparent">
                    <ArrowUpDown className="w-4 h-4 mr-2" /> Sort by Marks{" "}
                    {sortOrder === "asc"
                      ? "(Low to High)"
                      : sortOrder === "desc"
                      ? "(High to Low)"
                      : ""}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[200px]" align="end">
                  <DropdownMenuRadioGroup
                    value={sortOrder || ""}
                    onValueChange={(value) =>
                      setSortOrder(value as "asc" | "desc" | null)
                    }
                  >
                    <DropdownMenuRadioItem value="asc">
                      Marks: Low to High
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="desc">
                      Marks: High to Low
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="">
                      Clear Sort
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
          {searchTerm && (
            <p className="text-sm text-gray-600 mt-2 px-4 pb-4">
              Showing results for:{" "}
              <span className="font-medium">&quot;{searchTerm}&quot;</span>
            </p>
          )}
        </Card>
        <div>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="appeared"
                  className="data-[state=active]:bg-[#219CAE] data-[state=active]:text-white"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Appeared Candidates ({filteredAppearedCandidates.length})
                </TabsTrigger>
                <TabsTrigger
                  value="shortlisted"
                  className="data-[state=active]:bg-[#F68622] data-[state=active]:text-white"
                >
                  <Star className="h-4 w-4 mr-2" />
                  Shortlisted Candidates ({filteredShortlisted.length})
                </TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="appeared" className="mt-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      All Appeared Candidates
                    </h3>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className="text-[#219CAE] capitalize border-[#219CAE]"
                      >
                        {filteredAppearedCandidates.length} candidates
                      </Badge>
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-gray-700">
                        Apply Auto Cutoff:
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={autoCutoff}
                          onChange={(e) =>
                            setAutoCutoff(
                              e.target.value === ""
                                ? ""
                                : Number(e.target.value)
                            )
                          }
                          placeholder="Enter cutoff score"
                          className="px-3 py-2 w-44 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#219CAE] focus:border-transparent"
                          min="0"
                          max={assessment?.totalMarks}
                        />
                        <Button
                          onClick={handleAutoCutoff}
                          disabled={isApplyingCutoff || !autoCutoff}
                          className="bg-[#219CAE] hover:bg-[#1a7a8a] text-white px-4 py-2 text-sm"
                        >
                          {isApplyingCutoff ? "Applying..." : "Apply Cutoff"}
                        </Button>
                      </div>
                      <span className="text-xs text-gray-500">
                        Candidates scoring {autoCutoff || "X"} or above will be
                        shortlisted
                      </span>
                    </div>
                  </div>
                  {/* {assessment.config?.resultPolicy === "manual" && (
                    <div className="flex justify-end mb-4">
                      <Button
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={handlePublishResults}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Publish Results
                      </Button>
                    </div>
                  )} */}
                  {assessment?.config?.resultPolicy === "manual" && (
                    <div className="flex justify-end mb-4">
                      {assessment.manualResultPublishStatus === "published" ? (
                        <Badge
                          variant="outline"
                          className="text-[#219CAE] capitalize text-sm border-[#219CAE]"
                        >
                          ✅ Results published on{" "}
                          {new Date(
                            assessment.resultPublishedAt
                          ).toLocaleString()}
                        </Badge>
                      ) : (
                        <Button
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={handlePublishResults}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Publish Results
                        </Button>
                      )}
                    </div>
                  )}

                  {filteredAppearedCandidates.length > 0 ? (
                    <div className="flex flex-col flex-1 mt-6">
                      <QalioTable
                        rowData={paginatedActiveAppeared ?? []}
                        columnsData={columnsData}
                        avatarRequired={true}
                        actionButtons={[
                          {
                            name: "View",
                            icon: (props) => (
                              <Eye
                                {...props}
                                className="text-black"
                                style={{ strokeWidth: 1.25 }}
                              />
                            ),
                            onClick: (row) => {
                              const path =
                                user?.role === "company"
                                  ? "student-result-company"
                                  : "student-result";
                              router.push(
                                `/${user?.role}/result/${path}/${row.studentId}?assessmentId=${id}&jobTitle=${jobTitle}`
                              );
                            },
                            type: "warning",
                          },
                        ]}
                      />
                      <div className="mt-6 flex justify-center">
                        <Pagination
                          currentPage={activePage}
                          totalItems={filteredAppearedCandidates.length}
                          itemsPerPage={itemsPerPage}
                          onPageChange={setActivePage}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchTerm
                          ? "No candidates found"
                          : "No candidates appeared yet"}
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm
                          ? `No candidates match your search for "${searchTerm}"`
                          : "Candidates who take the assessment will appear here."}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              <TabsContent value="shortlisted" className="mt-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Shortlisted Candidates
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-[#F68622] capitalize border-[#F68622]"
                    >
                      {filteredShortlisted.length} candidates
                    </Badge>
                  </div>
                  {filteredShortlisted.length > 0 ? (
                    <div>
                      <QalioTable
                        rowData={paginatedActiveShorlisted ?? []}
                        columnsData={columnsData}
                        avatarRequired={true}
                        actionButtons={[
                          {
                            name: "View",
                            icon: (props) => (
                              <Eye
                                {...props}
                                className="text-black"
                                style={{ strokeWidth: 1.25 }}
                              />
                            ),
                            onClick: (row) => {
                              const path =
                                user?.role === "company"
                                  ? "student-result-company"
                                  : "student-result";
                              router.push(
                                `/${user?.role}/result/${path}/${row.studentId}?assessmentId=${id}&jobTitle=${jobTitle}`
                              );
                            },
                            type: "warning",
                          },
                        ]}
                      />
                      <Pagination
                        currentPage={activePage2}
                        totalItems={filteredShortlisted.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setActivePage2}
                        className="mt-6"
                      />
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {searchTerm
                          ? "No candidates found"
                          : "No shortlisted candidates"}
                      </h3>
                      <p className="text-gray-600">
                        {searchTerm
                          ? `No shortlisted candidates match your search for "${searchTerm}"`
                          : "Shortlisted candidates will appear here based on your criteria."}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </div>
      </div>
      {/* Dialog for PDF Report */}
      <Dialog open={showPdfReport} onOpenChange={setShowPdfReport}>
        <DialogContent
          style={{ maxWidth: "none" }}
          className="w-[104vh] h-[90vh] p-0 overflow-hidden"
        >
          <VisuallyHidden.Root>
            <DialogTitle>PDF Report</DialogTitle>
          </VisuallyHidden.Root>
          {assessment && (
            <EnhancedPDFReport2
              assessment={assessment}
              appearedCandidates={appearedCandidates}
              shortlistedCandidates={shortlisted}
              studentResponses={studentResponse}
              jobTitle={jobTitle}
              examDate={examDate}
              onClose={() => setShowPdfReport(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
