import mongoose from "mongoose";

const publishedStudentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Student",
      unique: true,
    },
  },
  { timestamps: true }
);

const PublishedStudent =
  mongoose.models.PublishedStudent ||
  mongoose.model("PublishedStudent", publishedStudentSchema);

export default PublishedStudent;
