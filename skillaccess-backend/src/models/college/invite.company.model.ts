import mongoose, { Document, Schema, Types } from "mongoose";

export interface IInvitedCompany extends Document {
  collegeId: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status?: "pending" | "accepted" | "rejected";
  invitedAt?: Date;
}

const invitedCompanySchema = new Schema<IInvitedCompany>({
  collegeId: { type: Schema.Types.ObjectId, ref: "College", required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },
  invitedAt: { type: Date, default: Date.now },
});

const InvitedCompany = mongoose.model<IInvitedCompany>(
  "InvitedCompany",
  invitedCompanySchema
);

export default InvitedCompany;
