import mongoose, { Schema, Document } from "mongoose";

interface ITopic extends Document {
  heading: string;
  description: string;
  totalQuestions: number;
  questionType:
    | "mcq"
    | "mcqmulti"
    | "findAnswer"
    | "essay"
    | "video"
    | "coding";
  questions: mongoose.Types.ObjectId[];
  college?: mongoose.Types.ObjectId;
  company?: mongoose.Types.ObjectId;
  university?: mongoose.Types.ObjectId;
  createdByCompany: boolean;
  createdByUniversity: boolean;
  createdByCollege: boolean;
  createdByAdmin: boolean;
  status: "active" | "inactive" | "archived";
  tags: string[];
  visibility: "public" | "private" | "restricted";
  linkedAssessments?: mongoose.Types.ObjectId[];
}

const TopicSchema = new Schema<ITopic>(
  {
    heading: {
      type: String,
      required: [true, "Please enter topic heading"],
    },
    description: {
      type: String,
      required: [true, "Please enter topic description"],
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    questionType: {
      type: String,
      enum: [
        "mcq",
        "mcq-multi",
        "findAnswer",
        "descriptive",
        "video",
        "coding",
      ],
      required: false,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    college: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "College",
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
    },
    university: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "University",
    },
    createdByCompany: {
      type: Boolean,
      default: false,
    },
    createdByUniversity: {
      type: Boolean,
      default: false,
    },
    createdByCollege: {
      type: Boolean,
      default: false,
    },
    createdByAdmin: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive", "archived"],
      default: "active",
    },
    tags: {
      type: [String],
      default: [],
    },
    visibility: {
      type: String,
      enum: ["public", "private", "restricted"],
      default: "private",
    },
    linkedAssessments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Assessment",
      },
    ],
  },
  { timestamps: true }
);

const Topic = mongoose.model<ITopic>("Topic", TopicSchema);

export default Topic;
