import mongoose, { Schema, Document } from "mongoose";

export interface IQuestion extends Document {
  topic: mongoose.Types.ObjectId;
  title: string;
  duration: number; // Duration in seconds
  questionLevel: "beginner" | "intermediate" | "advanced";
  questionType:
    | "mcq"
    | "mcqmulti"
    | "findAnswer"
    | "descriptive"
    | "video"
    | "coding"
    | "prompt";
  totalMarks: number;
  subject: string;
  createdBy: mongoose.Types.ObjectId;
}

const QuestionSchema = new Schema<IQuestion>(
  {
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
      required: true,
    },
    title: { type: String, required: true },
    duration: { type: Number, required: true },
    questionLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },
    questionType: {
      type: String,
      enum: ["mcq", "mcqmulti", "findAnswer", "coding", "prompt"],
      required: true,
    },
    totalMarks: { type: Number, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseUser",
      required: true,
    },
  },
  { timestamps: true, discriminatorKey: "questionType" }
);

const Question = mongoose.model<IQuestion>("Question", QuestionSchema);

export default Question;
