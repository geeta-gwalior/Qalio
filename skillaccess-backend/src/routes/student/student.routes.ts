import express from "express";
import {
  approveSelfAfterCompletion,
  completeProfile,
  createStudent,
  getPublicStudentProfile,
  getStudentAssessmentResult,
  getStudentProfile,
  getStudentProfileForCollege,
  getStudentResultByID,
  registerStudent,
  saveCompilerLog,
  togglePublishProfile,
  updateBaseUserInfo,
  updateBasicInfo,
  updateDocuments,
  updateEducation,
  updatePortfolio,
  updateSkills,
  updateWorkExperience,
  uploadStudentDocuments,
} from "../../controllers/student/student.controller";
import { authenticateJWT } from "../../middlewares/auth/auth.middleware";
import upload from "../../utils/multer";
import { changePassword } from "../../controllers/student/student.controller";

const router = express.Router();

router.post("/register", registerStudent);

router.post("/register/invite", createStudent);

router.get("/me", authenticateJWT, getStudentProfile);
router.get("/forcollege/:id", authenticateJWT, getStudentProfileForCollege);
router.get("/result/", authenticateJWT, getStudentResultByID);
router.post("/save-compiler-log", authenticateJWT, saveCompilerLog);

router.put("/update-base-user", authenticateJWT, updateBaseUserInfo);
router.put("/update-basic", authenticateJWT, updateBasicInfo);
router.put("/update-education", authenticateJWT, updateEducation);
router.put("/update-skills", authenticateJWT, updateSkills);
router.put("/update-portfolio", authenticateJWT, updatePortfolio);
router.put("/update-work", authenticateJWT, updateWorkExperience);
router.put("/update-documents", authenticateJWT, updateDocuments);

router.put("/complete-profile", authenticateJWT, completeProfile);
router.put("/self-approve", authenticateJWT, approveSelfAfterCompletion);
router.get("/student/result/:id", authenticateJWT, getStudentAssessmentResult);
router.post(
  "/upload-documents",
  authenticateJWT,
  upload.fields([
    { name: "resume", maxCount: 1 },
    { name: "bonafideCertificate", maxCount: 1 },
    { name: "markSheets", maxCount: 5 },
    { name: "certificates", maxCount: 5 },
  ]),
  uploadStudentDocuments
);

router.get("/dashboard", authenticateJWT, (req, res) => {
  res.json({ message: "Welcome to the Dashboard!", user: req.body });
});

router.put("/change-password", authenticateJWT, changePassword);

router.get("/public/:id", getPublicStudentProfile);

router.post("/publish", authenticateJWT, togglePublishProfile);

export default router;
