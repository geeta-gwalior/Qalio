import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

export interface IBaseUser extends Document {
  name: string;
  email: string;
  phone: string;
  address?: string;
  password: string;
  role: "university" | "student" | "company" | "admin" | "college" | "others";
  avatar?: {
    public_id: string;
    url: string;
  };
  isApproved: boolean;
  readyToBeApproved: boolean; // ✅ Added for future use
  verificationStatus: "pending" | "approved" | "rejected";
  otp: string;
  otpExpires: Date;
  otpVerified: boolean;
  authType: "manual" | "google" | "invite"; // ✅ Updated authType
  comparePassword(password: string): Promise<boolean>;
  getJWTToken(): string;
}

const BaseUserSchema = new Schema<IBaseUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    address: { type: String },
    password: { type: String, required: false, select: false }, // ❗ Make password optional for Google login
    role: {
      type: String,
      enum: ["university", "student", "college", "company", "admin", "others"],
      default: "others",
      required: true,
    },
    avatar: {
      public_id: { type: String },
      url: { type: String },
    },
    isApproved: { type: Boolean, default: false },
    readyToBeApproved: { type: Boolean, default: false }, // ✅ Added for future use
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    otp: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    otpVerified: {
      type: Boolean,
      default: false,
    },
    authType: {
      type: String,
      enum: ["manual", "google", "invite"], // ✅ Now supports both manual & Google login
      default: "manual",
    },
  },
  { timestamps: true }
);

//  Hash password before saving (only if password is provided)
BaseUserSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//  Compare entered password with hashed password
BaseUserSchema.methods.comparePassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

//  Generate JWT token
BaseUserSchema.methods.getJWTToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET as string, // ✅ Removed unnecessary quotes
    { expiresIn: "1h" }
  );
};

export const BaseUser = mongoose.model<IBaseUser>("BaseUser", BaseUserSchema);