import { authenticateJWT } from "../../middlewares/auth/auth.middleware";
import {
  generateQuestion,
  uploadQuestionByAI,
} from "../../controllers/question/uploadQuestionByAi.controller";

import express from "express";

const router = express.Router();

router.post("/upload-ai", authenticateJWT, uploadQuestionByAI); // Upload question using AI

router.get("/generate-question", generateQuestion);

export default router;