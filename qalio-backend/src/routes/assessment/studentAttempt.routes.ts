import express from "express";
import {
  startAssessmentAttempt,
  submitAssessmentAttempt,
  takeAndSaveScreenshot,
  logProctoringEvent,
} from "../../controllers/assessment/studentAttempt.controller";
import { authenticateJWT } from "../../middlewares/auth/auth.middleware";
import upload from "../../utils/multer";

const router = express.Router();

router.post("/start", authenticateJWT, startAssessmentAttempt);
router.post("/submit", authenticateJWT, submitAssessmentAttempt);
router.post("/proctoring-log", logProctoringEvent);
router.post(
  "/:id/screenshot",
  authenticateJWT,
  upload.single("screenshot"),
  takeAndSaveScreenshot
);

export default router;
