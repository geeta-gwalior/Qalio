import { Schema, model } from "mongoose";
import { IAssessment } from "../../types/assessmentSchemas";

const assessmentSchema = new Schema<IAssessment>(
  {
    visible: { type: Boolean, default: true },
    campusDrive: { type: Schema.Types.ObjectId, ref: "CampusDrive" },
    isReportGenerated: { type: Boolean, default: false },
    name: { type: String, required: true },
    additionalDescription: { type: String, required: false },
    totalTime: { type: Number, default: 0 },
    totalAttempts: { type: Number, default: 0 },
    totalMarks: { type: Number, default: 0 },
    duration_from: { type: String },
    duration_to: { type: String },
    isNegativeMarking: { type: Boolean, default: false },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    totalQuestionsCount: { type: Number, default: 0 },
    attemptCount: { type: Number, default: 0 },
    totalTopicsCount: { type: Number, default: 0, max: 5 },
    level: { type: String, default: "beginner" },
    type: { type: String, default: "mcq" },
    status: { type: String, default: "active" },
    college: { type: Schema.Types.ObjectId, ref: "College" },
    company: { type: Schema.Types.ObjectId, ref: "Company" },
    university: { type: Schema.Types.ObjectId, ref: "University" },
    job: { type: Schema.Types.ObjectId, ref: "Job" },
    createdByCompany: { type: Boolean, default: false },
    createdByUniversity: { type: Boolean, default: false },
    createdByCollege: { type: Boolean, default: false },
    isTotalDuration: { type: Boolean, default: false },
    // ✅ Store detailed topic & selected questions
    topics: [
      {
        topicId: { type: Schema.Types.ObjectId, ref: "Topic" },
        heading: { type: String, required: true },
        description: { type: String, required: true },
        selectedQuestions: [
          {
            questionId: { type: Schema.Types.ObjectId, ref: "Question" },
            title: { type: String, required: true },
            questionType: { type: String, required: true },
            totalMarks: { type: Number, default: 0 },
          },
        ],
      },
    ],
    studentResponses: [{ type: Schema.Types.ObjectId, ref: "StudentResponse" }],
    invitedStudents: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    avgPercentage: { type: Number, default: 0 },
    avgSelectedPercentage: { type: Number, default: 0 },
    avgRejectedPercentage: { type: Number, default: 0 },
    selectedStudents: [{ type: Schema.Types.ObjectId, ref: "StudentResponse" }],
    rejectedStudents: [{ type: Schema.Types.ObjectId, ref: "StudentResponse" }],
    appearedStudents: [{ type: Schema.Types.ObjectId, ref: "StudentResponse" }],
    category: { type: Schema.Types.ObjectId, ref: "Category" },
    categoryName: { type: String, default: "" },
    hasAccessToAllBranches: { type: Boolean, default: false },
    hasAccessToAllDepartments: { type: Boolean, default: false },
    accessibleDepartments: { type: [String], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "BaseUser" },
    isPublished: { type: Boolean, default: false },

    resultPublishedAt: { type: Date }, // for manual publish

    manualResultPublishStatus: {
      type: String,
      enum: ["pending", "in-progress", "published"],
      default: "pending",
    },

    // ------------------ CONFIGURABLE OPTIONS ------------------
    config: {
      instructions: {
        type: [
          {
            title: { type: String, required: true },
            description: { type: String, required: true },
          },
        ],
        default: [
          {
            title: "General Instructions",
            description:
              "1. Ensure a stable internet connection. 2. Do not navigate away from the test window.",
          },
          {
            title: "Submission Guidelines",
            description:
              "1. Make sure to submit your answers before the time runs out. 2. Once submitted, you cannot edit your response.",
          },
        ],
      },
      faqs: {
        type: [
          {
            question: { type: String, required: true },
            answer: { type: String, required: true },
          },
        ],
        default: [
          {
            question: "Can I participate in a sample challenge?",
            answer:
              "Yes, we recommend participating in a sample challenge to understand the process.",
          },
          {
            question: "What type of questions will I have to solve?",
            answer:
              "The challenge may include coding problems, multiple-choice questions, and subjective questions.",
          },
        ],
      },
      totalTime: { type: Number },
      isCameraRequired: { type: Boolean, default: true },
      maxTabSwitches: { type: Number, default: 3 },
      maxAudioLimitExceedCount: { type: Number, default: 3 },
      enableAudioProctoring: { type: Boolean, default: false },
      enableRandomShuffling: { type: Boolean, default: false },
      disableCopyPasteInEditor: { type: Boolean, default: false },
      takeSnapshotsDuringTest: { type: Boolean, default: false },
      restrictFullscreenMode: { type: Boolean, default: true },
      logoutOnLeave: { type: Boolean, default: false },
      restrictedIPs: [{ type: String, trim: true, default: [] }],
      openContest: { type: Boolean, default: false },
      isDeveloperToolsBlocked: { type: Boolean, default: true },
      resultPolicy: {
        type: String,
        enum: ["auto", "manual"],
        default: "auto", // default to current behavior
      },
    },
  },
  { timestamps: true }
);

// Add necessary indexes
assessmentSchema.index({ company: 1 });
assessmentSchema.index({ createdByCompany: 1 });
assessmentSchema.index({ college: 1 });
assessmentSchema.index({ campusDrive: 1 });

const Assessments = model<IAssessment>("Assessments", assessmentSchema);

export default Assessments;
