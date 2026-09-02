// src/routes/company/company.routes.ts
import express from "express";
import * as companyController from "../../controllers/company/company.controller";
import { authenticateJWT } from "../../middlewares/auth/auth.middleware";
import catchAsyncErrors from "../../middlewares/error/catchAsyncErrors";
import { changePassword } from "../../controllers/company/company.controller";
import {
  getStudentJobAssessmentResult,
  getCompanyJobsWithAssessments,
} from "../../controllers/company/company.controller";
const router = express.Router();

// Apply authentication middleware to all routes except registration
router.post("/register", catchAsyncErrors(companyController.registerCompany));

// Protected routes
router.use(authenticateJWT);

// Company profile routes
router.get("/profile", catchAsyncErrors(companyController.getCompanyProfile));
router.get(
  "/profile/status",
  catchAsyncErrors(companyController.getProfileStatus)
);

// Profile update routes
router.put(
  "/profile/basic",
  catchAsyncErrors(companyController.updateBasicInfo)
);
router.put(
  "/profile/official",
  catchAsyncErrors(companyController.updateOfficialInfo)
);
router.put(
  "/profile/contact-person",
  catchAsyncErrors(companyController.updateContactPerson)
);
router.put(
  "/profile/location",
  catchAsyncErrors(companyController.updateLocation)
);
router.put(
  "/profile/job-details",
  catchAsyncErrors(companyController.updateJobDetails)
);
router.put(
  "/profile/policies",
  catchAsyncErrors(companyController.updateCompanyPolicies)
);
router.put("/profile/about", catchAsyncErrors(companyController.updateAbout));
router.put(
  "/profile/leader",
  catchAsyncErrors(companyController.updateCompanyLeader)
);
router.post(
  "/profile/awards",
  catchAsyncErrors(companyController.addCompanyAward)
);

// File upload routes
router.put(
  "/profile/documents",
  catchAsyncErrors(companyController.uploadCompanyDocuments)
);
router.put(
  "/profile/images",
  catchAsyncErrors(companyController.uploadCompanyImages)
);

// Profile completion and dashboard routes
router.put(
  "/profile/complete",
  catchAsyncErrors(companyController.completeProfile)
);
router.get(
  "/profile/comments",
  catchAsyncErrors(companyController.getAdminComments)
);
router.get(
  "/dashboard",
  catchAsyncErrors(companyController.initializeDashboard)
);
router.put("/change-password", authenticateJWT, changePassword);
//Result
router.get(
  "/student/result/:id",
  authenticateJWT,
  getStudentJobAssessmentResult
);
router.get(
  "/assessment/result/",
  authenticateJWT,
  getCompanyJobsWithAssessments
);

router.get(
  "/applicants-data/:id",
  authenticateJWT,
  companyController.getApplicantsData
);


//Controller for invite college

router.get(
  "/invited-colleges",
  authenticateJWT,
  companyController.getInvitedCollegesByCompany
);

router.post(
  "/invite-college",
  authenticateJWT,
  companyController.inviteCollege
);

export default router;
