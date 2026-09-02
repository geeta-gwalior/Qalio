import express, { Request, Response } from "express"; // Ensure the types are correctly imported
import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  uploadMultipleQuestions,
} from "../../controllers/question/question.controller";
import { authenticateJWT } from "../../middlewares/auth/auth.middleware";

const router = express.Router();

// Define routes with correct types
router.post("/", createQuestion);
router.post("/upload", authenticateJWT, uploadMultipleQuestions);
router.get("/", getAllQuestions);
router.get("/:id", getQuestionById);
router.put("/:id", updateQuestion);
router.delete("/:id", deleteQuestion);

export default router;
