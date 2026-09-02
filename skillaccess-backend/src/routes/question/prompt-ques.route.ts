import express from "express";
import {
  createPromptQuestion,
  getAllPromptQuestions,
  getPromptQuestionById,
  updatePromptQuestion,
  deletePromptQuestion,
} from "../../controllers/question/prompt.controller";

const router = express.Router();

router.post("/", createPromptQuestion);
router.get("/", getAllPromptQuestions);
router.get("/:id", getPromptQuestionById);
router.put("/:id", updatePromptQuestion);
router.delete("/:id", deletePromptQuestion);
