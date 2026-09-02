import express from "express";
import {
  createFindAnswer,
  getAllFindAnswers,
  getFindAnswerById,
  updateFindAnswer,
  deleteFindAnswer,
} from "../../controllers/question/findAnswer.controller";

const router = express.Router();

router.post("/", createFindAnswer);
router.get("/", getAllFindAnswers);
router.get("/:id", getFindAnswerById);
router.put("/:id", updateFindAnswer);
router.delete("/:id", deleteFindAnswer);

export default router;
