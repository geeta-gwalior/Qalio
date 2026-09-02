"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { EyeIcon } from "lucide-react";
import QalioTable from "@/components/QalioTable"; // Assuming this component exists
import { Pagination } from "@/components/pagination"; // Assuming this component exists
import { getCookie } from "@/utils/getCookie"; // Assuming this utility exists
import axios from "axios";
import { useRouter } from "next/navigation";
import { StudentTableSkeleton } from "@/components/common/qalio-table-skeleton";

const columnsData = [
  { label: "Job Title", value: "jobTitle" },
  { label: "Type", value: "jobType" },
  { label: "Location", value: "location" },
  { label: "Applicants", value: "applicantCount" },
  { label: "Deadline", value: "applicationDeadline" },
];

export default function JobDashboard() {
  const [search, setSearch] = useState("");
  const [jobTypeFilter, setJobTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // State to manage loading status
  const itemsPerPage = 6;
  const router = useRouter();

  useEffect(() => {
    const token = getCookie("jwt");
    const fetchJobs = async () => {
      setIsLoading(true); // Set loading to true before fetching data
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/company`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const mapped = res?.data?.jobs?.map((job: any) => ({
          jobTitle: job.jobTitle,
          jobType: job.jobType,
          location: job.location.join(", "),
          applicantCount: job.applicants?.length || 0,
          applicationDeadline: new Date(
            job.applicationDeadline
          ).toLocaleDateString(),
          _id: job._id,
        }));
        setJobs(mapped.reverse());
      } catch (err) {
        console.log("Error fetching job data", err);
        // Optionally handle error display to user
      } finally {
        setIsLoading(false); // Set loading to false after fetching (success or error)
      }
    };
    fetchJobs();
  }, []);

  const filtered = jobs
    .filter((job: any) =>
      job.jobTitle.toLowerCase().includes(search.toLowerCase())
    )
    .filter((job: any) =>
      jobTypeFilter === "All" ? true : job.jobType === jobTypeFilter
    );

  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6 font-sans py-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-semibold">Applicants by Jobs</h2>
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <Input
            type="text"
            placeholder="Search job title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-64 border border-gray-300 bg-white"
          />
          <Select value={jobTypeFilter} onValueChange={setJobTypeFilter}>
            <SelectTrigger className="w-full md:w-40 border border-gray-300 bg-white">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All</SelectItem>
              <SelectItem value="Full-Time">Full-Time</SelectItem>
              <SelectItem value="Part-Time">Part-Time</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        // Display skeleton while loading
        <StudentTableSkeleton columns={6} />
      ) : filtered.length === 0 ? (
        // Display message if no jobs are found after loading
        <div className="flex items-center justify-center h-64 border rounded-md bg-card text-card-foreground">
          <p className="text-lg">
            No jobs found. Adjust your filters or add new jobs.
          </p>
        </div>
      ) : (
        // Display the table and pagination if data is available
        <>
          <QalioTable
            rowData={paginated}
            columnsData={columnsData}
            avatarRequired={false}
            actionButtons={[
              {
                name: "View",
                icon: EyeIcon,
                onClick: (row) =>
                  router.push(`/company/applicants/job-applicants/${row._id}`),
                type: "primary",
              },
            ]}
          />
          <Pagination
            currentPage={currentPage}
            totalItems={filtered.length}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            className="mt-4"
          />
        </>
      )}
    </div>
  );
}
