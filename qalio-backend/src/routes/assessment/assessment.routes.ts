import express from "express";
import {
  createAssessment,
  getAllAssessments,
  getAssessmentById,
  getAssessmentResultById,
  getAssessmentsByCreator,
  getAssessmentsForInvitedStudent,
  updateAssessmentById,
} from "../../controllers/assessment/assessment.controller";
//import auth middleware
import { authenticateJWT } from "../../middlewares/auth/auth.middleware";
import { evaluateManualAssessmentResults } from "../../controllers/assessment/studentAttempt.controller";

const router = express.Router();

router.post("/", authenticateJWT, createAssessment);
router.get("/", getAllAssessments);
// New route
router.get("/invited", authenticateJWT, getAssessmentsForInvitedStudent);
router.get("/my", authenticateJWT, getAssessmentsByCreator);
router.get("/results/:id", authenticateJWT, getAssessmentResultById);
router.get("/:id", getAssessmentById);
router.patch("/:id", authenticateJWT, updateAssessmentById);
router.put(
  "/:assessmentId/evaluate",
  authenticateJWT,
  evaluateManualAssessmentResults
);

export default router;
