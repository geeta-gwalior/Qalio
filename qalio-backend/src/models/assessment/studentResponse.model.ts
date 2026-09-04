import { IStudentResponse } from "../../types/studentResponse";
import mongoose, { Schema, Document, Types, model } from "mongoose";

const studentResponseSchema = new Schema<IStudentResponse>(
  {
    assessment: {
      type: Schema.Types.ObjectId,
      ref: "Assessments",
      required: true,
    },
    student: { type: Schema.Types.ObjectId, ref: "BaseUser", required: true },
    responses: [
      {
        questionId: { type: Schema.Types.ObjectId, ref: "Question" },
        answer: { type: Schema.Types.Mixed },
        isCorrect: { type: Boolean },
        marksAwarded: { type: Number, default: 0 },
      },
    ],
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    totalMarksScored: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["in-progress", "submitted"],
      default: "in-progress",
    },
    evaluatedStatus: {
      type: String,
      enum: ["pending", "evaluated"],
      default: "pending",
    },
    tabSwitchCount: { type: Number, default: 0 },
    trustScore: { type: Number, default: 100 },
    proctoringLogs: [
      {
        event: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        details: { type: String },
      },
    ],
  },
  { timestamps: true }
);

export default model<IStudentResponse>(
  "StudentResponse",
  studentResponseSchema
);
