"use client";

import QalioTable from "@/components/QalioTable";
import AddStudentForm from "@/components/forms/add-student-form";
import UploadStudentsDialog from "@/components/upload-students-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useDebounce } from "@/hooks/useDebounce";
import { cn } from "@/lib/utils";
import { getCookie } from "@/utils/getCookie";
import {
  ChevronDown,
  ChevronUp,
  CircleCheck,
  Eye,
  Search,
  SlidersHorizontal,
  UserPlus,
  X,
  Users,
  CheckCircle,
  Mail,
  Download,
  Loader2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { toast } from "sonner";
import { StudentTableSkeleton } from "@/components/common/qalio-table-skeleton";
import { AVATAR_PLACEHOLDER_IMAGE } from "@/constants";
import * as XLSX from "xlsx"; // Import xlsx library

export default function Students() {
  const [students, setStudents] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<string | null>("approved");
  const [activePage, setActivePage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);
  const [statusCounts, setStatusCounts] = useState({
    approved: 0,
    pending: 0,
    invited: 0,
  });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false); // New state for export loading
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    batch: [] as string[],
    major: [] as string[],
  });
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "desc",
  });
  const [filterOptions, setFilterOptions] = useState({
    batches: [] as any[],
    majors: [] as any[],
  });
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(
    new Set()
  );
  const [selectAll, setSelectAll] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const id = searchParams.get("id");
  const debouncedSearch = useDebounce(searchValue, 1000);
  const itemsPerPage = 20;
  const router = useRouter();
  // Use ref to track if we're currently updating selection to prevent loops
  const isUpdatingSelection = useRef(false);

  // Memoize students to prevent unnecessary re-renders
  const stableStudents = useMemo(() => {
    return students.map((student, index) => ({
      ...student,
      originalIndex: index, // Keep track of original position
    }));
  }, [students]);

  // Dynamic columnsData based on status
  const columnsData = useMemo(() => {
    const baseColumns = [
      { label: "Student Name", value: "name" },
      { label: "Batch", value: "batch" },
      { label: "Major", value: "major" },
      { label: "Email", value: "email" },
    ];
    let dateLabel = "Invited On";
    let dateField = "createdAt";
    if (status === "pending") {
      dateLabel = "Registered On";
    } else if (status === "approved") {
      dateLabel = "Approved On";
    } else if (status === "invited") {
      dateField = "updatedAt";
    }
    return [
      ...baseColumns,
      { label: dateLabel, value: dateField, isFormateDate: true },
    ];
  }, [status]);

  // Fetch status counts for all statuses
  const fetchStatusCounts = useCallback(async () => {
    const token = getCookie("jwt");
    if (!token) return;
    try {
      const statuses = ["approved", "pending", "invited"];
      const counts = { approved: 0, pending: 0, invited: 0 };
      await Promise.all(
        statuses.map(async (statusType) => {
          const params = new URLSearchParams();
          params.append("page", "1");
          params.append("limit", "1");
          params.append("status", statusType);
          const res = await fetch(
            `${
              process.env.NEXT_PUBLIC_QALIO_BACKEND_URL
            }/college/students?${params.toString()}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (res.ok) {
            const data = await res.json();
            counts[statusType as keyof typeof counts] = data.totalStudents || 0;
          }
        })
      );
      setStatusCounts(counts);
    } catch (error) {
      console.log("Error fetching status counts:", error);
    }
  }, []);

  const toggleStudentSelection = useCallback(
    (studentId: string) => {
      if (isUpdatingSelection.current) return;
      isUpdatingSelection.current = true;
      setSelectedStudents((prev) => {
        const newSelection = new Set(prev);
        if (newSelection.has(studentId)) {
          newSelection.delete(studentId);
        } else {
          newSelection.add(studentId);
        }
        // Update selectAll state without causing re-render
        setTimeout(() => {
          const currentPageIds = stableStudents.map((s) => s.id);
          const allCurrentSelected = currentPageIds.every((id) =>
            newSelection.has(id)
          );
          setSelectAll(allCurrentSelected);
          isUpdatingSelection.current = false;
        }, 0);
        return newSelection;
      });
    },
    [stableStudents]
  );

  const toggleSelectAll = useCallback(() => {
    if (isUpdatingSelection.current) return;
    isUpdatingSelection.current = true;
    const currentPageIds = stableStudents.map((student) => student.id);
    setSelectedStudents((prev) => {
      const newSelection = new Set(prev);
      const allCurrentlySelected = currentPageIds.every((id) =>
        newSelection.has(id)
      );
      if (allCurrentlySelected) {
        currentPageIds.forEach((id) => newSelection.delete(id));
      } else {
        currentPageIds.forEach((id) => newSelection.add(id));
      }
      setSelectAll(!allCurrentlySelected);
      isUpdatingSelection.current = false;
      return newSelection;
    });
  }, [stableStudents]);

  const handleAddToAssessment = async () => {
    if (!id) return;
    const token = getCookie("jwt");
    if (!token) {
      throw new Error("Authentication token not found");
    }
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments/${id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            invitedStudents: Array.from(selectedStudents),
          }),
        }
      );
      if (!res.ok) {
        throw new Error("Failed to add students to assessment");
      }
      // Show success message and clear selections instead of redirecting
      toast.success(
        `Successfully added ${selectedStudents.size} student${
          selectedStudents.size !== 1 ? "s" : ""
        } to assessment!`
      );
      setSelectedStudents(new Set()); // Clear selections
      setSelectAll(false);
    } catch (error) {
      console.log(error);
      toast.error("Failed to add students to assessment");
    } finally {
      // window.alert("Done")
      window.location.reload();
    }
  };

  const fetchAlreadySelectedStudents = useCallback(async () => {
    if (!id) return;
    const token = getCookie("jwt");
    if (!token) {
      throw new Error("Authentication token not found");
    }
    try {
      const res = await axios.get(`/api/assessment/${id}`);
      if (!res) {
        throw new Error("Failed to fetch already selected students");
      }
      if (
        res.data.data.assessment.invitedStudents &&
        Array.isArray(res.data.data.assessment.invitedStudents)
      ) {
        const studentIds = res.data.data.assessment.invitedStudents.map(
          (student: any) =>
            student && typeof student === "object" && "_id" in student
              ? student._id
              : student
        );
        setSelectedStudents(new Set(studentIds));
      }
    } catch (error) {
      console.log("Error fetching selected students:", error);
    }
  }, [id]);

  const fetchStudents = useCallback(async () => {
    const token = getCookie("jwt");
    if (!token) {
      throw new Error("Authentication token not found");
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", activePage.toString());
      params.append("limit", itemsPerPage.toString());
      if (searchTerm) params.append("search", searchTerm);
      if (status) params.append("status", status);
      filters.batch.forEach((batch) => params.append("batch", batch));
      filters.major.forEach((major) => params.append("major", major));
      params.append("sortBy", sortConfig.key);
      params.append("sortDirection", sortConfig.direction);

      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_QALIO_BACKEND_URL
        }/college/students?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch students");
      }
      const data = await res.json();
      const studentsFormatted = data.students.map((student: any) => {
        const studentId = student._id || student.baseUserId;
        return {
          id: studentId,
          baseUserId: student.baseUserId,
          name: `${student.firstName ?? ""} ${student.lastName ?? ""}`,
          avatar: student.avatar || "/images/usericon_placeholder.jpg",
          batch: student.batch || "N/A",
          major: student.major || "N/A",
          department: student.department || "N/A",
          email: student.email,
          phone: student.phone || "N/A",
          createdAt: student.createdAt || "N/A",
          updatedAt: student.updatedAt || "N/A",
        };
      });
      // Only update students if the data actually changed
      setStudents((prevStudents) => {
        const prevIds = prevStudents.map((s) => s.id).join(",");
        const newIds = studentsFormatted.map((s: any) => s.id).join(",");
        if (prevIds !== newIds) {
          return studentsFormatted;
        }
        return prevStudents;
      });
      setTotalStudents(data.totalStudents);
      // Update the current status count in statusCounts
      if (status) {
        setStatusCounts((prev) => ({
          ...prev,
          [status]: data.totalStudents,
        }));
      }
      // Always update filter options when we get new data
      const allBatches = [
        ...new Set(data.students.map((s: any) => s.batch).filter(Boolean)),
      ];
      const allMajors = [
        ...new Set(data.students.map((s: any) => s.major).filter(Boolean)),
      ];
      setFilterOptions((prev) => ({
        batches: allBatches.length > 0 ? allBatches : prev.batches,
        majors: allMajors.length > 0 ? allMajors : prev.majors,
      }));
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, activePage, status, filters, sortConfig]);

  // New function to fetch all students for export
  const fetchAllStudentsForExport = useCallback(
    async (exportStatus: string) => {
      const token = getCookie("jwt");
      if (!token) {
        throw new Error("Authentication token not found");
      }

      let allStudents: any[] = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams();
        params.append("page", currentPage.toString());
        params.append("limit", "100"); // Fetch 100 students per page for export
        params.append("status", exportStatus);
        if (searchTerm) params.append("search", searchTerm); // Apply current search term to export
        filters.batch.forEach((batch) => params.append("batch", batch)); // Apply current filters to export
        filters.major.forEach((major) => params.append("major", major)); // Apply current filters to export
        params.append("sortBy", sortConfig.key);
        params.append("sortDirection", sortConfig.direction);

        const res = await fetch(
          `${
            process.env.NEXT_PUBLIC_QALIO_BACKEND_URL
          }/college/students?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          throw new Error(
            `Failed to fetch students for export (page ${currentPage})`
          );
        }

        const data = await res.json();
        const studentsBatch = data.students || [];

        if (studentsBatch.length > 0) {
          allStudents = allStudents.concat(studentsBatch);
          currentPage++;
        } else {
          hasMore = false; // No more students to fetch
        }
      }
      return allStudents; // Return raw student data
    },
    [searchTerm, filters, sortConfig]
  );

  const handleExport = async () => {
    setExporting(true);
    const toastId = toast.loading(`Exporting ${status} students...`);
    try {
      const studentsToExport = await fetchAllStudentsForExport(
        status || "approved"
      );

      if (studentsToExport.length === 0) {
        toast.info(`No ${status} students to export.`, { id: toastId });
        return;
      }

      // Dynamically collect all unique headers from all students
      const allHeaders: Set<string> = new Set();
      studentsToExport.forEach((student) => {
        Object.keys(student).forEach((key) => {
          if (
            key !== "avatar" &&
            key !== "baseUserId" &&
            key !== "studentId" &&
            key !== "_id"
          ) {
            allHeaders.add(key);
          }
        });
      });

      const preferredOrder = [
        "firstName",
        "lastName",
        "email",
        "phone",
        "major",
        "batch",
        "authType",
        "verificationStatus",
        "approved",
        "completedProfile",
        "createdAt",
        "updatedAt",
        "link",
      ];

      const sortedHeaders = Array.from(allHeaders).sort((a, b) => {
        const indexA = preferredOrder.indexOf(a);
        const indexB = preferredOrder.indexOf(b);

        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

      const exportData = studentsToExport.map((student) => {
        const row: { [key: string]: any } = {};

        // Add Full Name first
        const fullName = [student.firstName, student.lastName]
          .filter(Boolean)
          .join(" ");
        row["Full Name"] = fullName || student.firstName || ""; // fallback if only firstName is present

        sortedHeaders.forEach((header) => {
          // Skip firstName and lastName since we already combined them
          if (header === "firstName" || header === "lastName") return;

          const value = student[header];

          if (typeof value === "boolean") {
            row[header] = value ? "Yes" : "No";
          } else if (
            (header === "createdAt" || header === "updatedAt") &&
            value &&
            value !== "N/A"
          ) {
            try {
              row[header] = new Date(value).toLocaleDateString();
            } catch {
              row[header] = value;
            }
          } else {
            row[header] = value || "";
          }
        });

        return row;
      });

      const finalHeaders = [
        "Full Name",
        ...sortedHeaders.filter((h) => h !== "firstName" && h !== "lastName"),
      ];

      const ws = XLSX.utils.json_to_sheet(exportData, { header: finalHeaders });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `${status} Students`);
      XLSX.writeFile(
        wb,
        `${status}-students-export-${new Date()
          .toISOString()
          .slice(0, 10)}.xlsx`
      );

      toast.success(
        `Successfully exported ${studentsToExport.length} ${status} students!`,
        { id: toastId }
      );
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export students. Please try again.", {
        id: toastId,
      });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAlreadySelectedStudents();
    }
  }, [id, fetchAlreadySelectedStudents]);

  // Main fetch effect
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Fetch status counts on component mount
  useEffect(() => {
    fetchStatusCounts();
  }, [fetchStatusCounts]);

  useEffect(() => {
    const count = filters.batch.length + filters.major.length;
    setActiveFiltersCount(count);
  }, [filters]);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleFilterChange = (type: string, value: string) => {
    setFilters((prev) => {
      const current = prev[type as keyof typeof prev] as string[];
      const newFilters = {
        ...prev,
        [type]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      };
      return newFilters;
    });
    setActivePage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({ batch: [], major: [] });
  };

  const renderSortIcon = (columnValue: string) => {
    if (sortConfig.key !== columnValue) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4 ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 ml-1" />
    );
  };

  const handleSearch = () => {
    setSearchTerm(searchValue);
    setActivePage(1);
  };

  const token = getCookie("jwt");

  const handleApproveStudent = async (baseUserId: string) => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/approve`,
        { studentId: baseUserId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      fetchStudents();
      fetchStatusCounts(); // Refresh counts after approval
      toast.success("Student approved successfully!");
    } catch (error) {
      console.log("Error approving student:", error);
    }
  };

  const handleAddAllApproved = async () => {
    if (!id) return;
    try {
      const token = getCookie("jwt");
      await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments/${id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ selectAllApproved: true }),
        }
      );
      toast.success("All approved students added to assessment!");
      fetchAlreadySelectedStudents();
    } catch (error) {
      toast.error("Failed to add all approved students");
      console.error(error);
    }
  };

  const handleApproveAllPendingStudents = async () => {
    try {
      const token = getCookie("jwt");
      if (!token) {
        toast.error("Token missing!");
        return;
      }
      await axios.patch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/approve-all-pending`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      toast.success("All pending students approved!");
      fetchStudents(); // Refresh list
      fetchStatusCounts(); // Refresh counts
    } catch (error) {
      console.error("Error approving all pending students:", error);
      toast.error("Failed to approve all pending students");
    }
  };

  const resendInviteEmail = async (data: any) => {
    const token = getCookie("jwt");
    if (!token) {
      toast.error("You are not authenticated. Please log in.");
      return;
    }
    const toastId = toast.loading("Sending invite email...");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/upload-students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            students: [
              {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                batch: data.batch,
                approved: data.approved,
                phone: data.phone,
                major: data.major,
              },
            ],
          }),
        }
      );
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Unknown error occurred");
      }
      const { failedEmails, alreadyInvitedEmails, duplicateEmails } = result;
      if (failedEmails.length > 0) {
        toast.error(`Failed to resend invite to ${failedEmails[0]}`, {
          id: toastId,
        });
      } else if (duplicateEmails.length > 0) {
        toast(`This email is already registered: ${duplicateEmails[0]}`, {
          icon: "⚠️",
          id: toastId,
        });
      } else if (alreadyInvitedEmails.length > 0) {
        toast.success(`Re-invite sent to ${alreadyInvitedEmails[0]}`, {
          id: toastId,
        });
      } else {
        toast.success("Invite email sent successfully!", { id: toastId });
      }
    } catch (error: any) {
      console.error("Error sending invite email:", error);
      toast.error(
        error?.message || "Something went wrong while resending invite.",
        { id: toastId }
      );
    }
  };

  const sendProfileReminderEmail = async (data: any) => {
    const token = getCookie("jwt");
    if (!token) {
      toast.error("You are not authenticated. Please log in.");
      return;
    }
    const toastId = toast.loading("Sending reminder email...");
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/send-reminder-emails`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            students: [
              {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                batch: data.batch,
                phone: data.phone,
                major: data.major,
              },
            ],
          }),
        }
      );
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Failed to send reminder email");
      }
      const { failedEmails = [], skippedStudents = [] } = result;
      // Handle failed emails
      if (failedEmails.length > 0) {
        toast.error(`Failed to send reminder to ${failedEmails[0]}`, {
          id: toastId,
        });
        return;
      }
      // Handle skipped students (already registered)
      if (skippedStudents.includes(data.email.toLowerCase())) {
        toast.success(`Already registered: ${data.email}`, {
          id: toastId,
        });
        return;
      }
      // Success case
      toast.success("Reminder email sent successfully!", { id: toastId });
    } catch (error: any) {
      console.error("Error sending reminder email:", error);
      toast.error(
        error?.message || "Something went wrong while sending reminder email.",
        { id: toastId }
      );
    }
  };

  return (
    <div className="flex flex-col min-h-[84vh]">
      <div className="flex overflow-x-auto items-center justify-between">
        <h2 className="text-2xl font-[jost] font-semibold text-gray-800">
          Students
        </h2>
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <Input
              placeholder="Search students..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-64 pr-20"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            {searchValue && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-10 h-full"
                onClick={() => {
                  setSearchValue("");
                  setSearchTerm("");
                  setActivePage(1);
                }}
              >
                <X className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Clear Search</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-0 h-full"
              onClick={handleSearch}
            >
              <Search className="h-4 w-4" />
              <span className="sr-only">Search</span>
            </Button>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "relative",
                  activeFiltersCount > 0 && "border-blue-500 text-blue-500"
                )}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-blue-500">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">
                    Filter Students
                  </h3>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                      Clear all ({activeFiltersCount})
                    </Button>
                  )}
                </div>
              </div>
              <div className="p-4 space-y-6">
                {/* Batch Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">Batch</h4>
                    <span className="text-xs text-gray-500">
                      {filterOptions.batches.length} options
                    </span>
                  </div>
                  {filterOptions.batches.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {filterOptions.batches.map((batch) => (
                        <div
                          key={batch}
                          className="flex items-center space-x-2 p-1"
                        >
                          <Checkbox
                            id={`batch-${batch}`}
                            checked={filters.batch.includes(batch)}
                            onCheckedChange={() =>
                              handleFilterChange("batch", batch)
                            }
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                          <Label
                            htmlFor={`batch-${batch}`}
                            className="text-sm text-gray-700 cursor-pointer flex-1"
                          >
                            {batch}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 italic">
                      No batch options available
                    </div>
                  )}
                </div>
                {/* Major Filter */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-700">Major</h4>
                    <span className="text-xs text-gray-500">
                      {filterOptions.majors.length} options
                    </span>
                  </div>
                  {filterOptions.majors.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                      {filterOptions.majors.map((major) => (
                        <div
                          key={major}
                          className="flex items-center space-x-2 p-1"
                        >
                          <Checkbox
                            id={`major-${major}`}
                            checked={filters.major.includes(major)}
                            onCheckedChange={() =>
                              handleFilterChange("major", major)
                            }
                            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                          />
                          <Label
                            htmlFor={`major-${major}`}
                            className="text-sm text-gray-700 cursor-pointer flex-1"
                          >
                            {major}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 italic">
                      No major options available
                    </div>
                  )}
                </div>
              </div>
              {activeFiltersCount > 0 && (
                <div className="p-4 border-t bg-gray-50">
                  <div className="text-xs text-gray-600">
                    {activeFiltersCount} filter
                    {activeFiltersCount !== 1 ? "s" : ""} applied
                  </div>
                </div>
              )}
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-1 border rounded-md p-1">
            {!id && (
              <Button
                variant={status === "invited" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatus("invited")}
                className={`h-8 flex items-center gap-2 ${
                  status === "invited"
                    ? "bg-[#219CAE] text-white hover:bg-[#1b89a4]"
                    : ""
                }`}
              >
                <Users className="w-4 h-4" />
                Invited
                <Badge variant="secondary" className="ml-1 text-xs">
                  {statusCounts.invited}
                </Badge>
              </Button>
            )}
            {!id && (
              <Button
                variant={status === "pending" ? "default" : "ghost"}
                size="sm"
                onClick={() => setStatus("pending")}
                className={`h-8 flex items-center gap-2 ${
                  status === "pending"
                    ? "bg-[#219CAE] text-white hover:bg-[#1b89a4]"
                    : ""
                }`}
              >
                <Users className="w-4 h-4" />
                Pending
                <Badge variant="secondary" className="ml-1 text-xs">
                  {statusCounts.pending}
                </Badge>
              </Button>
            )}
            <Button
              variant={status === "approved" ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatus("approved")}
              className={`h-8 flex items-center gap-2 ${
                status === "approved"
                  ? "bg-[#219CAE] text-white hover:bg-[#1b89a4]"
                  : ""
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              Approved
              <Badge variant="secondary" className="ml-1 text-xs">
                {statusCounts.approved}
              </Badge>
            </Button>
          </div>
          {!id && (
            <AddStudentForm
              batches={filterOptions.batches}
              onSuccess={() => {
                fetchStudents();
                fetchStatusCounts();
              }}
            />
          )}
          {!id && (
            <UploadStudentsDialog
              onSuccess={() => {
                fetchStudents();
                fetchStatusCounts();
              }}
            />
          )}
        </div>
      </div>
      {/* Status Summary Bar */}
      <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#219CAE] rounded-full"></div>
              <span className="text-sm font-medium">
                Total Students: {totalStudents}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Showing {status} students
            </div>
          </div>
          {/* Export Button */}
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={
              exporting ||
              statusCounts[status as keyof typeof statusCounts] === 0
            }
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export
          </Button>
          {/* Move Approve All Pending Students button here */}
          {status === "pending" && totalStudents > 0 && (
            <Button
              onClick={handleApproveAllPendingStudents}
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-4 py-2 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Approve All {totalStudents} Pending Students
            </Button>
          )}
        </div>
      </div>
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-2 mb-4">
          {filters.batch.map((batch) => (
            <Badge
              key={`badge-batch-${batch}`}
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
            >
              Batch: {batch}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-blue-200 rounded-full"
                onClick={() => handleFilterChange("batch", batch)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
          {filters.major.map((major) => (
            <Badge
              key={`badge-major-${major}`}
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors"
            >
              Major: {major}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 ml-1 hover:bg-blue-200 rounded-full"
                onClick={() => handleFilterChange("major", major)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      {id ? (
        <div className="flex-1 flex flex-col mt-6">
          <div className="flex justify-between items-center mb-6 p-4 bg-gradient-to-r from-[#219CAE]/10 to-[#219CAE]/5 rounded-lg border border-[#219CAE]/20">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={selectAll}
                  onCheckedChange={toggleSelectAll}
                  className="data-[state=checked]:bg-[#219CAE] data-[state=checked]:border-[#219CAE]"
                />
                <span className="text-sm font-medium text-gray-700">
                  Select all on this page
                </span>
                <Button
                  onClick={handleAddAllApproved}
                  className="bg-[#219CAE] hover:bg-[#1b89a4] text-white font-medium px-6 py-2"
                >
                  Add All Approved Students to Assessment
                </Button>
              </div>
              <div className="h-4 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#219CAE] rounded-full"></div>
                <span className="text-sm font-semibold text-[#219CAE]">
                  {selectedStudents.size} students selected across all pages
                </span>
              </div>
            </div>
            <Button
              onClick={handleAddToAssessment}
              disabled={selectedStudents.size === 0}
              className="bg-[#219CAE] hover:bg-[#1b89a4] text-white font-medium px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add {selectedStudents.size} Student
              {selectedStudents.size !== 1 ? "s" : ""} to Assessment
            </Button>
          </div>
          {loading ? (
            <StudentTableSkeleton
              columns={columnsData.length}
              showCheckbox={true}
            />
          ) : stableStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <UserPlus className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">No students found.</p>
              <p className="text-sm">
                Adjust your filters or add new students.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="w-[50px] pl-6">
                      {/* Remove the checkbox header - just empty space */}
                    </TableHead>
                    {columnsData.map((column) => (
                      <TableHead
                        key={`column-${column.value}`}
                        className="cursor-pointer hover:bg-gray-100/50 transition-colors font-semibold text-gray-700"
                        onClick={() => handleSort(column.value)}
                      >
                        <div className="flex items-center">
                          {column.label}
                          {renderSortIcon(column.value)}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stableStudents.map((student, index) => (
                    <TableRow
                      key={`stable-${student.id}-${student.originalIndex}`}
                      className={`                        transition-all duration-200 hover:bg-gray-50${
                        selectedStudents.has(student.id)
                          ? "bg-[#219CAE]/5 border-l-4 border-l-[#219CAE]"
                          : "hover:bg-gray-50"
                      }\${
                        index !== stableStudents.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }                      `}
                    >
                      <TableCell className="pl-6">
                        <Checkbox
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={() =>
                            toggleStudentSelection(student.id)
                          }
                          className="data-[state=checked]:bg-[#219CAE] data-[state=checked]:border-[#219CAE]"
                        />
                      </TableCell>
                      {columnsData.map((column) => (
                        <TableCell
                          key={`${student.id}-${column.value}`}
                          className="py-4 text-gray-700"
                        >
                          {column.value === "name" ? (
                            <div className="flex items-center">
                              <div className="relative">
                                <img
                                  className="h-10 w-10 rounded-full mr-3 object-cover border-2 border-gray-200"
                                  src={
                                    typeof student.avatar === "string" &&
                                    student.avatar.trim() !== ""
                                      ? student.avatar
                                      : AVATAR_PLACEHOLDER_IMAGE
                                  }
                                  alt={student.name}
                                />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {student.name}
                                </div>
                                {selectedStudents.has(student.id) && (
                                  <div className="text-xs text-[#219CAE] font-medium">
                                    Selected
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : column.value === "batch" ? (
                            <Badge
                              variant="outline"
                              className="bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {student.batch}
                            </Badge>
                          ) : "isFormateDate" in column &&
                            column.isFormateDate ? (
                            new Date(student[column.value]).toLocaleDateString()
                          ) : (
                            student[column.value]
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col mt-6">
          {loading ? (
            <StudentTableSkeleton
              columns={columnsData.length}
              showCheckbox={false}
            />
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <UserPlus className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">No students found.</p>
              <p className="text-sm">
                Adjust your filters or add new students.
              </p>
            </div>
          ) : (
            <QalioTable
              rowData={students}
              columnsData={columnsData}
              avatarRequired={true}
              {...(status !== "invited" && {
                actionButtons:
                  status === "pending"
                    ? [
                        {
                          name: "Add",
                          icon: (props) => (
                            <CircleCheck
                              {...props}
                              className="text-green-500"
                            />
                          ),
                          onClick: (student: any) =>
                            handleApproveStudent(student.baseUserId),
                          type: "primary",
                          customStyles: "bg-green-100",
                        },
                        {
                          name: "Send Reminder",
                          icon: (props) => (
                            <Mail
                              {...props}
                              className="text-blue-600"
                              style={{ strokeWidth: 1.25 }}
                            />
                          ),
                          onClick: (row) => {
                            const transformedData = {
                              ...row,
                              firstName: row.name.split(" ")[0] || "",
                              lastName: row.name.split(" ")[1] || "",
                            };
                            sendProfileReminderEmail(transformedData);
                          },
                          type: "secondary",
                          customStyles: "color-blue-600 bg-blue-100",
                        },
                      ]
                    : [
                        {
                          name: "View",
                          icon: (props) => (
                            <Eye
                              {...props}
                              className="text-black "
                              style={{ strokeWidth: 1.25 }}
                            />
                          ),
                          onClick: (row) =>
                            router.push(
                              `/college/students/student-details?studentId=${row.id}`
                            ),
                          type: "primary",
                          customStyles: "color-orange-500 bg-orange-100",
                        },
                      ],
              })}
              {...(status === "invited" && {
                actionButtons: [
                  {
                    name: "Resend Invite",
                    icon: (props) => (
                      <Mail
                        {...props}
                        className="text-black"
                        style={{ strokeWidth: 1.25 }}
                      />
                    ),
                    onClick: (row) => {
                      const transformedData = {
                        ...row,
                        firstName: row.name.split(" ")[0] || "",
                        lastName: row.name.split(" ")[1] || "",
                        approved: false,
                      };
                      resendInviteEmail(transformedData);
                    },
                    type: "primary",
                    customStyles: "color-orange-500 bg-orange-100",
                  },
                ],
              })}
            />
          )}
        </div>
      )}
      <div className="mt-auto">
        {students.length > 0 && !loading && (
          <Pagination
            currentPage={activePage}
            totalItems={totalStudents}
            itemsPerPage={itemsPerPage}
            onPageChange={setActivePage}
            className="mt-8"
          />
        )}
      </div>
    </div>
  );
}
