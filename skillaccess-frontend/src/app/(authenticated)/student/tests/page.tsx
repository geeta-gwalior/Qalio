"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination } from "@/components/pagination";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getCookie } from "@/utils/getCookie";
import AssessmentCard from "@/components/assessment-card";
import { AssessmentData } from "@/types/assessment";

export default function AssessmentDashboard() {
  const [activePage, setActivePage] = useState(1);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const itemsPerPage = 6;
  const [assessments, setAssessments] = useState<AssessmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getCookie("jwt");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments/invited`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch assessments");
      }

      const data = await response.json();

      if (data.success) {
        // Transform backend data to match frontend interface
        const transformedAssessments = data.assessments.map(
          (assessment: any) => {
            return {
              _id: assessment._id,
              name: assessment?.name?.split("#")[0]?.trim() || "",
              additionalDescription: assessment.additionalDescription,
              totalTime: assessment.totalTime,
              totalMarks: assessment.totalMarks,
              totalQuestionsCount: assessment.totalQuestionsCount,
              totalAttempts: assessment.totalAttempts,
              attemptCount: assessment.attemptCount,
              status: assessment.status,
              level: assessment.level,
              type: assessment.type,
              startDate: assessment.startDate,
              endDate: assessment.endDate,
              categoryName: assessment.categoryName,
              createdBy: assessment.createdBy,
              attemptsUsed: assessment?.attemptsUsed,
            };
          }
        );

        setAssessments(transformedAssessments);

        // Show success toast
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);

      // Show error toast
      toast.error(`Failed to load assessments: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  // Define current time
  const now = new Date();

  // Categorize assessments
  const activeAssessments = assessments.filter((assessment) => {
    const start = new Date(assessment.startDate || "");
    const end = new Date(assessment.endDate || assessment.startDate || "");
    return start <= now && end >= now;
  });

  const upcomingAssessments = assessments.filter((assessment) => {
    const start = new Date(assessment.startDate || "");
    return start > now;
  });

  const pastAssessments = assessments.filter((assessment) => {
    const end = new Date(assessment.endDate || assessment.startDate || "");
    return end < now;
  });

  // Paginated data
  const paginatedActive = activeAssessments.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  const paginatedUpcoming = upcomingAssessments.slice(
    (upcomingPage - 1) * itemsPerPage,
    upcomingPage * itemsPerPage
  );

  const [pastPage, setPastPage] = useState(1);
  const paginatedPast = pastAssessments.slice(
    (pastPage - 1) * itemsPerPage,
    pastPage * itemsPerPage
  );

  return (
    <>
      <h1 className="text-l mb-2 mt-7 font-bold ">Your Assessments</h1>
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="w-full grid grid-cols-3 h-14 border border-black p-0 rounded-lg bg-gray-100 overflow-hidden">
          <TabsTrigger
            value="active"
            className="rounded-none first:rounded-l-lg data-[state=active]:bg-[#E6F5F9] data-[state=active]:text-black bg-white"
          >
            Active Assessments
          </TabsTrigger>
          <TabsTrigger
            value="upcoming"
            className="rounded-none last:rounded-r-lg data-[state=active]:bg-[#E6F5F9] data-[state=active]:text-black bg-white"
          >
            Upcoming Assessments
          </TabsTrigger>
          <TabsTrigger
            value="past"
            className="rounded-none last:rounded-r-lg data-[state=active]:bg-[#E6F5F9] data-[state=active]:text-black bg-white"
          >
            Past Assessments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          <div className="flex flex-col min-h-[78vh] ">
            <div className="flex  flex-1 flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-xl shadow space-y-4"
                    >
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-24 w-full" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-10" />
                      </div>
                    </div>
                  ))
                ) : paginatedActive.length > 0 ? (
                  paginatedActive.map((assessment) => (
                    <AssessmentCard
                      key={assessment._id}
                      assessment={assessment}
                      type="fraction"
                    />
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      No Active Assessments
                    </h3>
                    <p className="text-gray-500 max-w-md">
                      You don&apos;t have any active assessments at the moment.
                      Check back later or contact your instructor.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Pagination
            currentPage={activePage}
            totalItems={activeAssessments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setActivePage}
            className="mt-auto p-4"
          />
        </TabsContent>

        <TabsContent value="upcoming" className="mt-4">
          <div className="flex flex-col min-h-[78vh] ">
            <div className="flex  flex-1 flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-xl shadow space-y-4"
                    >
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-28" />{" "}
                      <Skeleton className="h-20 w-full" />
                      <div className="flex justify-end">
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  ))
                ) : paginatedUpcoming.length > 0 ? (
                  paginatedUpcoming.map((assessment) => (
                    <AssessmentCard
                      key={assessment._id}
                      assessment={assessment}
                      type="fraction"
                    />
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      No Upcoming Assessments
                    </h3>
                    <p className="text-gray-500 max-w-md">
                      You don&apos;t have any upcoming assessments scheduled.
                      New assessments will appear here when available.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Pagination
            currentPage={upcomingPage}
            totalItems={upcomingAssessments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setUpcomingPage}
            className="mt-auto p-4"
          />
        </TabsContent>
        <TabsContent value="past" className="mt-4">
          <div className="flex flex-col min-h-[78vh] ">
            <div className="flex flex-1 flex-col">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loading ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-xl shadow space-y-4"
                    >
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-20 w-full" />
                      <div className="flex justify-end">
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  ))
                ) : paginatedPast.length > 0 ? (
                  paginatedPast.map((assessment) => (
                    <AssessmentCard
                      key={assessment._id}
                      assessment={assessment}
                      type="fraction"
                    />
                  ))
                ) : (
                  <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                      <svg
                        className="w-10 h-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      No Past Assessments
                    </h3>
                    <p className="text-gray-500 max-w-md">
                      You don&apos;t have any past assessments available.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Pagination
            currentPage={pastPage}
            totalItems={pastAssessments.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setPastPage}
            className="mt-auto p-4"
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
