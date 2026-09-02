import type { Types } from "mongoose"


export interface IJob {
  _id: string
  companyId:
  | Types.ObjectId
  | string
  | {
    _id: string
    basic?: {
      companyName: string
      logo?: string
      industry?: string
      website?: string
    }
  }
  jobTitle: string
  jobId: string
  jobDescription: string
  jobType: "Full-Time" | "Part-Time" | "Internship" | "Contract"
  location?: string[]
  industry?: string
  department?: string
  salaryRange?: { min: number; max: number }
  roleLevel?: "Entry" | "Mid" | "Senior"
  joiningDate?: Date
  applicationDeadline: Date
  numberOfOpenings?: number
  benefits?: string[]
  employmentType: "Permanent" | "Temporary" | "Contractual"
  eligibility?: {
    minEducationLevel?: string
    allowedDegrees?: string[]
    branches?: string[]
    minPercentage?: number
    graduationYears?: number[]
    experienceRequired?: string
    requiredSkills?: string[]
    preferredCertifications?: string[]
  }
  interview?: {
    interviewRequired: boolean
    nextRoundType?: string
    mode?: "Online" | "Offline" | "Phone"
    panelMembers?: string[]
    videoResponseRequired: boolean
    evaluationCriteria?: string[]
  }
  applicationSettings?: {
    acceptFrom: "All" | "College-specific" | "Invite-only"
    invitedColleges?: string[]
    customQuestions?: {
      question: string
      type: "text" | "dropdown" | "radio"
      options?: string[]
      required?: boolean
    }[]
    autoShortlistScore?: number
    resumeRequired: boolean
    videoScreeningRequired: boolean
  }
  publishing?: {
    status: "Draft" | "Published" | "Scheduled"
    publishDate?: Date
    visibility: "Public" | "Private" | "SelectedColleges"
    internalNotes?: string
  }
  assessment?: {
    _id: string
    title?: string
    description?: string
    type?: string
    duration?: number
    passingCriteria?: string
    instructions?: string
    skills?: string[]
    sections?: any[]
  }
  attachments?: {
    jdPdf?: string
    introVideo?: string
    presentationDeck?: string
    sampleQuestions?: string
    ndaDoc?: string
  }
  communication?: {
    confirmationEmailTemplate?: string
    reminderEnabled?: boolean
    reminderSchedule?: Date
    contactEmail: string
  }
  // College approval and batch management
  collegeApprovals?: {
    collegeId: string
    status: "pending" | "approved" | "rejected"
    approvedBy?: string
    approvedAt?: Date
    rejectionReason?: string
    allowedBatches?: number[]
  }[]
  requiresCollegeApproval: boolean
  // Frontend-specific fields that may be added by API responses
  batchEligible?: boolean
  eligibleBatches?: number[]
  studentGraduationYear?: number
  collegeApprovalStatus?: "pending" | "approved" | "rejected"
  allowedBatches?: number[]
  createdAt?: Date
  updatedAt?: Date
  applications?: string[]
}
