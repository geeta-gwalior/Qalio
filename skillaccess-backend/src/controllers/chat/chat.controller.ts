import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import chatMessageModel from "../../models/chatMessage.model";
import Assessments from "../../models/assessment/assessment.model";
import { BaseUser } from "../../models/user/baseUser.model";
import catchAsyncErrors from "../../middlewares/error/catchAsyncErrors";
import { ErrorHandler } from "../../utils/errorHandler";
import { getIO } from "../../socket";
import { Job } from "../../models/job/job.model";

// If you're using socket.io in this controller

// 📌 Get all messages in a room
export const getChatMessages = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { roomType, roomId } = req.params;

    const messages = await chatMessageModel
      .find({
        roomType,
        roomId,
        deleted: { $ne: true },
      })
      .populate("sender", "name role")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  }
);

// 📌 Send a message and broadcast via socket.io
// export const sendMessage = catchAsyncErrors(
//   async (req: Request, res: Response) => {
//     const io = getIO();

//     const { content, sender, roomType, roomId } = req.body;

//     let recipients: mongoose.Types.ObjectId[] = [];

//     if (roomType === "assessment-updates") {
//       const assessment = await Assessments.findById(roomId).lean();
//       if (!assessment) {
//         res
//           .status(404)
//           .json({ success: false, message: "Assessment not found" });
//       }
//       recipients = assessment!.invitedStudents ?? [];
//     } else {
//       console.log("first Here");
//       const allUsers = await BaseUser.find({}, "_id").lean();
//       // recipients = allUsers.map((u) => u._id);
//     }

//     const newMessage = await chatMessageModel.create({
//       content,
//       sender,
//       roomType,
//       roomId,
//       recipients,
//       readBy: [sender], // Sender has already read it
//     });

//     // ✅ Populate sender (name and role) for frontend display
//     const populatedMessage = await newMessage.populate("sender", "name role");

//     // Emit to Socket.IO
//     io.to(`${roomType}:${roomId}`).emit("chat_message", populatedMessage);

//     // Send populated message in response
//     res.status(201).json({ success: true, message: populatedMessage });
//   }
// );

export const sendMessage = catchAsyncErrors(
  async (req: Request, res: Response) => {
    const io = getIO();

    const { content, sender, roomType, roomId } = req.body;

    let recipients: mongoose.Types.ObjectId[] = [];

    if (roomType === "assessment-updates") {
      // Try to find Assessment directly
      let assessment = await Assessments.findById(roomId).lean();

      if (!assessment) {
        // If not found, assume it's a Job ID and try to fetch the assessment from the Job
        const job = await Job.findById(roomId).lean();

        if (!job) {
          res
            .status(404)
            .json({ success: false, message: "Job or Assessment not found" });
        }

        if (job!.assessment?._id) {
          assessment = await Assessments.findById(job!.assessment._id).lean();
        }
      }

      if (assessment?.invitedStudents?.length) {
        recipients = assessment.invitedStudents;
      }
    }

    const newMessage = await chatMessageModel.create({
      content,
      sender,
      roomType,
      roomId,
      recipients,
      readBy: [sender], // Sender has already read it
    });

    const populatedMessage = await newMessage.populate("sender", "name role");

    io.to(`${roomType}:${roomId}`).emit("chat_message", populatedMessage);

    res.status(201).json({ success: true, message: populatedMessage });
  }
);

// 📌 Mark messages in a room as read by a user
export const markMessagesAsRead = catchAsyncErrors(
  async (req: Request, res: Response) => {
    const { userId, roomType, roomId } = req.body;

    await chatMessageModel.updateMany(
      {
        roomType,
        roomId,
        deleted: { $ne: true },
        readBy: { $ne: userId },
      },
      {
        $addToSet: { readBy: userId }, // Prevent duplicates
      }
    );

    res.status(200).json({ success: true });
  }
);

// 📌 Get unread message counts grouped by room
export const getUnreadCounts = catchAsyncErrors(
  async (req: Request, res: Response) => {
    const userId = new mongoose.Types.ObjectId(req.query.userId as string);

    const unreadCounts = await chatMessageModel.aggregate([
      {
        $match: {
          deleted: { $ne: true },
          recipients: userId,
          readBy: { $ne: userId },
        },
      },
      {
        $group: {
          _id: { roomType: "$roomType", roomId: "$roomId" },
          count: { $sum: 1 },
        },
      },
    ]);

    const result: Record<string, number> = {};
    unreadCounts.forEach(({ _id, count }) => {
      const key =
        _id.roomType === "job-announcements"
          ? "job-announcements"
          : `assessment-${_id.roomId}`;
      result[key] = count;
    });

    res.status(200).json({ success: true, unreadCounts: result });
  }
);

// 📌 Soft delete a chat message
export const deleteChatMessage = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const message = await chatMessageModel.findByIdAndUpdate(
      id,
      { deleted: true },
      { new: true }
    );

    if (!message) return next(new ErrorHandler("Message not found", 404));

    res.status(200).json({ success: true, message });
  }
);
