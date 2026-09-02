"use client";

import OverviewSection from "@/components/overviewSection";
import QalioTable from "@/components/QalioTable";
import { Eye, PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "@/utils/getCookie";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Pagination } from "@/components/pagination";
import { toast } from "sonner";

export default function Dashboard() {
  const [assessmentData, setAssessmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobsData, setJobsData] = useState<any>(null);
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [itemsPerPage] = useState(4);
  const user: any = useAuthStore((state) => state.user);
  const [error, setError] = useState<string | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  const columnsData = [
    {
      label: "Assessment",
      value: "Name",
      isLink: true,
      linkHref: (row: any) =>
        `/student/results/student-assessment-result/${studentId}?assessmentId=${row.assessmentId}`,
    },
    { label: "Marks", value: "highestAttemptMarks" },
    { label: "Total Time", value: "time" },
    { label: "Status", value: "status" },
    { label: "Level", value: "level" },
    { label: "Submission Time", value: "submittedAt", isFormateDate: true },
  ];

  function calculateAverageScore(assessments: any) {
    if (!assessments || assessments.length === 0) return 0;
    let totalScore = 0;
    let count = 0;
    let totalAvgScore = 0;

    for (const assessment of assessments) {
      if (
        assessment.highestAttemptMarks !== undefined &&
        typeof assessment.highestAttemptMarks === "number"
      ) {
        totalScore += assessment.highestAttemptMarks;
        count += 1;
      }
      totalAvgScore += assessment.assessmentTotalMarks;
    }

    const average = count > 0 ? (totalScore / totalAvgScore) * 100 : 0;
    return average.toFixed(2);
  }

  // Calculate highest package from jobs data
  const getHighestPackage = () => {
    if (!jobsData?.jobs?.length) return "N/A";
    const maxSalary = Math.max(
      ...jobsData.jobs.map((job: any) => job.salaryRange?.max || 0)
    );
    return maxSalary > 0 ? `₹${maxSalary}L` : "N/A";
  };

  const statsData2 = [
    {
      title: "Completed Assessment",
      value: `${assessmentData.length}`,
      bgColor: "bg-[#E6F5F9]",
      textColor: "text-[#219CAE]",
    },
    {
      title: "Average Marks",
      value: `${calculateAverageScore(assessmentData)}%`,
      bgColor: "bg-[#EFFCEF]",
      textColor: "text-[#219CAE]",
    },
    {
      title: "Available Jobs",
      value: jobsData?.totalJobs?.toString() || "0",
      bgColor: "bg-[#EFFCEF]",
      textColor: "text-[#219CAE]",
    },
    {
      title: "Highest Package",
      value: getHighestPackage(),
      bgColor: "bg-[#EEF6FD]",
      textColor: "text-[#219CAE]",
    },
  ];

  // Chart data for student assessments showing marks scored
  const chartData = assessmentData

    // Show last 10 assessments
    .map((assessment: any) => {
      const marksScored = assessment.highestAttemptMarks || 0;
      const totalMarks = assessment.assessmentTotalMarks || 1;
      const percentage = Math.round((marksScored / totalMarks) * 100);
      const selectedStudentsList =
        assessment.assessmentInfo?.selectedStudents || [];
      const isShortlisted = selectedStudentsList.includes(user._id);

      return {
        name: assessment.Name,
        value: marksScored,
        totalMarks: totalMarks,
        percentage: percentage,
        fullName: assessment.Name,
        submittedAt: assessment.submittedAt,
        status: isShortlisted ? "Shortlisted" : "Not Yet",
        level: assessment.level,
        totalTime: assessment.time?.replace(" min", "") || 0,
        totalAttempts: assessment.totalAttempts || 1,
        isShortlisted: assessment.status === "Shortlisted",
        daysAgo: Math.floor(
          (Date.now() - new Date(assessment.submittedAt).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      };
    })
    .reverse();

  useEffect(() => {
    const fetchResults = async () => {
      const token = getCookie("jwt");
      // console.log("Token from cookie:", token);

      try {
        setLoading(true);
        setError(null);

        // Fetch student results
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/result`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const stdId = res.data.studentId;
        setStudentId(stdId);
        setIsFirstTimeUser(res.data.isFirstTimeUser || false);

        // console.log("Results from API:", res.data);

        // Handle empty assessments array (first-time users)
        if (!res.data.assessments || res.data.assessments.length === 0) {
          setAssessmentData([]);
        } else {
          // Transform the API response to match table format
          const transformedData = res.data.assessments.map(
            (assessment: any) => {
              const selectedStudentsList =
                assessment.assessmentInfo.selectedStudents || [];
              const isShortlisted = selectedStudentsList.includes(user._id);

              return {
                Name: assessment.assessmentInfo.name?.split("#")[0]?.trim(),
                avatar: "https://www.w3schools.com/w3images/avatar2.png",
                highestAttemptMarks:
                  assessment.highestScoringAttempt.totalMarksScored,
                time: `${assessment.assessmentInfo.totalTime} min`,
                level: assessment.assessmentInfo.level,
                submittedAt: assessment.highestScoringAttempt.submittedAt,
                status: isShortlisted ? "Shortlisted" : "Not Yet",
                progress: Math.min(
                  (assessment.highestScoringAttempt.totalMarksScored / 12) *
                    100,
                  100
                ),
                totalAttempts: assessment.totalAttempts,
                assessmentId: assessment.assessmentId,
                attemptId: assessment.highestScoringAttempt.attemptId,
                assessmentTotalMarks: assessment.assessmentInfo.totalMarks,
                selectedStudentsList: selectedStudentsList,
              };
            }
          );

          setAssessmentData(transformedData.reverse());
        }

        // Fetch available jobs for student
        const jobsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/student/${user._id}/available`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const jobsData = await jobsResponse.json();
        setJobsData(jobsData);
      } catch (error: any) {
        toast.error(`Error from results: ${error}`);
        // Handle 404 specifically for first-time users (if backend still returns 404)
        if (error.response?.status === 404) {
          setAssessmentData([]);
          setIsFirstTimeUser(true);
        } else {
          setError("Failed to load assessment data. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [user._id]);

  const paginatedData = assessmentData.slice(
    (activePage - 1) * itemsPerPage,
    activePage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-[jost] font-semibold text-gray-800 mb-6">
          Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-6 mt-6 font-[jost]">
          Result Status
        </h2>
        <div className="bg-gray-100 rounded-lg h-64 animate-pulse flex items-center justify-center">
          <div className="text-gray-500">Loading assessment results...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-[jost] font-semibold text-gray-800 mb-6">
          Overview
        </h2>
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Eye className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Unable to Load Data
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                window.location.reload();
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-xl font-[jost] font-semibold text-gray-800 mb-6">
        Overview
      </h2>

      <OverviewSection
        stats={statsData2}
        chartData={chartData}
        chartTitle="Assessment Performance Analytics"
        yAxisLabel="Marks Scored"
      />

      <h2 className="text-xl font-semibold text-gray-800 mb-6 mt-6 font-[jost]">
        Result Status
      </h2>

      {assessmentData.length > 0 ? (
        <>
          <div className="flex flex-1 mt-6">
            <QalioTable
              rowData={paginatedData}
              columnsData={columnsData}
              actionButtons={[
                {
                  name: "View",
                  icon: (props) => (
                    <Eye
                      {...props}
                      className="text-black "
                      style={{ strokeWidth: 1.25 }}
                    />
                  ),
                  onClick: (row) => {
                    router.push(
                      `/student/results/student-assessment-result/${studentId}?assessmentId=${row.assessmentId}`
                    );
                  },
                  type: "primary",
                },
              ]}
            />
          </div>
          <div className="mt-auto flex justify-center pt-8">
            <div className="p-4">
              <Pagination
                currentPage={activePage}
                totalItems={assessmentData.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setActivePage}
              />
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 px-4 mt-8">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
              <Eye className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isFirstTimeUser
                ? "Welcome to Qalio! 🎉"
                : "No Assessment Results Yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {isFirstTimeUser
                ? "You're new to our platform! Take your first assessment to start building your skill profile and unlock exciting job opportunities."
                : "You haven't completed any assessments yet. Start taking assessments to see your results here."}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/student/tests")}
                className="inline-flex items-center px-6 py-3 bg-[#219CAE] text-white rounded-lg hover:bg-[#219CAE] transition-colors font-medium"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                {isFirstTimeUser
                  ? "Take Your First Assessment"
                  : "Take Assessment"}
              </button>
              <p className="text-sm text-gray-500">
                Complete assessments to showcase your skills to potential
                employers
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
