import mongoose, { Document, Schema, Types } from "mongoose";

export interface IInvitedCollege extends Document {
  company: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  status?: "pending" | "accepted" | "rejected";
  invitedAt?: Date;
}

const invitedCollegeSchema = new Schema<IInvitedCollege>({
  company: { type: Schema.Types.ObjectId, ref: "Company", required: true },
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

const InvitedCollege = mongoose.model<IInvitedCollege>(
  "InvitedCollege",
  invitedCollegeSchema
);

export default InvitedCollege;
