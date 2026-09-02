import mongoose, { Schema, type Document } from "mongoose";

export interface IJob extends Document {
  companyId: mongoose.Types.ObjectId;
  jobTitle: string;
  jobId: string;
  jobDescription: string;
  jobType: "Full-Time" | "Part-Time" | "Internship" | "Contract";
  location?: string[];
  industry?: string;
  department?: string;
  salaryRange?: { min: number; max: number };
  roleLevel?: "Entry" | "Mid" | "Senior";
  joiningDate?: Date;
  applicationDeadline: Date;
  numberOfOpenings?: number;
  benefits?: string[];
  employmentType: "Permanent" | "Temporary" | "Contractual";
  eligibility?: {
    minEducationLevel?: string;
    allowedDegrees?: string[];
    branches?: string[];
    minPercentage?: number;
    graduationYears?: number[];
    experienceRequired?: string;
    requiredSkills?: string[];
    preferredCertifications?: string[];
    allowedMajors?: string[]; // Added for batch-specific jobs
  };
  interview?: {
    interviewRequired: boolean;
    nextRoundType?: string;
    mode?: "Online" | "Offline" | "Phone";
    panelMembers?: string[];
    videoResponseRequired: boolean;
    evaluationCriteria?: string[];
  };
  applicationSettings?: {
    acceptFrom: "All" | "College-specific" | "Invite-only";
    invitedColleges?: mongoose.Types.ObjectId[];
    customQuestions?: {
      question: string;
      type: "text" | "dropdown" | "radio";
      options?: string[];
      required?: boolean;
    }[];
    autoShortlistScore?: number;
    resumeRequired: boolean;
    videoScreeningRequired: boolean;
    allowedBatches?: number[]; // Added for batch-specific jobs
  };
  publishing?: {
    status: "Draft" | "Published" | "Scheduled";
    publishDate?: Date;
    visibility: "Public" | "Private" | "SelectedColleges" | "SelectedBatches";
    internalNotes?: string;
    isOpen?: boolean; // Added to control application acceptance
  };
  assessment?: mongoose.Types.ObjectId;
  attachments?: {
    jdPdf?: string;
    introVideo?: string;
    presentationDeck?: string;
    sampleQuestions?: string;
    ndaDoc?: string;
  };
  communication?: {
    confirmationEmailTemplate?: string;
    reminderEnabled?: boolean;
    reminderSchedule?: Date;
    contactEmail: string;
  };
  // College approval and batch management
  collegeApprovals?: {
    collegeId: mongoose.Types.ObjectId;
    status: "pending" | "approved" | "rejected";
    approvedBy?: mongoose.Types.ObjectId;
    approvedAt?: Date;
    rejectionReason?: string;
    allowedBatches?: number[]; // Graduation years this college allows
    allowedMajors?: string[]; // Majors allowed for this job
  }[];
  requiresCollegeApproval: boolean;
  // Additional fields for better job management
  status?: "active" | "inactive" | "closed" | "draft";
  priority?: "low" | "medium" | "high" | "urgent";
  tags?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  // New field to store applicant data directly in the job document
  applicants?: mongoose.Types.ObjectId[];
  applicantCount?: number;
}

