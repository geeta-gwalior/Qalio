import {
  applyToJob,
  createJob,
  deleteJob,
  getAllJobs,
  getCollegeJobs,
  getCompanyJobs,
  getJobById,
  getJobsAvailableToStudent,
  getStudentApplicationsWithJobs,
  applyToJobWithValidation,
  updateApplicationStatus,
  screenApplicationWithAI,
  getJobApplications,
  getPublicJobs,
  // New imports for college approval
  approveJobForCollege,
  getJobsPendingApproval,
  updateJob, // Declared the variable here
  uploadResumeForJobApplication,
  getCompanyAssessments,
} from "../../controllers/job/job.controller";
import express from "express";
import { authenticateJWT } from "../../middlewares/auth/auth.middleware";
import upload from "../../utils/multer";
const router = express.Router();

// Public routes
router.get("/public", getPublicJobs);

// Company routes
router.get("/company", authenticateJWT, getCompanyJobs);
router.get("/assessments/company", authenticateJWT, getCompanyAssessments);

// College approval routes
router.get(
  "/college/pending-approval",
  authenticateJWT,
  getJobsPendingApproval
);
router.put("/college/approve/:jobId", authenticateJWT, approveJobForCollege);

// College routes
router.get("/college/:collegeId", authenticateJWT, getCollegeJobs);

// Job CRUD
router.post("/create", authenticateJWT, createJob);
router.put("/:jobId", authenticateJWT, updateJob);
router.delete("/:jobId", authenticateJWT, deleteJob);
router.get("/", getAllJobs);
router.get("/:jobId", getJobById); // <-- Keep dynamic route last

// Student routes
router.get("/student/:studentId/available", getJobsAvailableToStudent);
router.get("/student/:studentId/applications", getStudentApplicationsWithJobs);

// Applications
router.post("/apply", applyToJob);
router.post("/apply-with-validation", applyToJobWithValidation);
router.put("/application/:applicationId/status", updateApplicationStatus);
router.post("/application/:applicationId/screen-ai", screenApplicationWithAI);
router.get("/:jobId/applications", getJobApplications);

// Resume upload
router.post(
  "/upload-resume",
  authenticateJWT,
  upload.single("resume"),
  uploadResumeForJobApplication
);

export default router;
