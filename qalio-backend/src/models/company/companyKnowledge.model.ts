import mongoose, { Schema, Document } from "mongoose";

export interface IKnowledgeDoc extends Document {
  companyId: mongoose.Types.ObjectId;
  title: string;
  type: "pdf" | "url" | "text" | "faq";
  content: string;
  sourceUrl?: string;
  fileName?: string;
  fileSize?: number;
  uploadedAt: Date;
}

const CompanyKnowledgeSchema: Schema = new Schema(
  {
    companyId: {
      type: Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["pdf", "url", "text", "faq"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    sourceUrl: {
      type: String,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    fileSize: {
      type: Number,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const CompanyKnowledge = mongoose.model<IKnowledgeDoc>(
  "CompanyKnowledge",
  CompanyKnowledgeSchema
);
