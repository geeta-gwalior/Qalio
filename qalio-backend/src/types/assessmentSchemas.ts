import { Schema, Document, model, Types } from "mongoose";

interface Instruction {
  title: string;
  description: string;
}

interface FAQ {
  question: string;
  answer: string;
}

export type ResultPolicy = "auto" | "manual";

interface AssessmentConfig {
  instructions: Instruction[];
  faqs: FAQ[];
  totalTime?: number;
  isCameraRequired: boolean;
  maxTabSwitches: number;
  maxAudioLimitExceedCount: number;
  enableAudioProctoring: boolean;
  enableRandomShuffling: boolean;
  disableCopyPasteInEditor: boolean;
  takeSnapshotsDuringTest: boolean;
  restrictFullscreenMode: boolean;
  logoutOnLeave: boolean;
  restrictedIPs: string[];
  openContest: boolean;
  isDeveloperToolsBlocked: boolean;
  resultPolicy: ResultPolicy;
}

export interface IAssessment extends Document {
  visible: boolean;
  campusDrive?: Types.ObjectId;
  isReportGenerated: boolean;
  name: string;
  additionalDescription: string;
  totalTime: number;
  totalAttempts: number;
  totalMarks: number;
  duration_from?: string;
  duration_to?: string;
  isNegativeMarking: boolean;
  startDate: Date;
  endDate?: Date;
  totalQuestionsCount: number;
  attemptCount: number;
  totalTopicsCount: number;
  level: string;
  type: string;
  status: string;
  college?: Types.ObjectId;
  company?: Types.ObjectId;
  university?: Types.ObjectId;
  job?: Types.ObjectId;
  createdByCompany: boolean;
  createdByUniversity: boolean;
  createdByCollege: boolean;
  topics: string[];
  studentResponses: Types.ObjectId[];
  invitedStudents: Types.ObjectId[];
  avgPercentage: number;
  avgSelectedPercentage: number;
  avgRejectedPercentage: number;
  selectedStudents: Types.ObjectId[];
  rejectedStudents: Types.ObjectId[];
  appearedStudents: Types.ObjectId[];
  category?: Types.ObjectId;
  categoryName: string;
  hasAccessToAllBranches: boolean;
  hasAccessToAllDepartments: boolean;
  accessibleDepartments: string[];
  createdBy?: Types.ObjectId;
  config: AssessmentConfig;
  isPublished: boolean;
  isTotalDuration: boolean;
  resultPolicy: any | ResultPolicy;
  resultPublishedAt: Date;
  manualResultPublishStatus?: "pending" | "in-progress" | "published";
}
