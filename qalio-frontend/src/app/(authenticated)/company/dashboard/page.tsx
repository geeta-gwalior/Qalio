"use client";

import OverviewSection from "@/components/overviewSection";
import QalioTable from "@/components/QalioTable";
import { Eye, PlusIcon } from "lucide-react";
import { Pagination } from "@/components/pagination";
import { useEffect, useState } from "react";
import axios from "axios";
import { getCookie } from "@/utils/getCookie";
import { useRouter } from "next/navigation";

const columnsData = [
  { label: "Job Name", value: "jobTitle" },
  { label: "Assessment Name", value: "assessmentName" },
  { label: "Student Invited", value: "assessment.invitedStudents.length" },
  { label: "Appeared Students", value: "assessment.appearedStudents.length" },
  { label: " Job Type", value: "jobType" },
];

export default function CompanyDashboard() {
  const router = useRouter();
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 6;
  const [jobsData, setJobsData] = useState([]);
  const [assessmentData, setAssessmentData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const statsData2 = [
    {
      title: "Tests Conducted",
      value: `${assessmentData.length}`,
      bgColor: "bg-[#E6F5F9]",
      textColor: "text-[#219CAE]",
    },
    {
      title: "Jobs Created",
      value: `${jobsData.length}`,
      bgColor: "bg-[#EFFCEF]",
      textColor: "text-[#219CAE]",
    },
  ];

  // Transform jobs data for chart - show ALL jobs, not just last 5
  const chartData = jobsData

    .map((job: any) => {
      const createdDate = new Date(job.createdAt);
      const daysAgo = Math.floor(
        (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        name: job.jobTitle,
        value: daysAgo, // Days since creation
        fullName: job.jobTitle,
        createdAt: job.createdAt,
      };
    })
    .reverse(); // Reverse to show most recent first

  useEffect(() => {
    const fetchData = async () => {
      const token = getCookie("jwt");
      if (!token) return;

      try {
        setLoading(true);
        setError(null);
        const assessmentResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/company/assessment/result`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = assessmentResponse.data.jobs;
        const jobsWithAssessments = data.filter((item: any) => item.assessment);
        if (jobsWithAssessments.length > 0) {
          setIsFirstTimeUser(false);
        } else {
          setIsFirstTimeUser(true);
        }

        const processed = jobsWithAssessments.map((item: any) => ({
          ...item,
          assessmentName: item.assessment?.name.split("#")[0].trim() || "N/A",
        }));

        setAssessmentData(processed);

        const jobsResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/company`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setJobsData(jobsResponse.data.jobs || []);
     //   setIsFirstTimeUser(assessmentResponse.data.isFirstTimeUser || false);
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

  const reverseData = assessmentData.slice().reverse();
  const paginatedActive = reverseData.slice(
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
      />
      <h2 className="text-xl font-semibold text-gray-800 mb-6 mt-6 font-[#jost]">
        Jobs Status
      </h2>
      {assessmentData.length > 0 ? (
        <>
          <div className="flex flex-1 mt-6">
            <QalioTable
              rowData={paginatedActive}
              columnsData={columnsData}
              avatarRequired={true}
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
                      `/company/result/result-details-company/${
                        row?.assessment?._id
                      }?jobTitle=${encodeURIComponent(row.jobTitle)}`
                    );
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
                ? "You're new to our platform! Conduct your first assessment to hire the best talent."
                : "You haven't created any assessments yet. Start taking assessments to see your results here."}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/company/jobs/create")}
                className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium shadow-xs"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                {isFirstTimeUser
                  ? "Post Your First Job"
                  : "Post Your First Job with Assessment"}
              </button>
              <p className="text-sm text-gray-500">
                Add assessments to hire the best talent and track their progress
                effectively.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
