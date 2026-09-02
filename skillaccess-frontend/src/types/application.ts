export interface IApplicationData {
  [key: string]: any
}

export interface IApplication {
  _id: string
  studentId: string
  jobId:
    | string
    | {
        _id: string
        jobTitle: string
        companyId: {
          _id: string
          basic?: {
            companyName?: string
            logo?: string
            industry?: string
          }
        }
        location?: string[]
        jobType: string
        applicationDeadline: string
      }
  applicationData: IApplicationData
  status:
    | "Applied"
    | "Under Review"
    | "Assessment Pending"
    | "Assessment Complete"
    | "Shortlisted"
    | "Rejected"
    | "Hired"
  applicationDate: string
  assessmentScore?: number
  assessmentCompleted: boolean
  assessmentId?: string
  resumeUrl?: string
  coverLetter?: string
  lastUpdated: string
  companyNotes?: string
  rejectionReason?: string
}
