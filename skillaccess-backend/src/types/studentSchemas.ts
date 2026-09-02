import mongoose, { Document } from "mongoose";

export interface IStudent extends Document {
  userId: mongoose.Types.ObjectId; // Reference to BaseUser
  completedProfile: boolean;
  // department: string;
  // batch: string;
  approved: boolean;
  //hasFilledBasicInfo?: boolean;
  dob: Date;
  gender: "Male" | "Female" | "Other";
  altContactNumber?: string;
  aadharNumber?: string;
  panCardNumber?: string;
  digitalSignature?: string; // Digital Signature (Optional)
  emailConfirmed: boolean;
  // lastLogin?: Date;
  // loginAttempts: number;
  loggedOut: boolean;
  profile?: string;
  education: IEducation[];
  skills: ISkills;
  portfolio: IPortfolio[];
  workExperience?: ExperienceItem;
  score: IScore[];
  placed: boolean;
  placedAt?: Date;
  companyPlaced?: mongoose.Types.ObjectId;
  jobPlaced?: mongoose.Types.ObjectId;
  documents: IDocuments;
  batch?: string; // Optional field for batch information
  major?: string; // Optional field for major information
}

export interface IEducation {
  institutionName: string; // Previously 'school'
  description?: string;
  degree: string;
  startDate: Date;
  endDate?: Date;
  // media?: Buffer;
  field: string;
  // yearOfPassing: number;
  // cgpa?: number; // Numeric CGPA
  percentage?: number; // Numeric Percentage
  backlogs: number;
  certifications?: string[];
  affiliation?: "NAAC" | "AICTE" | "UGC" | "None";
  batch?: string; // Optional field for batch information
  major?: string; // Optional field for major information
}

export interface ISkills {
  technicalSkills: string[];
  nonTechnicalSkills?: string[];
  preferredJobRoles: string[];
  preferredJobLocations?: string[];
}

export type ExperienceType = "internship" | "job";
export interface ExperienceItem {
  companyName: string;
  position: string;
  location?: string;
  startDate: Date;
  endDate?: Date;
  isCurrentlyWorking: boolean;
  description?: string;
  type: ExperienceType;
}

export interface WorkExperienceDocument {
  internships?: ExperienceItem[];
  jobs?: ExperienceItem[];
}

export interface IDocuments {
  resume: string;
  markSheets: string[];
  certificates?: string[];
  bonafideCertificate?: string;
}

export interface IPortfolio {
  title: string;
  url: string;
  description?: string;
  type: string;
}

export interface IScore {
  assessmentId: string;
  score: number;
  performance: string;
  date: Date;
  time: number;
  status: "pending" | "rejected" | "shortlisted";
}