export interface CourseType {
  program: string
  specializations: string[] // Made required instead of optional
  intakeCapacity?: number
  level?: string
  duration?: string
}

export interface PlacementStatistics {
  average?: string
  highest?: string
  averagePackage?: string
}

export interface PlacementOfficer {
  name?: string
  email?: string
  phone?: string
  designation?: string
}

export interface Infrastructure {
  laboratoryDetails?: string
  campusArea?: string
  hostelFacility?: "yes" | "no"
  libraryFacilities?: string
  sportsFacilities?: string
  transportFacilities?: string
  classrooms?: string
  labs?: string
  libraries?: string
}

export interface BankingDetails {
  panCard?: string
  bankName?: string
  accountNumber?: string
  ifscCode?: string
  accountHolderName?: string
  branchName?: string
  gstNumber?: string
}

export interface Accreditation {
  body?: string
  grade?: string
  validityPeriod?: string
  accreditationCertificate?: {
    url?: string
  }
}

// Update the UserInfo interface to match the BaseUser model structure
// export interface UserInfo {
//   _id?: string
//   name?: string
//   email?: string
//   phone?: string
//   address?: string
//   avatar?: {
//     url?: string
//     publicId?: string
//   }
// }

// Update the CollegeProfile interface to properly type userId
export interface CollegeProfile {
  _id?: string
  collegeName?: string
  name?: string
  userId?: {
    address?: string
    collegeName?: string
    avatar?: string
    name?: string
    phone?: string
    email?: string
  }
  email?: string
  phone?: string
  address?: string
  avatar?: string
  website?: string
  description?: string
  totalStudents?: number
  totalCompanies?: number
  totalJobs?: number
  avgPackage?: number
  country?: string
  state?: string
  city?: string
  zipCode?: string
  region?: string
  university?: string
  collegeType?: "Government" | "Private" | "Autonomous"
  yearOfEstablishment?: number
  coursesOffered?: CourseType[]
  placementStatistics?: PlacementStatistics
  topCompanies?: string[]
  placementOfficer?: PlacementOfficer
  infrastructure?: Infrastructure
  bankingDetails?: BankingDetails
  accreditations?: Accreditation[]
  gstCertificate?: {
    url?: string
  }
  affiliationCertificate?: {
    url?: string
  }
  status?: "pending" | "approved" | "rejected"
  tier?: string
  completionPercentage?: number
  // userId?: string | UserInfo // Can be either a string ID or a populated user object
}

// Add the ProfileStatusResponse interface at the end of the file
export interface ProfileStatusResponse {
  success: boolean
  status: "approved" | "pending" | "rejected"
  completionPercentage: number
  completedProfile: boolean
}