const jobSchema = new Schema<IJob>(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseUser",
      required: true,
      index: true,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    jobId: {
      type: String,
      unique: true,
      index: true,
    },
    jobDescription: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    jobType: {
      type: String,
      enum: ["Full-Time", "Part-Time", "Internship", "Contract"],
      required: true,
      index: true,
    },
    location: [
      {
        type: String,
        trim: true,
      },
    ],
    industry: {
      type: String,
      trim: true,
      index: true,
    },
    department: {
      type: String,
      trim: true,
    },
    salaryRange: {
      min: {
        type: Number,
        min: 0,
      },
      max: {
        type: Number,
        min: 0,
        validate: {
          validator: function (this: IJob, value: number) {
            return !this.salaryRange?.min || value >= this.salaryRange.min;
          },
          message:
            "Maximum salary must be greater than or equal to minimum salary",
        },
      },
    },
    roleLevel: {
      type: String,
      enum: ["Entry", "Mid", "Senior"],
      index: true,
    },
    joiningDate: {
      type: Date,
      validate: {
        validator: (value: Date) => value >= new Date(),
        message: "Joining date must be in the future",
      },
    },
    applicationDeadline: {
      type: Date,
      required: true,
      index: true,
      validate: {
        validator: (value: Date) => value >= new Date(),
        message: "Application deadline must be in the future",
      },
    },
    numberOfOpenings: {
      type: Number,
      default: 1,
      min: 1,
      max: 1000,
    },
    benefits: [
      {
        type: String,
        trim: true,
      },
    ],
    employmentType: {
      type: String,
      enum: ["Permanent", "Temporary", "Contractual"],
      default: "Permanent",
      index: true,
    },
    eligibility: {
      minEducationLevel: {
        type: String,
        trim: true,
      },
      allowedDegrees: [
        {
          type: String,
          trim: true,
        },
      ],
      branches: [
        {
          type: String,
          trim: true,
        },
      ],
      minPercentage: {
        type: Number,
        min: 0,
        max: 100,
      },
      graduationYears: [
        {
          type: Number,
          min: 1950,
          max: 2050,
          index: true,
        },
      ],
      allowedMajors: [
        {
          type: String,
          trim: true,
          enum: [
            "B.Tech",
            "M.Tech",
            "BCA",
            "MCA",
            "BSc",
            "MSc",
            "BBA",
            "MBA",
            // add other majors as needed
          ],
        },
      ],
      experienceRequired: {
        type: String,
        trim: true,
      },
      requiredSkills: [
        {
          type: String,
          trim: true,
        },
      ],
      preferredCertifications: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    interview: {
      interviewRequired: {
        type: Boolean,
        default: false,
      },
      nextRoundType: {
        type: String,
        trim: true,
      },
      mode: {
        type: String,
        enum: ["Online", "Offline", "Phone"],
        default: "Online",
      },
      panelMembers: [
        {
          type: String,
          trim: true,
        },
      ],
      videoResponseRequired: {
        type: Boolean,
        default: false,
      },
      evaluationCriteria: [
        {
          type: String,
          trim: true,
        },
      ],
    },
    applicationSettings: {
      acceptFrom: {
        type: String,
        enum: ["All", "College-specific", "Invite-only"],
        default: "All",
        index: true,
      },
      invitedColleges: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "College",
          index: true,
        },
      ],
      customQuestions: [
        {
          question: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
          },
          type: {
            type: String,
            enum: ["text", "dropdown", "radio"],
            required: true,
          },
          options: [
            {
              type: String,
              trim: true,
            },
          ],
          required: {
            type: Boolean,
            default: false,
          },
        },
      ],
      autoShortlistScore: {
        type: Number,
        min: 0,
        max: 100,
      },
      resumeRequired: {
        type: Boolean,
        default: true,
      },
      videoScreeningRequired: {
        type: Boolean,
        default: false,
      },
      allowedBatches: [
        {
          type: Number,
          min: 1950,
          max: 2050,
          index: true,
        },
      ],
    },
    publishing: {
      status: {
        type: String,
        enum: ["Draft", "Published", "Scheduled"],
        default: "Draft",
        index: true,
      },
      publishDate: {
        type: Date,
      },
      visibility: {
        type: String,
        enum: ["Public", "Private", "SelectedColleges", "SelectedBatches"],
      },
      internalNotes: {
        type: String,
        maxlength: 1000,
      },
      isOpen: {
        type: Boolean,
        default: true,
        index: true,
      },
    },
    assessment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assessments",
    },
    attachments: {
      jdPdf: {
        type: String,
      },
      introVideo: {
        type: String,
        trim: true,
      },
      presentationDeck: {
        type: String,
        trim: true,
      },
      sampleQuestions: {
        type: String,
        trim: true,
      },
      ndaDoc: {
        type: String,
        trim: true,
      },
    },
    communication: {
      confirmationEmailTemplate: {
        type: String,
        maxlength: 2000,
      },
      reminderEnabled: {
        type: Boolean,
        default: false,
      },
      reminderSchedule: {
        type: Date,
      },
      contactEmail: {
        type: String,
      },
    },
    // College approval and batch management
    collegeApprovals: [
      {
        collegeId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "College",
          required: true,
          index: true,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
          index: true,
        },
        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "BaseUser",
        },
        approvedAt: {
          type: Date,
        },
        rejectionReason: {
          type: String,
          maxlength: 500,
        },
        allowedBatches: [
          {
            type: Number,
            min: 1950,
            max: 2050,
          },
        ],
        allowedMajors: [
          {
            type: String,
            trim: true,
            enum: [
              "B.Tech",
              "M.Tech",
              "BCA",
              "MCA",
              "BSc",
              "MSc",
              "BBA",
              "MBA",
              // add other majors as needed
            ],
          },
        ],

        // Graduation years
      },
    ],
    requiresCollegeApproval: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Additional fields for better job management
    status: {
      type: String,
      enum: ["active", "inactive", "closed", "draft"],
      default: "draft",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    applicants: [
      {
        studentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Student",
          required: true,
        },
        applicationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Application",
          required: true,
        },
        applicationDate: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: [
            "Applied",
            "Under Review",
            "Assessment Pending",
            "Assessment Complete",
            "Assessment Completed and Applied",
            "Shortlisted",
            "Rejected",
            "Hired",
          ],
          default: "Applied",
        },
        assessmentCompleted: {
          type: Boolean,
          default: false,
        },
        assessmentScore: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    ],
    applicantCount: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for getting the total number of applicants
jobSchema.virtual("totalApplicants").get(function (this: IJob) {
  return this.applicants?.length || 0;
});

// Update applicantCount when applicants are modified
jobSchema.pre("save", function (next) {
  if (this.isModified("applicants")) {
    this.applicantCount = this.applicants?.length || 0;
  }
  next();
});

export const Job = mongoose.model<IJob>("Job", jobSchema);
