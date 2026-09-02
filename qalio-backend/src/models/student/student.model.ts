import mongoose, { Schema } from "mongoose";
import {
  IStudent,
  IEducation,
  ISkills,
  IPortfolio,
  IScore,
  IDocuments,
  WorkExperienceDocument,
} from "../../types/studentSchemas";

const educationSchema = new Schema<IEducation>({
  institutionName: { type: String, required: true },
  degree: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  // media: { type: Buffer },
  // yearOfPassing: { type: Number, required: true },
  // cgpa: { type: Number },
  field: { type: String, required: true },
  percentage: { type: Number },
  backlogs: { type: Number, default: 0 },
  certifications: [{ type: String }],
  affiliation: {
    type: String,
    enum: ["NAAC", "AICTE", "UGC", "None", "Other"],
    default: "None",
  },
});

const skillsSchema = new Schema<ISkills>({
  technicalSkills: [{ type: String }],
  nonTechnicalSkills: [{ type: String }],
  preferredJobRoles: [{ type: String }],
  preferredJobLocations: [{ type: String }],
});

const portfolioSchema = new Schema<IPortfolio>({
  title: { type: String, required: true },
  url: { type: String, required: true },
  description: { type: String },
  type: { type: String, required: true },
});

// const workExperienceSchema = new Schema<IWorkExperience>({
//   internships: [
//     {
//       company: { type: String },
//       role: { type: String },
//       startDate: { type: Date },
//       endDate: { type: Date },
//     },
//   ],
//   jobs: [
//     {
//       company: { type: String },
//       role: { type: String },
//       startDate: { type: Date },
//       endDate: { type: Date },
//     },
//   ],
// });

const workExperienceSchema = new Schema<WorkExperienceDocument>({
  internships: [
    {
      companyName: { type: String },
      position: { type: String },
      location: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      isCurrentlyWorking: { type: Boolean, default: false },
      description: { type: String },
      type: { type: String, enum: ["internship"], required: true },
    },
  ],
  jobs: [
    {
      companyName: { type: String },
      position: { type: String },
      location: { type: String },
      startDate: { type: Date },
      endDate: { type: Date },
      isCurrentlyWorking: { type: Boolean, default: false },
      description: { type: String },
      type: { type: String, enum: ["job"], required: true },
    },
  ],
});

const documentsSchema = new Schema<IDocuments>({
  resume: { type: String },
  markSheets: [{ type: String }],
  certificates: [{ type: String }],
  bonafideCertificate: { type: String },
});

const scoreSchema = new Schema<IScore>({
  assessmentId: { type: String, required: true },
  score: { type: Number, required: true },
  performance: { type: String, required: true },
  date: { type: Date, required: true },
  time: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "rejected", "shortlisted"],
    default: "pending",
  },
});

const studentSchema = new Schema<IStudent>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseUser",
      required: true,
    },
    completedProfile: { type: Boolean, default: false },
    // department: {
    //   type: String,
    //   enum: ["Arts", "Science", "Commerce", "Engineering", "Computer Science", "Management", "Law", "Medicine", "Education", "Design", "Others"],
    // },
    // batch: { type: String },
    approved: { type: Boolean, default: false },
    // hasFilledBasicInfo: { type: Boolean, default: false },
    dob: { type: Date, required: false },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: false,
    },
    altContactNumber: { type: String },
    aadharNumber: { type: String }, // Should be stored securely (hashed)
    panCardNumber: { type: String }, // Should be stored securely (hashed)
    digitalSignature: { type: String },
    emailConfirmed: { type: Boolean, default: false },
    // lastLogin: { type: Date },
    // loginAttempts: { type: Number, default: 0 },
    loggedOut: { type: Boolean, default: false },
    education: [educationSchema],
    skills: skillsSchema,
    portfolio: [portfolioSchema],
    workExperience: workExperienceSchema,
    score: [scoreSchema],
    placed: { type: Boolean, default: false },
    placedAt: { type: Date },
    companyPlaced: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    jobPlaced: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    documents: documentsSchema,
    batch: { type: String, default: "" }, // Default batch
    major: { type: String, default: "" }, // Default degree
  },
  { timestamps: true }
);

export const Student = mongoose.model<IStudent>("Student", studentSchema);
