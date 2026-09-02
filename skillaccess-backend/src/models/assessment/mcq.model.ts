import mongoose, { Schema, Document } from "mongoose";
import Question from "./question.model"; // Import the base Question model

interface IMCQ extends Document {
  isTrueFalse?: boolean;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}

const MCQSchema = new Schema<IMCQ>(
  {
    isTrueFalse: { type: Boolean, default: false }, // Identifies True/False questions
    options: [
      {
        text: { type: String, required: true },
        isCorrect: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

// ✅ Register MCQ as a discriminator of Question
const MCQ = Question.discriminator<IMCQ>("mcq", MCQSchema);

export default MCQ;
