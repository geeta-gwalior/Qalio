import mongoose, { Schema, Document } from "mongoose";
import Question from "./question.model"; // ✅ Import Base Model

interface ICoding extends Document {
  generatedDriverCode: boolean;
  code: {
    C?: { defaultCode: string; solutionCode: string };
    Cpp?: { defaultCode: string; solutionCode: string };
    Java?: { defaultCode: string; solutionCode: string };
    Python?: { defaultCode: string; solutionCode: string };
  };
  codeQuestion: string;
  parameters: string[];
  returnType: string;
  
  testcase: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }[];
  totalTestCases: number;
}

const CodingSchema = new Schema<ICoding>(
  {
    generatedDriverCode: { type: Boolean, default: false },
    code: { type: Object, default: {} },
    codeQuestion: { type: String, required: true },
    parameters: { type: [String], default: [] },
    returnType: { type: String, required: true },
    testcase: [
      {
        input: { type: String, required: true },
        expectedOutput: { type: String, required: true },
        isHidden: { type: Boolean, default: true },
      },
    ],
    totalTestCases: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ✅ Register Coding as a discriminator of Question
const Coding = Question.discriminator<ICoding>("coding", CodingSchema);

export default Coding;
