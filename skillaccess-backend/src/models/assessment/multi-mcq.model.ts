// mcqMulti.model.ts
import mongoose, { Schema, Document } from "mongoose";
import Question from "./question.model";

interface IMCQMulti extends Document {
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}

const MCQMultiSchema = new Schema<IMCQMulti>(
  {
    options: [
      {
        text: { type: String, required: true },
        isCorrect: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

const MCQMulti = Question.discriminator<IMCQMulti>("mcqmulti", MCQMultiSchema);
export default MCQMulti;
