import mongoose, { Schema, Document } from "mongoose";

export interface IChatMessage extends Document {
  content: string;
  sender: mongoose.Types.ObjectId;
  roomType: string;
  roomId: string;
  recipients?: mongoose.Types.ObjectId[];
  readBy?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  deleted?: boolean;
}

const ChatMessageSchema: Schema = new Schema(
  {
    content: { type: String, required: true },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BaseUser",
      required: true,
    },
    roomType: { type: String, required: true },
    roomId: { type: String, required: true },
    deleted: { type: Boolean, default: false },

    // ✅ New fields for read/unread logic
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BaseUser", // or "BaseUser" if it varies
      },
    ],
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BaseUser", // or "BaseUser"
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
