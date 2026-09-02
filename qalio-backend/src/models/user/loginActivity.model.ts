import mongoose, { Schema, Document } from "mongoose";

export interface ILoginActivity extends Document {
  userId: mongoose.Types.ObjectId;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

const LoginActivitySchema = new Schema<ILoginActivity>({
  userId: { type: Schema.Types.ObjectId, ref: "BaseUser", required: true },
  ipAddress: { type: String, required: true },
  userAgent: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const LoginActivity = mongoose.model<ILoginActivity>("LoginActivity", LoginActivitySchema);
