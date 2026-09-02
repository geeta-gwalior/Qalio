"use client";

import OverviewSection from "@/components/overviewSection";
import QalioTable from "@/components/QalioTable";
import { Eye, PlusIcon } from "lucide-react";
import { Pagination } from "@/components/pagination";
import { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "@/utils/getCookie";
import { useRouter } from "next/navigation";

const getAssessmentStatus = (endDate: string) => {
  const currentTime = new Date().getTime();
  const endTime = new Date(endDate).getTime();
  return currentTime < endTime ? "Ongoing" : "Completed";
};

const columnsData = [
  {
    label: "Assessment Name",
    value: "name",
    isLink: true,
    linkHref: (row: any) => `/college/result/result-details/${row._id}`,
  },
  { label: "Student Invited", value: "invitedStudents.length" },
  { label: "Level", value: "level" },
  { label: "Appeared Students", value: "appearedStudents.length" },
  { label: "Status", value: "status" },
  { label: "CreatedAt", value: "createdAt", isFormateDate: true },
];

export default function CollegeResult() {
  const router = useRouter();
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 6;
  const [assessmentData, setAssessmentData] = useState<any[]>([]);
  const [jobsData, setJobsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const statsData2 = [
    {
      title: "Assessment Created",
      value: `${assessmentData.length}`,
      bgColor: "bg-[#E6F5F9]",
      textColor: "text-[#219CAE]",
    },
    {
      title: "Available Jobs",
      value: jobsData.length.toString(),
      bgColor: "bg-[#EFFCEF]",
      textColor: "text-[#219CAE]",
    },
  ];

  // Enhanced chart data with more metrics
  const chartData = assessmentData
    .sort(
      (a: any, b: any) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    .reverse()
    .map((assessment: any) => {
      const appearedCount = assessment.appearedStudents?.length || 0;
      const invitedCount = assessment.invitedStudents?.length || 0;
      const participationRate =
        invitedCount > 0 ? Math.round((appearedCount / invitedCount) * 100) : 0;

      return {
        name: assessment.name,
        value: appearedCount, // Primary Y-axis: appeared students
        invitedCount: invitedCount, // Additional data for tooltip
        participationRate: participationRate, // Participation percentage
        fullName: assessment.name,
        createdAt: assessment.createdAt,
        status: assessment.status,
        level: assessment.level,
        totalMarks: assessment.totalMarks || 0,
        totalTime: assessment.totalTime || 0,
        totalQuestions: assessment.totalQuestionsCount || 0,
        type: assessment.type || "mcq",
        isReportGenerated: assessment.isReportGenerated || false,
        // Calculate days since creation for additional context
        daysAgo: Math.floor(
          (Date.now() - new Date(assessment.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      };
    });

  useEffect(() => {
    const fetchData = async () => {
      const token = getCookie("jwt");
      if (!token) return;

      try {
        setLoading(true);
        setError(null);
        // Fetch assessments
        const assessmentResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments/my`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const data = assessmentResponse.data.assessments;
        const filtered = data.filter(
          (d: { startDate: string }) =>
            new Date(d.startDate).getTime() <= Date.now()
        );
        const processed = filtered.map((item: any) => ({
          ...item,
          status: getAssessmentStatus(item.endDate),
        }));
        setAssessmentData(processed);

        // Fetch jobs
        const jobsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/college/jobs`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const jobsData = await jobsResponse.json();
        setJobsData(jobsData.jobs || []);
        setIsFirstTimeUser(assessmentResponse.data.isFirstTimeUser || false);
      } catch (error: any) {
        console.log("Error from results:", error);
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

    fetchData();
  }, []);

  const paginatedActive = assessmentData.slice(
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
      <h2 className="text-xl font-[#jost] font-semibold text-gray-800 mb-6">
        Overview
      </h2>

      <OverviewSection
        stats={statsData2}
        divClassName="w-full lg:w-1/3 grid grid-row-2 gap-6"
        chartData={chartData}
        chartTitle="Assessment Performance Analytics"
      />

      <h2 className="text-xl font-semibold text-gray-800 mb-6 mt-6 font-[#jost]">
        Result Status
      </h2>
      {assessmentData.length > 0 ? (
        <>
          <div className="flex flex-1 mt-6">
            <QalioTable
              rowData={paginatedActive}
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
                    router.push(`/college/result/result-details/${row._id}`);
                  },
                  type: "warning",
                },
              ]}
            />
          </div>
          <Pagination
            currentPage={activePage}
            totalItems={assessmentData.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setActivePage}
            className="mt-6"
          />
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
                ? "You're new to our platform! Conduct your first assessment to start building your student's skill profile and unlock exciting job opportunities."
                : "You haven't created any assessments yet. Start taking assessments to see your results here."}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/college/assessments")}
                className="inline-flex items-center px-6 py-3 bg-[#219CAE] text-white rounded-lg hover:bg-[#219CAE] transition-colors font-medium"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                {isFirstTimeUser
                  ? "Conduct Your First Assessment"
                  : "Take Assessment"}
              </button>
              <p className="text-sm text-gray-500">
                Add assessments to start tracking student results and progress.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
