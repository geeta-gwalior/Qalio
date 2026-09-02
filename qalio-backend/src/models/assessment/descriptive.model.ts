import mongoose, { Schema, Document } from "mongoose";
import Question from "./question.model"; // ✅ Import Base Model

interface IDescriptive extends Document {
  answer: string;
  status: string;
  college?: mongoose.Types.ObjectId;
  company?: mongoose.Types.ObjectId;
  university?: mongoose.Types.ObjectId;
  createdByCompany: boolean;
  createdByCollege: boolean;
  createdByUniversity: boolean;
}

const DescriptiveSchema = new Schema<IDescriptive>(
  {
    answer: { type: String, default: "" },
    status: { type: String, required: true },
    college: { type: mongoose.Schema.Types.ObjectId, ref: "College" },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    university: { type: mongoose.Schema.Types.ObjectId, ref: "University" },
    createdByCompany: { type: Boolean, default: false },
    createdByCollege: { type: Boolean, default: false },
    createdByUniversity: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Register Descriptive as a discriminator of Question
const DescriptiveQuestion = Question.discriminator<IDescriptive>("Descriptive", DescriptiveSchema);

export default DescriptiveQuestion;
