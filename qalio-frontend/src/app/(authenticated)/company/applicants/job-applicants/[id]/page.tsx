"use client";

import { useEffect, useState, use } from "react";
import { EyeIcon } from "lucide-react";
import QalioTable from "@/components/QalioTable";
import { Pagination } from "@/components/pagination";
import { getCookie } from "@/utils/getCookie";
import axios from "axios";
import { BackHeader } from "@/components/backHeader";
import formatDate from "@/utils/dateFormatter";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface JobDashboardProps {
  params: Promise<{
    id?: string;
  }>;
}

import { BrainCircuit, MailIcon } from "lucide-react";

// Update Columns to include AI Score
const columnsData = [
  { label: "Student Name", value: "studentName" },
  { label: "Batch", value: "batch" },
  { label: "Major", value: "major" },
  { label: "Application Status", value: "applicationStatus" },
  {
    label: "AI Match Score",
    value: "aiMatchScore",
    render: (row: any) => {
      if (row.aiMatchScore) {
        const isGood = row.aiMatchScore >= 80;
        const isAvg = row.aiMatchScore >= 60;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${isGood ? 'bg-green-100 text-green-700' : isAvg ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
            {row.aiMatchScore}% Match
          </span>
        );
      }
      return <span className="text-gray-400 text-xs italic">Not Screened</span>;
    },
  },
  {
    label: "Application Date",
    value: "applicationDate",
    render: (row: any) => row.applicationDate,
  },
];

export default function JobDashboard({ params }: JobDashboardProps) {
  const { id } = use(params);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [filteredApplicants, setFilteredApplicants] = useState<any[]>([]);
  const [selectedJobInfo, setSelectedJobInfo] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");
  const itemsPerPage = 6;

  const fetchApplicants = async () => {
    try {
      if (!id) return;
      const token = getCookie("jwt");
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/company/applicants-data/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const applicantsData = res.data.data || [];

      const formattedApplicants = applicantsData.map((applicant: any) => ({
        ...applicant,
        applicationDate: formatDate(applicant.applicationDate),
      }));

      setApplicants(formattedApplicants);
      setFilteredApplicants(formattedApplicants);

      if (formattedApplicants.length > 0) {
        setSelectedJobInfo({
          jobTitle: formattedApplicants[0].jobTitle,
          jobType: formattedApplicants[0].jobType,
        });
      }
    } catch (err) {
      console.error("Error fetching applicants", err);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, [id]);

  // Filter & Search logic
  useEffect(() => {
    const filtered = applicants.filter((a) => {
      const nameMatch = a.studentName
        .toLowerCase()
        .includes(search.toLowerCase());
      const batchMatch = batchFilter === "All" || a.batch === batchFilter;
      return nameMatch && batchMatch;
    });
    setFilteredApplicants(filtered);
    setCurrentPage(1); // reset to first page on filter
  }, [search, batchFilter, applicants]);

  const paginated = filteredApplicants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const uniqueBatches = Array.from(new Set(applicants.map((a) => a.batch)));

  const handleAIScreening = async (applicationId: string) => {
    try {
      const token = getCookie("jwt");
      await axios.post(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/job/application/${applicationId}/screen-ai`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("AI Screening completed successfully!");
      fetchApplicants(); // refresh data
    } catch (err) {
      console.error(err);
      alert("Failed to perform AI Screening");
    }
  };

  const handleStatusChange = async (applicationId: string, status: string) => {
    try {
      const token = getCookie("jwt");
      const confirmEmail = window.confirm(`Change status to ${status} and send automated email?`);
      if (!confirmEmail) return;

      await axios.put(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/job/application/${applicationId}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Status updated and email sent to candidate!`);
      fetchApplicants(); // refresh data
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  return (
    <div className="space-y-6 font-sans p-4 min-h-[300px]">
      {selectedJobInfo && (
        <BackHeader
          title={`Job Applicants for ${selectedJobInfo.jobTitle}`}
          defaultRoute="/company/applicants"
        />
      )}

      <div className="flex justify-end gap-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <Input
            type="text"
            placeholder="Search student name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 border border-gray-300 bg-white"
          />

          <Select value={batchFilter} onValueChange={setBatchFilter}>
            <SelectTrigger className="w-full md:w-40 border border-gray-300 bg-white">
              <SelectValue placeholder="Filter by Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Batches</SelectItem>
              {uniqueBatches.map((batch) => (
                <SelectItem key={batch} value={batch}>
                  {batch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredApplicants.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-500 text-lg italic border border-dashed border-gray-300 rounded-md">
          No applicants found for the selected filters.
        </div>
      ) : (
        <>
          <QalioTable
            rowData={paginated}
            columnsData={columnsData}
            avatarRequired={false}
            actionButtons={[
              {
                name: "AI Screen",
                icon: BrainCircuit,
                onClick: (row) => handleAIScreening(row.applicationId),
                type: "secondary",
              },
              {
                name: "Shortlist",
                icon: MailIcon,
                onClick: (row) => handleStatusChange(row.applicationId, "Shortlisted"),
                type: "primary",
              },
              {
                name: "Reject",
                icon: MailIcon,
                onClick: (row) => handleStatusChange(row.applicationId, "Rejected"),
                type: "danger",
              },
              {
                name: "View Resume",
                icon: EyeIcon,
                onClick: (row) => {
                  if (row.resumeUrl) {
                    window.open(row.resumeUrl, "_blank");
                  } else {
                    alert("No resume uploaded.");
                  }
                },
                type: "primary",
              },
            ]}
          />

          <Pagination
            currentPage={currentPage}
            totalItems={filteredApplicants.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            className="mt-4"
          />
        </>
      )}
    </div>
  );
}
