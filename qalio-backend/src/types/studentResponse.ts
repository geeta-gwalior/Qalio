import { Types } from "mongoose";

export interface IStudentResponse extends Document {
  assessment: Types.ObjectId;
  student: Types.ObjectId;
  responses: {
    questionId: Types.ObjectId;
    answer: any;
    isCorrect: boolean;
    marksAwarded: number;
  }[];
  startedAt: Date;
  submittedAt?: Date;
  totalMarksScored: number;
  status: "in-progress" | "submitted";
  evaluatedStatus: "pending" | "evaluated";
  tabSwitchCount?: number;
  trustScore?: number;
  proctoringLogs?: {
    event: string;
    timestamp: Date;
    details?: string;
  }[];
}
