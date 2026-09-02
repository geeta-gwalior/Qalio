import mongoose, { Document} from "mongoose";

// Leader Interface
export interface ILeader {
  name: string;
  title: string;
  country: string;
  isGlobalLeader: boolean;
}

// Location Interface
export interface ILocation {
  locName: string;
  address: string;
  town: string;
  state: string;
  country: string;
  postalCode: string;
}

// Awards Interface
export interface IAward {
  name: string;
  description: string;
  dateOfIssue: Date;
  media: string[];
}

// Dashboard Interface
export interface IDashboard {
  totalJobs: number;
  studentsHired: number;
  approved: number;
  institutes: number;
  assessments: number;
  newJobs: number;
  newHiredEmps: number;
}

// Comments by Admin Interface
export interface IComment {
  comment: string;
  commentedBy: mongoose.Schema.Types.ObjectId;
  commentedAt: Date;
}

// Basic Company Information Interface
export interface IBasicInfo {
  coverPhoto: string;
  publicIdLogo: string;
  publicIdCover: string;
  logo: string;
  companyName: string;
  operationalLocations?: string[];
  revenue?: string;
  website: string;
  totalEmployees: number;
  yearFounded: number;
  hqCity: string;
  annualRevenue: number;
  sector: string;
  industry: string;
  companyType: string;
  status: string;
  corporateEmail: string; 
  alternatePhone?: number;
}

export interface IOfficialInformation {
  companyType: string,
  gstNumber?: string,
  udyamRegistrationNumber?: string,
  industryType: string,
  yearOfEstablishment: number,
}

export interface IContactPerson {
  name: string;
  designation: string;
  email: string;
  phone: number;
}

// Job Details Interface
export interface IJobDetails {
  primaryJobRoles: string[];
  numberOfOpenPositions: number;
  expectedSalaryRange: string;
}

// Company Policies Interface
export interface ICompanyPolicies {
  internshipStipendPolicy: "Paid" | "Unpaid" | "Depends on Role";
  workFromHomePolicy?: "Fully Remote" | "Hybrid" | "Onsite";
  diversityInclusionInitiatives?: string;
}

// Documents Interface
export interface IDocuments {
  certificateOfIncorporation: string;
  msmeCertificate?: string;
  isoCertification?: string;
  ndaAgreement: string;
}

// Email Interface
export interface IEmail {
  from: mongoose.Schema.Types.ObjectId;
  message: string;
  subject: string;
}

// Main Company Interface
export interface ICompany extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  campusDrives: mongoose.Schema.Types.ObjectId[];
  status: "approved" | "pending" | "rejected";
  statusChangedAt?: Date;
  completedProfile: boolean;
  commentsByAdmin: IComment[];
  basic: IBasicInfo;
  officialInformation: IOfficialInformation;
  phone?: number;
  location: ILocation;
  jobDetails: IJobDetails;
  companyPolicies: ICompanyPolicies;
  documents: IDocuments;
  leader: ILeader;
  about: {
    description: string;
    missions: string;
    programs: string;
  };
  awards: IAward[];
  dashboard: IDashboard;
  students: mongoose.Schema.Types.ObjectId[];
  jobs: mongoose.Schema.Types.ObjectId[];
  assessments: mongoose.Schema.Types.ObjectId[];
  emails: IEmail[];
  emailsSent: IEmail[];
  contactPerson: IContactPerson;
}
