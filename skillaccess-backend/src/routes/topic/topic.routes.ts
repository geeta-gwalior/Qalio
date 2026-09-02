import express from "express";
import {
  createTopic,
  getAllTopics,
  getTopicById,
  updateTopic,
  deleteTopic,
  addQuestionsToTopic,
} from "../../controllers/topic/topic.controller";
import { authenticateJWT } from "../../middlewares/auth/auth.middleware";

const router = express.Router();

// Define CRUD routes for topics
router.post("/", authenticateJWT, createTopic); // Create a topic
router.get("/", authenticateJWT, getAllTopics); // Get all topics
router.get("/:id", getTopicById); // Get a topic by ID
router.put("/:id", updateTopic); // Update a topic
router.delete("/:id", deleteTopic); // Delete a topic
router.patch("/:id/add-questions", addQuestionsToTopic); // Add questions to a topic

export default router;
