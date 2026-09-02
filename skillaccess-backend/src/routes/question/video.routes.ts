import express from "express";

import {
  createVideoQuestion,
  getAllVideoQuestions,
  getVideoQuestionById,
  updateVideoQuestion,
  deleteVideoQuestion,
} from "../../controllers/question/video.controller";

const router = express.Router();

router.post("/", createVideoQuestion);
router.get("/", getAllVideoQuestions);
router.get("/:id", getVideoQuestionById);
router.put("/:id", updateVideoQuestion);
router.delete("/:id", deleteVideoQuestion);



export default router;
