import mongoose, { Schema } from "mongoose";
import { IComment, IUniversity } from "../../types/universitySchemas";

const CommentSchema = new Schema<IComment>({
  comment: { type: String, required: true },
  commentedBy: { type: Schema.Types.ObjectId, ref: "Admin", required: true },
  commentedAt: { type: Date, default: Date.now },
});

const UniversitySchema = new Schema<IUniversity>({
  userId: { type: Schema.Types.ObjectId, ref: "BaseUser", required: true },
  logo: { type: String },
  description: { type: String },
  website: { type: String },
  tests: [{ type: Schema.Types.ObjectId, ref: "Test" }],
  colleges: [{ type: Schema.Types.ObjectId, ref: "College" }],
  commentsByAdmin: [CommentSchema],
  adminNotes: { type: String },
}, { timestamps: true });

export const University = mongoose.model<IUniversity>("University", UniversitySchema);
