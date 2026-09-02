"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  MapPin,
  ArrowLeft,
  Briefcase,
  AlertCircle,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react"
import { toast } from "sonner"
import { getCookie } from "@/utils/getCookie"
import { useAuthStore } from "@/stores/auth-store"
import type { IJob } from "@/types/job"
import Image from "next/image"

import ApproveStudentsModal from "@/components/approve-students-modal"

interface JobWithApproval extends IJob {
  collegeApprovalStatus: "pending" | "approved" | "rejected"
  allowedBatches: number[]
  allowedMajors?: string[]
  approvedAt?: Date
  rejectionReason?: string
}

export default function CollegeJobEligibilityManagement() {
  const { user } = useAuthStore()
  const [pendingJobs, setPendingJobs] = useState<JobWithApproval[]>([])
  const [approvedJobs, setApprovedJobs] = useState<JobWithApproval[]>([])
  const [rejectedJobs, setRejectedJobs] = useState<JobWithApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingJobId, setProcessingJobId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("pending")
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "desc",
  })
  const [searchTerm, setSearchTerm] = useState("")

  const [pendingPage, setPendingPage] = useState(1)
  const [approvedPage, setApprovedPage] = useState(1)
  const [rejectedPage, setRejectedPage] = useState(1)
  const [itemsPerPage] = useState(6)
  const router = useRouter()

  useEffect(() => {
    if (user?._id) {
      fetchCollegeSpecificJobs()
    }
  }, [user?._id])

  const fetchCollegeSpecificJobs = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = getCookie("jwt")
      if (!token) {
        toast.error("Authentication required")
        setError("Authentication required")
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/college/jobs`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
        console.error("API Error:", errorData)
        throw new Error(errorData.message || `Failed to fetch jobs (Status: ${response.status})`)
      }
      const data = await response.json()

      if (data.success && data.jobs && Array.isArray(data.jobs)) {
        const allJobs = data.jobs
        const pending = allJobs.filter((job: any) => {
          return job.collegeApprovalStatus === "pending" || !job.collegeApprovalStatus
        })
        const approved = allJobs.filter((job: any) => {
          return job.collegeApprovalStatus === "approved"
        })
        const rejected = allJobs.filter((job: any) => {
          return job.collegeApprovalStatus === "rejected"
        })

        setPendingJobs(pending)
        setApprovedJobs(approved)
        setRejectedJobs(rejected)
        if (pending.length > 0) {
          toast.success(`Found ${pending.length} jobs requiring your approval`)
        } else if (allJobs.length === 0) {
          toast.info("No jobs have been specifically invited to your college yet")
        } else {
          toast.info("All jobs have been reviewed")
        }
      } else {
        setPendingJobs([])
        setApprovedJobs([])
        setRejectedJobs([])
        toast.info("No jobs found for your college")
      }
    } catch (error) {
      console.error("Error fetching jobs:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to load jobs"
      toast.error(errorMessage)
      setError(errorMessage)
      setPendingJobs([])
      setApprovedJobs([])
      setRejectedJobs([])
    } finally {
      setLoading(false)
    }
  }

  const handleJobApproval = async (jobId: string, status: "approved" | "rejected", rejectionReason?: string) => {
    setProcessingJobId(jobId)
    try {
      const token = getCookie("jwt")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/college/approve/${jobId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status,
          rejectionReason,
        }),
      })

      if (!response.ok) {
        let errorData
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          try {
            errorData = await response.json()
          } catch (e) {
            errorData = { message: "Failed to parse error response" }
          }
        } else {
          try {
            const errorText = await response.text()
            errorData = { message: errorText || "Unknown error" }
          } catch (e) {
            errorData = { message: "Unknown error" }
          }
        }
        console.error("Approval Error:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        })
        let errorMessage = errorData.message || "Unknown error"
        if (response.status === 404) {
          errorMessage = "Job approval endpoint not found. Please check if the backend is properly configured."
        } else if (response.status === 401) {
          errorMessage = "Authentication failed. Please log in again."
        } else if (response.status === 403) {
          errorMessage = "You don't have permission to approve this job."
        } else if (response.status === 500) {
          errorMessage = "Server error occurred. Please try again later."
        }
        throw new Error(errorMessage)
      }
      const result = await response.json()
      toast.success(`Job ${status} successfully!`)

      if (status === "approved") {
        const jobToMove = pendingJobs.find((job) => job._id === jobId)
        if (jobToMove) {
          const updatedJob = {
            ...jobToMove,
            collegeApprovalStatus: "approved" as const,
            approvedAt: new Date(),
          }
          setPendingJobs((prev) => prev.filter((job) => job._id !== jobId))
          setApprovedJobs((prev) => [...prev, updatedJob])
        }
        setActiveTab("approved")
      } else if (status === "rejected") {
        const jobToMove = pendingJobs.find((job) => job._id === jobId)
        if (jobToMove) {
          const updatedJob = {
            ...jobToMove,
            collegeApprovalStatus: "rejected" as const,
            rejectionReason,
          }
          setPendingJobs((prev) => prev.filter((job) => job._id !== jobId))
          setRejectedJobs((prev) => [...prev, updatedJob])
        }
        setActiveTab("rejected")
      }
      setTimeout(() => {
        fetchCollegeSpecificJobs()
      }, 1000)
    } catch (error) {
      console.error("Error updating job approval:", error)
      const errorMessage = error instanceof Error ? error.message : `Failed to ${status} job`
      toast.error(errorMessage)
    } finally {
      setProcessingJobId(null)
    }
  }

  const fetchApprovedStudents = useCallback(
    async (
      page: number,
      limit: number,
      search: string,
      sortBy: string,
      sortDirection: string,
      batch: string | null,
      major: string | null,
    ) => {
      const token = getCookie("jwt")
      if (!token) {
        throw new Error("Authentication token not found")
      }
      try {
        const params = new URLSearchParams()
        params.append("page", page.toString())
        params.append("limit", limit.toString())
        if (search) params.append("search", search)
        params.append("status", "approved")
        params.append("sortBy", sortBy)
        params.append("sortDirection", sortDirection)
        if (batch) params.append("selectedBatch", batch)
        if (major) params.append("selectedMajor", major)

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/students?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        if (!res.ok) {
          throw new Error("Failed to fetch approved students")
        }
        const data = await res.json()
        const studentsFormatted = data.students.map((student: any) => {
          const studentId = student._id || student.baseUserId
          return {
            id: studentId,
            baseUserId: student.baseUserId,
            firstName: student.firstName ?? "",
            lastName: student.lastName ?? "",
            name: `${student.firstName ?? ""} ${student.lastName ?? ""}`,
            avatar: student.avatar || "/placeholder.svg?height=40&width=40",
            batch: student.batch || "N/A",
            major: student.major || "N/A",
            department: student.department || "N/A",
            email: student.email,
            phone: student.phone || "N/A",
          }
        })
        return {
          students: studentsFormatted,
          totalStudents: data.totalStudents,
          totalPages: data.totalPages,
        }
      } catch (error) {
        console.error("Error fetching approved students:", error)
        throw error
      }
    },
    [],
  )

  const approveStudentsForJob = async (jobId: string, studentIds: string[]) => {
    setProcessingJobId(jobId)
    try {
      const token = getCookie("jwt")
      if (!token) {
        throw new Error("Authentication token not found")
      }

      // Placeholder API call. You'll need to implement this backend endpoint.
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/jobs/college/approve/${jobId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentIds, status: "approved" }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }))
        throw new Error(errorData.message || `Failed to approve students (Status: ${response.status})`)
      }

      toast.success(`Successfully approved ${studentIds.length} students for this job!`)
      fetchCollegeSpecificJobs()
    } catch (error) {
      console.error("Error approving students for job:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to approve students"
      toast.error(errorMessage)
    } finally {
      setProcessingJobId(null)
    }
  }

  const getPaginatedJobs = (jobs: JobWithApproval[], page: number) => {
    const startIndex = (page - 1) * itemsPerPage
    return jobs.slice(startIndex, startIndex + itemsPerPage)
  }
  const getTotalPages = (totalItems: number) => {
    return Math.ceil(totalItems / itemsPerPage)
  }

  if (loading) {
    return (
      <div className="p-6 w-full mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Job Eligibility Management</h1>
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-32">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 w-full mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Job Eligibility Management</h1>
        </div>
        <Alert variant="destructive" className="max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={fetchCollegeSpecificJobs} className="ml-4 bg-transparent">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="py-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Job Eligibility Management</h1>
          <p className="text-gray-600">Manage jobs specifically invited to your college</p>
        </div>
        <Button variant="outline" onClick={fetchCollegeSpecificJobs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      <Alert className="mb-6 bg-blue-50 border-blue-200 text-blue-800">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Only jobs that companies have specifically invited your college to participate in
          will appear here. After you approve them, they will be visible to your students in the Available Jobs section.
        </AlertDescription>
      </Alert>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
          <TabsTrigger
            value="pending"
            className="flex items-center gap-2 data-[state=active]:bg-orange-100 data-[state=active]:text-orange-800"
          >
            <Clock className="h-4 w-4" />
            Pending Review ({pendingJobs.length})
          </TabsTrigger>
          <TabsTrigger
            value="approved"
            className="flex items-center gap-2 data-[state=active]:bg-green-100 data-[state=active]:text-green-800"
          >
            <CheckCircle className="h-4 w-4" />
            Approved ({approvedJobs.length})
          </TabsTrigger>
          <TabsTrigger
            value="rejected"
            className="flex items-center gap-2 data-[state=active]:bg-red-100 data-[state=active]:text-red-800"
          >
            <XCircle className="h-4 w-4" />
            Rejected ({rejectedJobs.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="space-y-4">
          {pendingJobs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Pending Review</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                All invited jobs have been reviewed. New jobs will appear here when companies invite your college to
                participate.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {getPaginatedJobs(pendingJobs, pendingPage).map((job) => (
                  <JobApprovalCard
                    key={job._id}
                    job={job}
                    onApprove={() => handleJobApproval(job._id!, "approved")}
                    onReject={(reason) => handleJobApproval(job._id!, "rejected", reason)}
                    onApproveStudents={(studentIds) => approveStudentsForJob(job._id!, studentIds)}
                    fetchApprovedStudents={fetchApprovedStudents}
                    isProcessing={processingJobId === job._id}
                    showActions={true}
                  />
                ))}
              </div>
              {/* Pagination for Pending */}
              {pendingJobs.length > itemsPerPage && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingPage(Math.max(1, pendingPage - 1))}
                      disabled={pendingPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 px-4">
                      Page {pendingPage} of {getTotalPages(pendingJobs.length)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingPage(Math.min(getTotalPages(pendingJobs.length), pendingPage + 1))}
                      disabled={pendingPage === getTotalPages(pendingJobs.length)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
        <TabsContent value="approved" className="space-y-4">
          {approvedJobs.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Approved Yet</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Jobs you approve will appear here and become available to your students.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {getPaginatedJobs(approvedJobs, approvedPage).map((job) => (
                  <JobApprovalCard
                    key={job._id}
                    job={job}
                    onApprove={() => {}}
                    onReject={() => {}}
                    onApproveStudents={() => {}}
                    fetchApprovedStudents={fetchApprovedStudents}
                    isProcessing={false}
                    showActions={false}
                  />
                ))}
              </div>
              {/* Pagination for Approved */}
              {approvedJobs.length > itemsPerPage && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setApprovedPage(Math.max(1, approvedPage - 1))}
                      disabled={approvedPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 px-4">
                      Page {approvedPage} of {getTotalPages(approvedJobs.length)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setApprovedPage(Math.min(getTotalPages(approvedJobs.length), approvedPage + 1))}
                      disabled={approvedPage === getTotalPages(approvedJobs.length)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
        <TabsContent value="rejected" className="space-y-4">
          {rejectedJobs.length === 0 ? (
            <div className="text-center py-12">
              <XCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Jobs Rejected</h3>
              <p className="text-gray-600 max-w-md mx-auto">Jobs you reject will appear here for your reference.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {getPaginatedJobs(rejectedJobs, rejectedPage).map((job) => (
                  <JobApprovalCard
                    key={job._id}
                    job={job}
                    onApprove={() => {}}
                    onReject={() => {}}
                    onApproveStudents={() => {}}
                    fetchApprovedStudents={fetchApprovedStudents}
                    isProcessing={false}
                    showActions={false}
                  />
                ))}
              </div>
              {/* Pagination for Rejected */}
              {rejectedJobs.length > itemsPerPage && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectedPage(Math.max(1, rejectedPage - 1))}
                      disabled={rejectedPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 px-4">
                      Page {rejectedPage} of {getTotalPages(rejectedJobs.length)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRejectedPage(Math.min(getTotalPages(rejectedJobs.length), rejectedPage + 1))}
                      disabled={rejectedPage === getTotalPages(rejectedJobs.length)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface JobApprovalCardProps {
  job: JobWithApproval
  onApprove: () => void
  onReject: (reason: string) => void
  onApproveStudents: (studentIds: string[]) => void
  fetchApprovedStudents: (
    page: number,
    limit: number,
    search: string,
    sortBy: string,
    sortDirection: string,
    batch: string | null,
    major: string | null,
  ) => Promise<{ students: any[]; totalStudents: number; totalPages: number }>
  isProcessing: boolean
  showActions: boolean
}

function JobApprovalCard({
  job,
  onApprove,
  onReject,
  onApproveStudents,
  fetchApprovedStudents,
  isProcessing,
  showActions,
}: JobApprovalCardProps) {
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectionForm, setShowRejectionForm] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const companyName = (() => {
    if (typeof job.companyId === "object" && job.companyId !== null) {
      const companyData = job.companyId as any
      return companyData?.name || "Unknown Company"
    }
    return "Unknown Company"
  })()
  const companyLogo = (() => {
    if (typeof job.companyId === "object" && job.companyId !== null) {
      const companyData = job.companyId as any
      return companyData?.basic?.logo || null
    }
    return null
  })()

  const handleApproveJob = () => {
    onApprove()
  }

  const handleReject = () => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection")
      return
    }
    onReject(rejectionReason)
  }

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }
  const formatSalary = (salaryRange: any) => {
    if (!salaryRange || (!salaryRange.min && !salaryRange.max)) return "Not specified"
    if (salaryRange.min && salaryRange.max) {
      return `₹${salaryRange.min}L - ₹${salaryRange.max}L`
    }
    if (salaryRange.min) return `₹${salaryRange.min}L+`
    if (salaryRange.max) return `Up to ₹${salaryRange.max}L`
    return "Not specified"
  }
  const getStatusBadge = () => {
    switch (job.collegeApprovalStatus) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-700 border-0 text-xs font-medium">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        )
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-700 border-0 text-xs font-medium">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        )
      default:
        return (
          <Badge className="bg-orange-100 text-orange-700 border-0 text-xs font-medium">
            <Clock className="h-3 w-3 mr-1" />
            Pending Review
          </Badge>
        )
    }
  }

  const [showApproveStudentsModal, setShowApproveStudentsModal] = useState(false)

  return (
    <Card className="border border-gray-200 hover:border-gray-300 transition-colors duration-200">
      <CardContent className="p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            {companyLogo ? (
              <Image
                src={companyLogo || "/placeholder.svg"}
                alt={`${companyName} logo`}
                width={40}
                height={40}
                className="rounded-lg object-contain border bg-white p-1 flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border flex-shrink-0">
                <Building2 className="w-5 h-5 text-gray-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight truncate">{job.jobTitle}</h3>
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {companyName}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {job.location?.join(", ") || "Remote"}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {job.jobType}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {getStatusBadge()}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {/* Quick Info Row */}
        <div className="grid grid-cols-4 gap-4 text-sm mb-3">
          <div>
            <span className="text-gray-500 block">Salary</span>
            <span className="font-medium text-gray-900">{formatSalary(job.salaryRange)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Deadline</span>
            <span className="font-medium text-gray-900">{formatDate(job.applicationDeadline)}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Openings</span>
            <span className="font-medium text-gray-900">{job.numberOfOpenings || 1}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Experience</span>
            <span className="font-medium text-gray-900">{job.roleLevel || "Entry"}</span>
          </div>
        </div>
        {/* Expandable Content */}
        {expanded && (
          <div className="space-y-4 pt-3 border-t border-gray-100">
            {/* Job Description */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Job Description</h4>
              <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{job.jobDescription}</p>
            </div>
            {/* Company's Preferred Batches */}
            {job.eligibility?.graduationYears && job.eligibility.graduationYears.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Companys Preferred Years</h4>
                <div className="flex flex-wrap gap-1">
                  {job.eligibility.graduationYears.map((year) => (
                    <Badge key={year} variant="secondary" className="bg-purple-100 text-purple-700 text-xs">
                      {year}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Commented out Batch Selection for Approval */}
        {/* {(showActions || job.collegeApprovalStatus === "approved") && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Label className="text-sm font-medium text-gray-900 mb-2 block">
              {showActions
                ? "Select Graduation Years to Allow"
                : "Approved Graduation Years"}
            </Label>
            <div className="space-y-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                      "w-full justify-between text-sm h-9",
                      !showActions && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={!showActions}
                  >
                    <span className="truncate">
                      {selectedBatches.length === 0
                        ? "Select graduation years..."
                        : selectedBatches.length === availableBatches.length
                        ? "All years selected"
                        : `${selectedBatches.length} year${
                            selectedBatches.length > 1 ? "s" : ""
                          } selected`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="p-2 border-b">
                    <input
                      type="text"
                      placeholder="Search graduation year..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#219CAE] focus:border-transparent"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between px-2 py-1 border-b bg-gray-50">
                      <span className="text-xs text-gray-500">
                        Select years
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAll}
                          className="h-6 text-xs text-[#219CAE] hover:bg-[#219CAE]/10 px-2"
                        >
                          All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAll}
                          className="h-6 text-xs hover:bg-gray-100 px-2"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    {filteredBatches.length === 0 ? (
                      <div className="px-2 py-3 text-xs text-gray-500 text-center">
                        No years found.
                      </div>
                    ) : (
                      filteredBatches.map((year) => (
                        <div
                          key={year}
                          onClick={() => toggleYear(year)}
                          className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 cursor-pointer"
                        >
                          <span className="text-sm">Class of {year}</span>
                          <div
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded border",
                              selectedBatches.includes(year)
                                ? "bg-[#219CAE]/10 border-[#219CAE]"
                                : "border-gray-300"
                            )}
                          >
                            {selectedBatches.includes(year) && (
                              <Check className="h-3 w-3 text-[#219CAE]" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedBatches.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedBatches.map((year) => (
                    <Badge
                      key={year}
                      variant="secondary"
                      className="bg-[#219CAE]/10 text-[#219CAE] border-[#219CAE]/20 text-xs h-6"
                    >
                      {year}
                      {showActions && (
                        <button
                          className="ml-1 hover:text-[#1a7a8a]"
                          onClick={() => toggleYear(year)}
                          disabled={!showActions}
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
              <Label className="text-sm font-medium text-gray-900 mt-4 block">
                Select Majors
              </Label>
              <Popover open={openMajor} onOpenChange={setOpenMajor}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openMajor}
                    className={cn(
                      "w-full justify-between text-sm h-9",
                      !showActions && "opacity-50 cursor-not-allowed"
                    )}
                    disabled={!showActions}
                  >
                    <span className="truncate">
                      {selectedMajors.length === 0
                        ? "Select majors..."
                        : selectedMajors.length === availableMajors.length
                        ? "All majors selected"
                        : `${selectedMajors.length} major${
                            selectedMajors.length > 1 ? "s" : ""
                          } selected`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <div className="p-2 border-b">
                    <input
                      type="text"
                      placeholder="Search majors..."
                      value={majorSearchTerm}
                      onChange={(e) => setMajorSearchTerm(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#219CAE] focus:border-transparent"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between px-2 py-1 border-b bg-gray-50">
                      <span className="text-xs text-gray-500">
                        Select majors
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAllMajors}
                          className="h-6 text-xs text-[#219CAE] hover:text-[#1a7a8a] hover:bg-[#219CAE]/10 px-2"
                        >
                          All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearAllMajors}
                          className="h-6 text-xs hover:bg-gray-100 px-2"
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                    {filteredMajors.length === 0 ? (
                      <div className="px-2 py-3 text-xs text-gray-500 text-center">
                        No majors found.
                      </div>
                    ) : (
                      filteredMajors.map((major) => (
                        <div
                          key={major}
                          onClick={() => toggleMajor(major)}
                          className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-50 cursor-pointer"
                        >
                          <span className="text-sm">{major}</span>
                          <div
                            className={cn(
                              "flex h-4 w-4 items-center justify-center rounded border",
                              selectedMajors.includes(major)
                                ? "bg-[#219CAE]/10 border-[#219CAE]"
                                : "border-gray-300"
                            )}
                          >
                            {selectedMajors.includes(major) && (
                              <Check className="h-3 w-3 text-[#219CAE]" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {selectedMajors.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedMajors.map((major) => (
                    <Badge
                      key={major}
                      variant="secondary"
                      className="bg-[#219CAE]/10 text-[#219CAE] border-[#219CAE]/20 text-xs h-6"
                    >
                      {major}
                      {showActions && (
                        <button
                          className="ml-1 hover:text-[#1a7a8a]"
                          onClick={() => toggleMajor(major)}
                        >
                          ×
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
        )} */}

        {/* Approved At */}
        {job.collegeApprovalStatus === "approved" && job.approvedAt && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="text-sm text-gray-600 bg-green-50 p-2 rounded">
              <strong className="text-green-800">Approved on:</strong> {formatDate(job.approvedAt)}
            </div>
          </div>
        )}
        {/* Rejection Reason Display */}
        {job.collegeApprovalStatus === "rejected" && job.rejectionReason && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-400">
              <h4 className="font-medium text-red-900 mb-1 text-sm flex items-center">
                <XCircle className="w-4 h-4 mr-1" />
                Rejection Reason
              </h4>
              <p className="text-sm text-red-800">{job.rejectionReason}</p>
            </div>
          </div>
        )}
        {/* Rejection Form */}
        {showRejectionForm && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-200">
              <Label htmlFor="rejection-reason" className="text-sm font-medium mb-2 block text-red-900">
                Rejection Reason <span className="text-red-600">*</span>
              </Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please provide a detailed reason for rejecting this job opportunity..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="mb-2 border-red-200 focus:border-red-400 text-sm"
                rows={2}
              />
            </div>
          </div>
        )}
        {/* Action Buttons */}
        {showActions && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            {!showRejectionForm ? (
              <div className="flex w-full gap-2">
                <Button
                  onClick={() => setShowApproveStudentsModal(true)}
                  disabled={isProcessing}
                  className="flex-1 bg-[#219CAE] hover:bg-[#98dfe9] text-white text-sm h-9"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve for Selected
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectionForm(true)}
                  disabled={isProcessing}
                  className="flex-1 text-sm h-9"
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </div>
            ) : (
              <div className="flex w-full gap-2">
                <Button
                  variant="destructive"
                  onClick={handleReject}
                  disabled={isProcessing || !rejectionReason.trim()}
                  className="flex-1 text-sm h-9"
                >
                  {isProcessing ? "Rejecting..." : "Confirm Rejection"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectionForm(false)
                    setRejectionReason("")
                  }}
                  disabled={isProcessing}
                  className="flex-1 text-sm h-9"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      {showApproveStudentsModal && (
        <ApproveStudentsModal
          isOpen={showApproveStudentsModal}
          onClose={() => setShowApproveStudentsModal(false)}
          jobId={job._id!}
          jobTitle={job.jobTitle}
          onApproveSelectedStudents={onApproveStudents}
          fetchApprovedStudents={fetchApprovedStudents}
        />
      )}
    </Card>
  )
}
