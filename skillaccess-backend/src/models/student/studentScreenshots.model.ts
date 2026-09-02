import mongoose, { Document, Schema, Model } from "mongoose";

interface IScreenshot {
  image: {
    public_id: string;
    url: string;
  };
  date: Date;
}

export interface IStudentScreenshots extends Document {
  studentId: mongoose.Types.ObjectId;
  assessmentId: mongoose.Types.ObjectId;
  studentResponseId: mongoose.Types.ObjectId;
  screenshots: IScreenshot[];
}

const ScreenshotSchema = new Schema<IScreenshot>({
  image: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
  date: { type: Date, default: () => new Date() },
});

const StudentScreenshotsSchema = new Schema<IStudentScreenshots>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "Students", required: true },
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: "Assessments",
      required: true,
    },
    studentResponseId: {
      type: Schema.Types.ObjectId,
      ref: "StudentResponse",
      required: true,
    },
    screenshots: {
      type: [ScreenshotSchema],
      required: true,
      default: undefined, // avoid default empty array to force explicit assignment
    },
  },
  { timestamps: true }
);

const StudentScreenshots: Model<IStudentScreenshots> =
  mongoose.model<IStudentScreenshots>(
    "StudentScreenshots",
    StudentScreenshotsSchema
  );

export default StudentScreenshots;
