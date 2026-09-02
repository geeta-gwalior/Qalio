import mongoose, { Document, Schema } from "mongoose";

export interface TestCase {
  input: string;
  output: string;
  expectedOutput: string;
  studentOutput?: string;
  passed: boolean;
  isHidden: boolean;
  _id: mongoose.Types.ObjectId;
}

export interface CodeByLanguage {
  defaultCode?: string;
  solutionCode?: string;
  answerCode?: string;
}

export interface ICompilerLog extends Document {
  student: mongoose.Types.ObjectId;
  assessment: mongoose.Types.ObjectId;
  attempt: number;
  //   code: {
  //     C?: CodeByLanguage;
  //     Cpp?: CodeByLanguage;
  //     Java?: CodeByLanguage;
  //     Python?: CodeByLanguage;
  //   };
  code: string;
  question: mongoose.Types.ObjectId;
  testcase: TestCase[];
  totalTestCases: number;
  totalPassedTestCases: number;
  codeLanguage: string;
  createdAt: Date;
  updatedAt: Date;
}

const compilerLogSchema = new Schema<ICompilerLog>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Students", required: true },
    assessment: {
      type: Schema.Types.ObjectId,
      ref: "Assessments",
      required: true,
    },
    attempt: { type: Number, default: 1 },
    // code: {
    //   C: {
    //     defaultCode: String,
    //     solutionCode: String,
    //     answerCode: String,
    //   },
    //   Cpp: {
    //     defaultCode: String,
    //     solutionCode: String,
    //     answerCode: String,
    //   },
    //   Java: {
    //     defaultCode: String,
    //     solutionCode: String,
    //     answerCode: String,
    //   },
    //   Python: {
    //     defaultCode: String,
    //     solutionCode: String,
    //     answerCode: String,
    //   },
    // },
    code: { type: String },
    question: { type: Schema.Types.ObjectId, ref: "Compiler", required: true },
    testcase: [
      {
        input: String,
        output: String,
        expectedOutput: String,
        studentOutput: String,
        passed: { type: Boolean, default: false },
        isHidden: { type: Boolean, default: true },
        _id: { type: Schema.Types.ObjectId },
      },
    ],
    totalTestCases: { type: Number, default: 0 },
    totalPassedTestCases: { type: Number, default: 0 },
    codeLanguage: { type: String, required: true },
  },
  { timestamps: true }
);

const CompilerLog = mongoose.model<ICompilerLog>(
  "CompilerLog",
  compilerLogSchema
);
export default CompilerLog;
