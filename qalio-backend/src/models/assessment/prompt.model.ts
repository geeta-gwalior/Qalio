import mongoose, { Schema, Document } from "mongoose";
import Question from "./question.model";

export interface IPromptQuestion extends Document {
  expectedOutputDescription: string; // Instructions for expected answer
}

const PromptSchema = new Schema<IPromptQuestion>(
  {
    expectedOutputDescription: { type: String, required: true },
  },
  { timestamps: true }
);

// Register Prompt as a discriminator
const Prompt = Question.discriminator<IPromptQuestion>("prompt", PromptSchema);

export default Prompt;
