import mongoose, { Schema, model } from "mongoose";
import { ICollege } from "../../types/collegeSchemas";

const commentSchema = new Schema({
  comment: { type: String },
  commentedBy: { type: mongoose.Types.ObjectId, ref: "User" },
  commentedAt: { type: Date, default: Date.now },
});

const emailSchema = new Schema({
  from: { type: mongoose.Types.ObjectId, ref: "User" },
  message: { type: String },
  subject: { type: String },
});

const subscriptionInfoSchema = new Schema({
  selectedPlan: { type: mongoose.Types.ObjectId, ref: "Plan" },
  subscription: { type: mongoose.Types.ObjectId, ref: "Subscription" },
  payments: [{ type: mongoose.Types.ObjectId, ref: "Payment" }],
  planEndDate: { type: Date },
});

const accreditationSchema = new Schema({
  body: { type: String, enum: ["NAAC", "UGC", "AICTE", "Other"] },
  grade: {
    type: String,
    enum: ["A++", "A+", "A", "B++", "B+", "B", "C", "Unaccredited"],
  },
  validityPeriod: { type: Date },
  accreditationCertificate: {
    publicId: { type: String },
    url: { type: String },
  },
});

const courseSchema = new Schema({
  program: { type: String },
  specializations: [{ type: String }],
  intakeCapacity: { type: Number },
});

const placementStatisticsSchema = new Schema({
  average: { type: String },
  highest: { type: String },
  averagePackage: { type: String },
});

const studentStrengthSchema = new Schema({
  total: { type: String },
  finalYear: { type: String },
});

const genderRatioSchema = new Schema({
  male: { type: String },
  female: { type: String },
});

const infrastructureSchema = new Schema({
  laboratoryDetails: { type: String },
  campusArea: { type: String },
  hostelFacility: { type: String, enum: ["yes", "no"] },
  libraryFacilities: { type: String },
  sportsFacilities: { type: String },
  transportFacilities: { type: String },
});

const placementOfficerSchema = new Schema({
  name: { type: String },
  email: { type: String },
  phone: { type: String },
});

const bankingDetailsSchema = new Schema({
  panCard: { type: String },
  bankName: { type: String },
  accountNumber: { type: String },
  ifscCode: { type: String },
});

const categoryDistributionSchema = new Schema({
  general: { type: String },
  scSt: { type: String },
  obc: { type: String },
  ews: { type: String },
});

const alumniNetworkSchema = new Schema({
  notableAlumni: [{ type: String }],
  achievements: [{ type: String }],
});

const communityInvolvementSchema = new Schema({
  initiatives: [{ type: String }],
  description: { type: String },
});

const gstCertificateSchema = new Schema({
  publicId: { type: String },
  url: { type: String },
});

const collegeSchema = new Schema<ICollege>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseUser",
      required: true,
    },
    campusDrives: [{ type: mongoose.Types.ObjectId, ref: "CampusDrive" }],
    status: { type: String, enum: ["approved", "pending", "rejected"], default: "pending" },
    statusChangedAt: { type: Date },
    commentsByAdmin: [commentSchema],
    tier: { type: String, enum: ["tier1", "tier2", "tier3"], default: "tier3" },
    qrVerify: { type: Boolean, default: false },
    collegeName: { type: String },
    avgPackage: { type: Number },
    achievement: {
      type: String,
      enum: ["Statistics", "Percentage", "DataName"],
    },
    description: { type: String },
    website: { type: String },
    performance: { type: String },
    link: { type: String },
    inbox: { type: String },
    teams: { type: String },
    accounting: { type: String },
    totalStudents: { type: Number },
    totalCompanies: { type: Number },
    totalJobs: { type: Number },
    resetPasswordToken: { type: String },
    resetPasswordExpire: { type: Date },
    pendingStudents: [{ type: mongoose.Types.ObjectId, ref: "Student" }],
    students: [{ type: mongoose.Types.ObjectId, ref: "BaseUser" }],
    assessments: [{ type: mongoose.Types.ObjectId, ref: "Assessment" }],
    topics: [{ type: mongoose.Types.ObjectId, ref: "Topic" }],
    emails: [emailSchema],
    emailsSent: [emailSchema],
    subscriptionInfo: subscriptionInfoSchema,
    designatedCompanies: [{ type: mongoose.Types.ObjectId, ref: "Company" }],
    jobs: [{ type: mongoose.Types.ObjectId, ref: "Job" }],
    country: { type: String },
    state: { type: String },
    city: { type: String },
    zipCode: { type: String },
    region: { type: String },
    university: { type: String },
    accreditations: [accreditationSchema],
    collegeType: {
      type: String,
      enum: ["Government", "Private", "Autonomous"],
    },
    affiliationCertificate: {
      publicId: { type: String },
      url: { type: String },
    },
    coursesOffered: [courseSchema],
    topCompanies: [{ type: String }],
    mous: [{ type: String }],
    industryTieUps: [{ type: String }],
    placementOfficer: placementOfficerSchema,
    placementStatistics: placementStatisticsSchema,
    studentStrength: studentStrengthSchema,
    genderRatio: genderRatioSchema,
    infrastructure: infrastructureSchema,
    additionalInfo: {
      mous: { type: String },
      industryTieUps: { type: String },
    },
    bankingDetails: bankingDetailsSchema,
    yearOfEstablishment: { type: Number },
    categoryDistribution: categoryDistributionSchema,
    gstCertificate: gstCertificateSchema,
    alumniNetwork: alumniNetworkSchema,
    communityInvolvement: communityInvolvementSchema,
  },
  { timestamps: true }
);

export const College = model<ICollege>("College", collegeSchema);
