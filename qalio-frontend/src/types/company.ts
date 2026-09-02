export interface Company {
  id: number;
  companyName: string;
  estYear: number;
  employees: number;
  salaryRange?: string;
  location: string;
  jobsPosted?: number;
  logo?: string;
  aboutUs: string;
  achievements?: string[];
}

// Comprehensive TypeScript interfaces matching your backend schema
export interface ICompanyUser {
  _id: string;
  name: string;
  email: string;
  phone?: number;
  avatar?: string;
  address?: string;
}

export interface IBasicInfo {
  coverPhoto?: string;
  publicIdLogo?: string;
  publicIdCover?: string;
  logo?: string;
  companyName?: string;
  website?: string;
  totalEmployees?: number;
  yearFounded?: number;
  hqCity?: string;
  annualRevenue?: number;
  sector?: string;
  industry?: string;
  companyType?: string;
  status?: string;
  corporateEmail?: string;
  alternatePhone?: number;
}

export interface ILocation {
  locName?: string;
  address?: string;
  town?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface IAbout {
  description?: string;
  missions?: string;
  programs?: string;
}

export interface IJobDetails {
  primaryJobRoles?: string[];
  numberOfOpenPositions?: number;
  expectedSalaryRange?: string;
}

export interface ICompanyPolicies {
  internshipStipendPolicy?: "Paid" | "Unpaid" | "Depends on Role";
  workFromHomePolicy?: "Fully Remote" | "Hybrid" | "Onsite";
  diversityInclusionInitiatives?: string;
}

export interface IContactPerson {
  name?: string;
  designation?: string;
  email?: string;
  phone?: number;
}

export interface IOfficialInformation {
  companyType?: string;
  gstNumber?: string;
  udyamRegistrationNumber?: string;
  industryType?: string;
  yearOfEstablishment?: number;
}

export interface IAward {
  name?: string;
  description?: string;
  dateOfIssue?: Date;
  media?: string[];
}

export interface IDashboard {
  totalJobs?: number;
  studentsHired?: number;
  approved?: number;
  institutes?: number;
  assessments?: number;
  newJobs?: number;
  newHiredEmps?: number;
}

// Main company interface from API
export interface ICompanyAPI {
  _id: string;
  userId: ICompanyUser;
  status: "approved" | "pending" | "rejected";
  statusChangedAt?: Date;
  completedProfile: boolean;
  basic?: IBasicInfo;
  officialInformation?: IOfficialInformation;
  contactPerson?: IContactPerson;
  phone?: number;
  location?: ILocation;
  jobDetails?: IJobDetails;
  companyPolicies?: ICompanyPolicies;
  about?: IAbout;
  awards?: IAward[];
  dashboard?: IDashboard;
  jobs?: string[]; // Array of job IDs
  createdAt: string;
  updatedAt: string;
}

// Transformed company interface for frontend use
export interface ICompanyDisplay {
  _id: string;
  userId: string;
  companyName: string;
  industry: string;
  location: string[];
  website?: string;
  description?: string;
  logo?: string;
  yearEstablished?: number;
  employeeCount?: string;
  headquarters?: string;
  jobCount: number;
  latestJobDate?: string;
  status: "approved" | "pending" | "rejected";
  // Contact information
  email?: string;
  phone?: string;
  corporateEmail?: string;
  // Additional details
  companyType?: string;
  sector?: string;
  annualRevenue?: number;
  workFromHomePolicy?: string;
  internshipStipendPolicy?: string;
  // Awards and achievements
  awards?: IAward[];
  // Dashboard stats
  dashboard?: IDashboard;
}

export interface IJob {
  _id: string;
  title: string;
  companyId?: string | { _id: string; companyName: string };
  location: string;
  jobType: string;
  experience: string;
  salary: string;
  description: string;
  requirements: string[];
  skills: string[];
  postedDate: string;
  deadline: string;
  status: string;
}
