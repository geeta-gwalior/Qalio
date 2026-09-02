import express from "express";
import {
  createCodingQuestion,
  getAllCodingQuestions,
  getCodingQuestionById,
  updateCodingQuestion,
  deleteCodingQuestion,
} from "../../controllers/question/coding.controller";

const router = express.Router();

router.post("/", createCodingQuestion);
router.get("/", getAllCodingQuestions);
router.get("/:id", getCodingQuestionById);
router.put("/:id", updateCodingQuestion);
router.delete("/:id", deleteCodingQuestion);

export default router;
