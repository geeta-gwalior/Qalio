"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { Loader2, Search, ChevronLeft, ChevronRight, Filter } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Student {
  id: string
  baseUserId: string
  firstName: string
  lastName: string
  name: string
  avatar: string
  batch: string
  major: string
  email: string
}

interface ApproveStudentsModalProps {
  isOpen: boolean
  onClose: () => void
  jobId: string
  jobTitle: string | undefined
  onApproveSelectedStudents: (studentIds: string[]) => void
  fetchApprovedStudents: (
    page: number,
    limit: number,
    search: string,
    sortBy: string,
    sortDirection: string,
    batch: string | null,
    major: string | null,
  ) => Promise<{
    students: Student[]
    totalStudents: number
    totalPages: number
  }>
}

const availableMajorsList = [
  "B.Tech",
  "M.Tech",
  "BCA",
  "MCA",
  "BSc",
  "MSc",
  "BBA",
  "MBA",
  // add other majors as needed
]

const currentYear = new Date().getFullYear()
const availableBatchesList = Array.from({ length: currentYear + 10 - 1950 + 1 }, (_, i) => 1950 + i).sort(
  (a, b) => b - a,
)

export default function ApproveStudentsModal({
  isOpen,
  onClose,
  jobId,
  jobTitle,
  onApproveSelectedStudents,
  fetchApprovedStudents,
}: ApproveStudentsModalProps) {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalStudentsCount, setTotalStudentsCount] = useState(0)
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set())
  const [isSelectAllOnPageChecked, setIsSelectAllOnPageChecked] = useState(false)
  const [isSelectAllThroughoutChecked, setIsSelectAllThroughoutChecked] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null)
  const [selectedMajor, setSelectedMajor] = useState<string | null>(null)

  const itemsPerPage = 10

  // Refactored loadStudents to take parameters explicitly
  const loadStudents = useCallback(
    async (page: number, search: string, batch: string | null, major: string | null) => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchApprovedStudents(page, itemsPerPage, search, "firstName", "asc", batch, major)
        setStudents(data.students)
        setTotalPages(data.totalPages)
        setTotalStudentsCount(data.totalStudents)
      } catch (err) {
        console.error("Failed to fetch students:", err)
        setError("Failed to load students. Please try again.")
        toast.error("Failed to load students.")
      } finally {
        setLoading(false)
      }
    },
    [fetchApprovedStudents], // Only depends on the stable prop
  )

  // This useEffect handles modal open/close and initial data load
  useEffect(() => {
    if (isOpen) {
      // Reset states to default when opening the modal
      setSearchTerm("")
      setCurrentPage(1)
      setSelectedBatch(null)
      setSelectedMajor(null)
      setSelectedStudentIds(new Set()) // Also reset selected students
      setIsSelectAllOnPageChecked(false)
      setIsSelectAllThroughoutChecked(false)

      // Perform initial load with default (empty) filters
      loadStudents(1, "", null, null)
    } else {
      // Reset all states when modal closes
      setStudents([])
      setSearchTerm("")
      setCurrentPage(1)
      setTotalPages(1)
      setTotalStudentsCount(0)
      setSelectedStudentIds(new Set())
      setIsSelectAllOnPageChecked(false)
      setIsSelectAllThroughoutChecked(false)
      setSelectedBatch(null)
      setSelectedMajor(null)
    }
  }, [isOpen, loadStudents]) // Depend on isOpen and the stable loadStudents

  useEffect(() => {
    const allOnPageSelected = students.length > 0 && students.every((student) => selectedStudentIds.has(student.id))
    setIsSelectAllOnPageChecked(allOnPageSelected)
  }, [students, selectedStudentIds])

  const handleCheckboxChange = (studentId: string, isChecked: boolean) => {
    setSelectedStudentIds((prev) => {
      const newSet = new Set(prev)
      if (isChecked) {
        newSet.add(studentId)
      } else {
        newSet.delete(studentId)
      }
      return newSet
    })
    setIsSelectAllThroughoutChecked(false)
  }

  const handleSelectAllOnPage = () => {
    const newSelectedIds = new Set(selectedStudentIds)
    if (isSelectAllOnPageChecked) {
      students.forEach((student) => newSelectedIds.delete(student.id))
    } else {
      students.forEach((student) => newSelectedIds.add(student.id))
    }
    setSelectedStudentIds(newSelectedIds)
    setIsSelectAllOnPageChecked(!isSelectAllOnPageChecked)
    setIsSelectAllThroughoutChecked(false)
  }

  const handleSelectAllThroughout = async () => {
    if (isSelectAllThroughoutChecked) {
      setSelectedStudentIds(new Set())
      setIsSelectAllThroughoutChecked(false)
      setIsSelectAllOnPageChecked(false)
    } else {
      setLoading(true)
      try {
        // Fetch all students with current filters applied
        const allStudentsData = await fetchApprovedStudents(
          1,
          totalStudentsCount || 10000, // Fetch a large number if totalStudentsCount is 0 or unknown
          searchTerm,
          "firstName",
          "asc",
          selectedBatch,
          selectedMajor,
        )
        const allIds = new Set(allStudentsData.students.map((s) => s.id))
        setSelectedStudentIds(allIds)
        setIsSelectAllThroughoutChecked(true)
        setIsSelectAllOnPageChecked(true)
      } catch (err) {
        toast.error("Failed to select all students. Please try again.")
        setError("Failed to select all students.")
      } finally {
        setLoading(false)
      }
    }
  }

  const handleApproveClick = () => {
    if (selectedStudentIds.size === 0) {
      toast.error("Please select at least one student to approve.")
      return
    }
    onApproveSelectedStudents(Array.from(selectedStudentIds))
    onClose()
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault() // Prevent default form submission
      setCurrentPage(1) // Reset to page 1 for new search
      loadStudents(1, searchTerm, selectedBatch, selectedMajor) // Trigger the search/filter
    }
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    // Directly trigger loadStudents with the new page and current filters
    loadStudents(newPage, searchTerm, selectedBatch, selectedMajor)
  }

  const applyFilters = () => {
    setCurrentPage(1) // Always reset to page 1 when applying new filters
    loadStudents(1, searchTerm, selectedBatch, selectedMajor) // Trigger fetch with current filters
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[600px] w-[90vw] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Approve Students for Job: <span className="text-[#219CAE]">{jobTitle}</span>
          </DialogTitle>
          <DialogDescription>Select students to approve for this job opportunity.</DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-[180px]">
              <Input
                placeholder="Search students by name or email..."
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="pr-8" // Add padding to make space for the icon
              />
              <Search className="h-4 w-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0 bg-transparent min-w-[120px]">
                  <Filter className="h-4 w-4 mr-2" />
                  Batch: {selectedBatch || "All"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px]">
                <DropdownMenuLabel>Filter by Batch</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={selectedBatch || "all"}
                  onValueChange={(value) => {
                    setSelectedBatch(value === "all" ? null : value)
                  }}
                >
                  <DropdownMenuRadioItem value="all">All Batches</DropdownMenuRadioItem>
                  {availableBatchesList.map((batch) => (
                    <DropdownMenuRadioItem key={batch} value={batch.toString()}>
                      {batch}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="shrink-0 bg-transparent min-w-[120px]">
                  <Filter className="h-4 w-4 mr-2" />
                  Major: {selectedMajor || "All"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[200px]">
                <DropdownMenuLabel>Filter by Major</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup
                  value={selectedMajor || "all"}
                  onValueChange={(value) => {
                    setSelectedMajor(value === "all" ? null : value)
                  }}
                >
                  <DropdownMenuRadioItem value="all">All Majors</DropdownMenuRadioItem>
                  {availableMajorsList.map((major) => (
                    <DropdownMenuRadioItem key={major} value={major}>
                      {major}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={applyFilters} disabled={loading} className="min-w-[120px] bg-[#219CAE]">
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Apply Filters
            </Button>
          </div>
          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-600">Loading students...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-gray-500">No students found matching your criteria.</div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all-page"
                    checked={isSelectAllOnPageChecked}
                    onCheckedChange={handleSelectAllOnPage}
                  />
                  <Label htmlFor="select-all-page" className="text-sm font-medium">
                    Select all on this page ({students.length})
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all-throughout"
                    checked={isSelectAllThroughoutChecked}
                    onCheckedChange={handleSelectAllThroughout}
                    disabled={loading}
                  />
                  <Label htmlFor="select-all-throughout" className="text-sm font-medium">
                    Select all throughout ({totalStudentsCount})
                  </Label>
                </div>
              </div>
              <div className="border rounded-md overflow-hidden">
                <div className="grid grid-cols-[auto_1fr_120px_120px_150px] gap-4 p-3 bg-gray-50 text-sm font-medium text-gray-700 border-b">
                  <div className="w-4"></div>
                  <div>Student Name</div>
                  <div>Batch</div>
                  <div>Major</div>
                  <div>Email</div>
                </div>
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="grid grid-cols-[auto_1fr_120px_120px_150px] items-center gap-4 p-3 border-b last:border-b-0 hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedStudentIds.has(student.id)}
                      onCheckedChange={(checked) => handleCheckboxChange(student.id, checked as boolean)}
                    />
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                        <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-900">{student.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">{student.batch}</div>
                    <div className="text-sm text-gray-600">{student.major}</div>
                    <div className="text-sm text-gray-600 truncate">{student.email}</div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleApproveClick}
            className="bg-[#219CAE] text-white"
            disabled={selectedStudentIds.size === 0 || loading}
          >
            Approve Selected Students ({selectedStudentIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
