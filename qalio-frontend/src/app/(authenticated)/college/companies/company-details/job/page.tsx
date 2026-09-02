"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { toast } from "sonner"
import { format, differenceInDays } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"

interface Job {
  id: string
  title: string
  description: string
  companyId: string
  location: string
  salary: string
  applicationDeadline: string | Date | null
  department: string
  employmentType: string
  createdAt: string
  updatedAt: string
}

const formatDate = (dateString?: string | Date) => {
  if (!dateString) return "Not specified"
  try {
    // Convert Date object to string if needed
    const dateValue = typeof dateString === "string" ? dateString : dateString.toISOString()
    return format(new Date(dateValue), "PPP")
  } catch (error) {
    return "Invalid date"
  }
}

const getDaysAgo = (dateString?: string) => {
  if (!dateString) return "Unknown"
  try {
    const days = differenceInDays(new Date(), new Date(dateString))
    return days === 0 ? "Today" : `${days} Days ago`
  } catch (error) {
    return "Unknown"
  }
}

const Page = () => {
  const router = useRouter()
  const params = useParams()

  const [job, setJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [salary, setSalary] = useState("")
  const [applicationDeadline, setApplicationDeadline] = useState("")
  const [department, setDepartment] = useState("")
  const [employmentType, setEmploymentType] = useState("")

  useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/college/companies/${params.companyId}/jobs/${params.jobId}`)
        if (!res.ok) {
          throw new Error("Failed to fetch job")
        }
        const data = await res.json()
        setJob(data)
        setTitle(data.title)
        setDescription(data.description)
        setLocation(data.location)
        setSalary(data.salary)
        setApplicationDeadline(data.applicationDeadline)
        setDepartment(data.department)
        setEmploymentType(data.employmentType)
      } catch (error: any) {
        toast.error(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchJob()
  }, [params.companyId, params.jobId])

  const onSubmit = async (e: any) => {
    e.preventDefault()
    try {
      const res = await fetch(`/api/college/companies/${params.companyId}/jobs/${params.jobId}`, {
        method: "PATCH",
        body: JSON.stringify({
          title,
          description,
          location,
          salary,
          applicationDeadline,
          department,
          employmentType,
        }),
      })

      if (!res.ok) {
        throw new Error("Failed to update job")
      }

      toast.success("Job updated successfully")
      router.refresh()
      setOpen(false)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const onDelete = async () => {
    try {
      const res = await fetch(`/api/college/companies/${params.companyId}/jobs/${params.jobId}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        throw new Error("Failed to delete job")
      }

      toast.success("Job deleted successfully")
      router.push(`/college/companies/${params.companyId}`)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  if (isLoading) {
    return (
      <div className="container space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[400px]" />
        </div>
        <Skeleton className="h-4 w-[600px]" />
        <Skeleton className="h-4 w-[600px]" />
        <Skeleton className="h-4 w-[600px]" />
      </div>
    )
  }

  if (!job) {
    return <div>Job not found</div>
  }

  const departmentValue = job.department || "Not specified"
  const employmentTypeValue = job.employmentType || "Not specified"

  return (
    <div className="container">
      <div className="md:flex md:items-center md:justify-between space-y-4 md:space-y-0">
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold">{job.title}</h2>
          <p className="text-gray-600">{getDaysAgo(job.createdAt)}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button>Edit</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit job</DialogTitle>
                <DialogDescription>Make changes to your job here.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Title
                  </Label>
                  <Input id="title" value={title} className="col-span-3" onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    className="col-span-3"
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="location" className="text-right">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    className="col-span-3"
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="salary" className="text-right">
                    Salary
                  </Label>
                  <Input
                    id="salary"
                    value={salary}
                    className="col-span-3"
                    onChange={(e) => setSalary(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="applicationDeadline" className="text-right">
                    Application Deadline
                  </Label>
                  <Input
                    id="applicationDeadline"
                    type="date"
                    value={applicationDeadline ? applicationDeadline.toString().split("T")[0] : ""}
                    className="col-span-3"
                    onChange={(e) => setApplicationDeadline(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">
                    Department
                  </Label>
                  <Input
                    id="department"
                    value={department}
                    className="col-span-3"
                    onChange={(e) => setDepartment(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="employmentType" className="text-right">
                    Employment Type
                  </Label>
                  <Input
                    id="employmentType"
                    value={employmentType}
                    className="col-span-3"
                    onChange={(e) => setEmploymentType(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={onSubmit}>
                  Save changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">Delete</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your job.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="submit" variant="destructive" onClick={onDelete}>
                  Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="space-y-4 mt-4">
        <div>
          <h4 className="text-sm text-gray-500">Description</h4>
          <p className="font-medium">{job.description}</p>
        </div>
        <div>
          <h4 className="text-sm text-gray-500">Location</h4>
          <p className="font-medium">{job.location}</p>
        </div>
        <div>
          <h4 className="text-sm text-gray-500">Salary</h4>
          <p className="font-medium">{job.salary}</p>
        </div>
        <div>
          <h4 className="text-sm text-gray-500">Application Deadline</h4>
          <p className="font-medium">
            {formatDate(
              typeof job.applicationDeadline === "string"
                ? job.applicationDeadline
                : job.applicationDeadline?.toISOString(),
            )}
          </p>
        </div>

        {/* Conditionally render department and employment type */}
        {(job.department || job.employmentType) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {job.department && (
              <div>
                <h4 className="text-sm text-gray-500">Department</h4>
                <p className="font-medium">{job.department}</p>
              </div>
            )}
            {job.employmentType && (
              <div>
                <h4 className="text-sm text-gray-500">Employment Type</h4>
                <p className="font-medium">{job.employmentType}</p>
              </div>
            )}
          </div>
        )}
        <div>
          <h4 className="text-sm text-gray-500">Last Updated</h4>
          <p className="font-medium">
            {formatDate(
              typeof job.applicationDeadline === "string"
                ? job.applicationDeadline
                : job.applicationDeadline?.toISOString(),
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Page
