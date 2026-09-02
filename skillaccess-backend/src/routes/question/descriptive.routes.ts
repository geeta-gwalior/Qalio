import express from "express";
import {
  createDescriptiveQuestion,
  getAllDescriptiveQuestions,
  getDescriptiveQuestionById,
  updateDescriptiveQuestion,
  deleteDescriptiveQuestion,
} from "../../controllers/question/descriptive.controller";

const router = express.Router();

router.post("/", createDescriptiveQuestion);
router.get("/", getAllDescriptiveQuestions);
router.get("/:id", getDescriptiveQuestionById);
router.put("/:id", updateDescriptiveQuestion);
router.delete("/:id", deleteDescriptiveQuestion);

export default router;
