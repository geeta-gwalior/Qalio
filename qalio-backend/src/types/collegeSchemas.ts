import mongoose, { Document, Types } from "mongoose";

interface Comment {
  comment: string;
  commentedBy: Types.ObjectId;
  commentedAt: Date;
}

interface Email {
  from?: Types.ObjectId;
  message: string;
  subject: string;
}

interface SubscriptionInfo {
  selectedPlan?: Types.ObjectId;
  subscription?: Types.ObjectId;
  payments?: Types.ObjectId[];
  planEndDate?: Date;
}

interface Accreditation {
  body: "NAAC" | "UGC" | "AICTE" | "Other";
  grade?: "A++" | "A+" | "A" | "B++" | "B+" | "B" | "C" | "Unaccredited";
  validityPeriod?: Date;
  accreditationCertificate?: {
    publicId?: string;
    url?: string;
  };
}

interface Course {
  program: string;
  specializations: string[];
  intakeCapacity?: number;
}

interface PlacementStatistics {
  average?: string;
  highest?: string;
  averagePackage?: string;
}

interface StudentStrength {
  total?: string;
  finalYear?: string;
}

interface GenderRatio {
  male?: string;
  female?: string;
}

interface Infrastructure {
  laboratoryDetails?: string;
  campusArea?: string;
  hostelFacility?: "yes" | "no";
  libraryFacilities?: string;
  sportsFacilities?: string;
  transportFacilities?: string;
}

interface PlacementOfficer {
  name?: string;
  email?: string;
  phone?: string;
}

interface BankingDetails {
  panCard?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
}

interface CategoryDistribution {
  general?: string;
  scSt?: string;
  obc?: string;
  ews?: string;
}

interface AlumniNetwork {
  notableAlumni?: string[];
  achievements?: string[];
}

interface CommunityInvolvement {
  initiatives?: string[];
  description?: string;
}

interface GstCertificate {
  publicId?: string;
  url?: string;
}

export interface ICollege extends Document {
  userId: mongoose.Types.ObjectId;
  campusDrives: Types.ObjectId[];
  status: "approved" | "pending" | "rejected";
  statusChangedAt?: Date;
  commentsByAdmin: Comment[];
  tier: "tier1" | "tier2" | "tier3";
  qrVerify: boolean;
  collegeName: string;
  avgPackage: number;
  achievement?: "Statistics" | "Percentage" | "DataName";
  description?: string;
  website?: string;
  performance?: string;
  link?: string;
  inbox?: string;
  teams?: string;
  accounting?: string;
  totalStudents: number;
  totalCompanies: number;
  totalJobs: number;
  resetPasswordToken?: string;
  resetPasswordExpire?: Date;
  pendingStudents: Types.ObjectId[];
  students: Types.ObjectId[];
  assessments: Types.ObjectId[];
  topics: Types.ObjectId[];
  emails: Email[];
  emailsSent: Email[];
  subscriptionInfo: SubscriptionInfo;
  designatedCompanies: Types.ObjectId[];
  jobs: Types.ObjectId[];
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  region?: string;
  university?: string;
  accreditations: Accreditation[];
  collegeType?: "Government" | "Private" | "Autonomous";
  affiliationCertificate?: {
    publicId?: string;
    url?: string;
  };
  coursesOffered: Course[];
  topCompanies: string[];
  mous: string[];
  industryTieUps: string[];
  placementOfficer?: PlacementOfficer;
  placementStatistics?: PlacementStatistics;
  studentStrength?: StudentStrength;
  genderRatio?: GenderRatio;
  infrastructure?: Infrastructure;
  additionalInfo?: {
    mous?: string;
    industryTieUps?: string;
  };
  bankingDetails?: BankingDetails;
  yearOfEstablishment?: number;
  categoryDistribution?: CategoryDistribution;
  gstCertificate?: GstCertificate;
  alumniNetwork?: AlumniNetwork;
  communityInvolvement?: CommunityInvolvement;
}
