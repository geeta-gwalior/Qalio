import mongoose, { Schema, Document } from "mongoose";
import Question from "./question.model"; // ✅ Import Base Model

interface IVideo extends Document {
  video: string;
  videoFile: string;
  videoLink?: string;
}

const VideoSchema = new Schema<IVideo>(
  {
    video: { type: String, required: true },
    videoFile: { type: String, required: true },
    videoLink: { type: String },
  },
  { timestamps: true }
);

// ✅ Register Video as a discriminator of Question
const Video = Question.discriminator<IVideo>("Video", VideoSchema);

export default Video;
