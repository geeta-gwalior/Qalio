import {
  deleteChatMessage,
  getChatMessages,
  getUnreadCounts,
  markMessagesAsRead,
  sendMessage,
} from "../../controllers/chat/chat.controller";
import express from "express";

const router = express.Router();

// 🧾 Routes
router.get("/:roomType/:roomId", getChatMessages);
router.post("/", sendMessage);
router.delete("/:id", deleteChatMessage);
router.post("/mark-read", markMessagesAsRead);
router.get("/unread-counts", getUnreadCounts);

export default router;
