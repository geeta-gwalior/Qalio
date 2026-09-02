import mongoose, { Schema, Document } from "mongoose";
import Question from "./question.model"; // ✅ Import Base Model
interface IEmbeddedQuestion {
  questionText: string;
  options: { text: string; isCorrect: boolean }[];
  //explanation?: string;
}
interface IFindAnswer extends Document {
  title?: string;
  passage: string;
  questions: IEmbeddedQuestion[];
}

const FindAnswerSchema = new Schema<IFindAnswer>(
  {
    title: { type: String },
    passage: { type: String, required: true },
    questions: [
      {
        questionText: { type: String, required: true },
        options: [
          {
            text: { type: String, required: true },
            isCorrect: { type: Boolean, default: false },
          },
        ],
        //   explanation: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const FindAnswer = Question.discriminator<IFindAnswer>(
  "findAnswer",
  FindAnswerSchema
);

export default FindAnswer;
