import mongoose, { Document, Schema, Types } from "mongoose";

// Interface for an individual student entry
export interface InvitedStudentEntry {
  email: string;
  firstName?: string;
  lastName?: string;
  profileLink?: string;
  student?: Types.ObjectId;
  link?: string;
  batch?: string;
  approved?: boolean;
  readyToBeApproved?: boolean; // Optional field for future use
  baseUserId?: Types.ObjectId; // Reference to BaseUser
  phone?: string; // Optional phone field
  major?: string; // Optional major field
}

// Main Document interface
export interface IInvitedStudents extends Document {
  college?: Types.ObjectId;
  university?: Types.ObjectId;
  students: InvitedStudentEntry[];
}

// Define Schema
const invitedStudentsSchema = new Schema<IInvitedStudents>({
  college: { type: Schema.Types.ObjectId, ref: "College" },
  university: { type: Schema.Types.ObjectId, ref: "University" },
  students: [
    {
      email: { type: String },
      firstName: { type: String },
      lastName: { type: String },
      profileLink: { type: String },
      student: { type: Schema.Types.ObjectId, ref: "Student" },
      link: { type: String },
      batch: { type: String, default: "2024" },
      approved: { type: Boolean, default: false },
      baseUserId: { type: Schema.Types.ObjectId, ref: "BaseUser" },
      phone: { type: String }, // Optional phone field
      major: { type: String }, // Optional major field
      //  readyForApproval: { type: Boolean, default: false },
    },
  ],
});

// Create and export model
const InvitedStudents = mongoose.model<IInvitedStudents>(
  "InvitedStudents",
  invitedStudentsSchema
);

export default InvitedStudents;
