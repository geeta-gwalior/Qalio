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

const columnsData = [
  { label: "Student Name", value: "studentName" },
  { label: "Batch", value: "batch" },
  { label: "Major", value: "major" },
  { label: "Application Status", value: "applicationStatus" },
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

  useEffect(() => {
    const token = getCookie("jwt");

    const fetchApplicants = async () => {
      try {
        if (!id) return;

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
