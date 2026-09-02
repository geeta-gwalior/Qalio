import mongoose, { Schema, Types } from "mongoose";
import {
  ILeader,
  ILocation,
  IAward,
  IDashboard,
  IComment,
  IBasicInfo,
  IEmail,
  ICompany,
  IOfficialInformation,
  IContactPerson,
  IJobDetails,
  ICompanyPolicies,
  IDocuments,
} from "../../types/companySchemas";

const LeaderSchema = new Schema<ILeader>({
  name: { type: String },
  title: { type: String },
  country: { type: String },
  isGlobalLeader: { type: Boolean },
});

const EmailSchema = new Schema<IEmail>({
  from: { type: Types.ObjectId, ref: "College" },
  message: { type: String },
  subject: { type: String },
});

const LocationSchema = new Schema<ILocation>({
  locName: { type: String },
  address: { type: String },
  town: { type: String },
  state: { type: String },
  country: { type: String },
  postalCode: { type: String },
});

const AwardsSchema = new Schema<IAward>({
  name: { type: String },
  description: { type: String },
  dateOfIssue: { type: Date },
  media: [{ type: String }],
});

const DashboardSchema = new Schema<IDashboard>({
  totalJobs: { type: Number },
  studentsHired: { type: Number },
  approved: { type: Number },
  institutes: { type: Number },
  assessments: { type: Number },
  newJobs: { type: Number },
  newHiredEmps: { type: Number },
});

const BasicInfoSchema = new Schema<IBasicInfo>({
  coverPhoto: { type: String },
  publicIdLogo: { type: String },
  publicIdCover: { type: String },
  logo: { type: String },
  companyName: { type: String },
  website: { type: String },
  totalEmployees: { type: Number },
  yearFounded: { type: Number },
  hqCity: { type: String },
  annualRevenue: { type: Number },
  sector: { type: String },
  industry: { type: String },
  companyType: { type: String },
  status: { type: String },
  corporateEmail: { type: String },
  alternatePhone: { type: Number },
});

const OfficialInfoSchema = new Schema<IOfficialInformation>({
  companyType: { type: String },
  gstNumber: { type: String },
  udyamRegistrationNumber: { type: String },
  industryType: { type: String },
  yearOfEstablishment: { type: Number },
});

const ContactPersonSchema = new Schema<IContactPerson>({
  name: { type: String },
  designation: { type: String },
  email: { type: String },
  phone: { type: Number },
});

const JobDetailsSchema = new Schema<IJobDetails>({
  primaryJobRoles: [{ type: String }],
  numberOfOpenPositions: { type: Number },
  expectedSalaryRange: { type: String },
});

const CompanyPoliciesSchema = new Schema<ICompanyPolicies>({
  internshipStipendPolicy: {
    type: String,
    enum: ["Paid", "Unpaid", "Depends on Role"],
  },
  workFromHomePolicy: {
    type: String,
    enum: ["Fully Remote", "Hybrid", "Onsite"],
  },
  diversityInclusionInitiatives: { type: String },
});

const DocumentsSchema = new Schema<IDocuments>({
  certificateOfIncorporation: { type: String },
  msmeCertificate: { type: String },
  isoCertification: { type: String },
  ndaAgreement: { type: String },
});

const CommentSchema = new Schema<IComment>({
  comment: { type: String },
  commentedBy: { type: Types.ObjectId, ref: "Admin" },
  commentedAt: { type: Date },
});

const CompanySchema = new Schema<ICompany>(
  {
    userId: { type: Types.ObjectId, ref: "BaseUser", required: true },
    campusDrives: [{ type: Types.ObjectId, ref: "CampusDrive" }],
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "pending",
    },
    statusChangedAt: { type: Date },
    completedProfile: { type: Boolean, default: false },
    commentsByAdmin: [CommentSchema],
    basic: BasicInfoSchema,
    officialInformation: OfficialInfoSchema,
    contactPerson: ContactPersonSchema,
    phone: { type: Number },
    location: LocationSchema,
    jobDetails: JobDetailsSchema,
    companyPolicies: CompanyPoliciesSchema,
    documents: DocumentsSchema,
    leader: LeaderSchema,
    about: {
      description: { type: String },
      missions: { type: String },
      programs: { type: String },
    },
    awards: [AwardsSchema],
    dashboard: DashboardSchema,
    students: [{ type: Types.ObjectId, ref: "Student" }],
    jobs: [{ type: Types.ObjectId, ref: "Job" }],
    assessments: [{ type: Types.ObjectId, ref: "Assessment" }],
    emails: [EmailSchema],
    emailsSent: [EmailSchema],
  },
  { timestamps: true }
);

export const Company = mongoose.model<ICompany>("Company", CompanySchema);
