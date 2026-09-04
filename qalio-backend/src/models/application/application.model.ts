import mongoose, { Document, Schema } from "mongoose";

export interface IApplication extends Document {
  studentId: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  applicationData: {
    [key: string]: any; // Custom question answers
  };
  status:
    | "Applied"
    | "Under Review"
    | "Assessment Pending"
    | "Assessment Complete"
    | "Shortlisted"
    | "Rejected"
    | "Hired"
    |"Assessment Completed and Applied";
  applicationDate: Date;
  assessmentScore?: number;
  assessmentCompleted: boolean;
  assessmentId?: mongoose.Types.ObjectId;
  resumeUrl?: string;
  coverLetter?: string;
  lastUpdated: Date;
  companyNotes?: string;
  rejectionReason?: string;
  aiMatchScore?: number;
  aiMatchAnalysis?: {
    matchedSkills: string[];
    missingSkills: string[];
    summary: string;
    recommendation: "Strong Fit" | "Potential Fit" | "Low Fit";
  };
}

const applicationSchema = new Schema<IApplication>(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicationData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: [
        "Applied",
        "Under Review",
        "Assessment Pending",
        "Assessment Complete",
        "Shortlisted",
        "Rejected",
        "Hired",
        "Assessment Completed and Applied",
      ],
      default: "Applied",
    },
    applicationDate: {
      type: Date,
      default: Date.now,
    },
    assessmentScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    assessmentCompleted: {
      type: Boolean,
      default: false,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessments",
    },
    resumeUrl: {
      type: String,
    },
    coverLetter: {
      type: String,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    companyNotes: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    aiMatchScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    aiMatchAnalysis: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ studentId: 1, status: 1 });
applicationSchema.index({ jobId: 1, status: 1 });

// Update lastUpdated on save
applicationSchema.pre("save", function (next) {
  this.lastUpdated = new Date();
  next();
});

export const Application = mongoose.model<IApplication>(
  "Application",
  applicationSchema
);
