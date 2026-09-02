import express from "express";
import {
  approveStudentForCollege,
  getStudentForCollege,
  registerCollege,
  uploadStudents,
  getCollegesForCompany,
  createCollege,
  getCollegeProfile,
  getCollegeById,
  updateBasicInfo,
  updateBaseUserInfo,
  uploadAvatar,
  updateAccreditation,
  uploadAccreditationCertificate,
  updateCoursesOffered,
  updatePlacementStatistics,
  updatePlacementOfficer,
  updateStudentDemographics,
  updateInfrastructure,
  updateBankingDetails,
  uploadGstCertificate,
  uploadAffiliationCertificate,
  updateIndustryConnections,
  updateAlumniNetwork,
  updateCommunityInvolvement,
  addCommentByAdmin,
  changeCollegeStatus,
  changeCollegeTier,
  addPendingStudent,
  approveStudent,
  rejectStudent,
  getCollegeStudents,
  getPendingStudents,
  getAllColleges,
  getStudentAssessmentResult,
  // getStudentAssessmentResult,
  getCollegeAvailableJobs,
  getCollegeDetails,
  getDesignatedCompanies,
  getCompanyDetails,
  inviteCompany,
  getInvitedCompaniesByCollege,
} from "../../controllers/college/college.controller";
import { authenticateJWT } from "../../middlewares/auth/auth.middleware";
import upload from "../../utils/multer";
import { changePassword } from "../../controllers/college/college.controller";

const router = express.Router();

router.post("/register", registerCollege);

router.post("/upload-students", authenticateJWT, uploadStudents);

router.get("/students", authenticateJWT, getStudentForCollege);

router.put("/approve", authenticateJWT, approveStudentForCollege);

// Public college routes
router.get("/public/:id", getCollegeById);

// College profile routes
router.post("/create", authenticateJWT, createCollege);
router.get("/me", authenticateJWT, getCollegeProfile);
router.put("/update-basic", authenticateJWT, updateBasicInfo);

// Base user info routes (NEW)
router.put("/update-base-user", authenticateJWT, updateBaseUserInfo);
router.post(
  "/upload-avatar",
  authenticateJWT,
  upload.single("avatar"),
  uploadAvatar
);

// Other profile update routes
router.put("/update-accreditation", authenticateJWT, updateAccreditation);
router.put("/update-courses", authenticateJWT, updateCoursesOffered);
router.put(
  "/update-placement-stats",
  authenticateJWT,
  updatePlacementStatistics
);
router.put(
  "/update-placement-officer",
  authenticateJWT,
  updatePlacementOfficer
);
router.put("/update-demographics", authenticateJWT, updateStudentDemographics);
router.put("/update-infrastructure", authenticateJWT, updateInfrastructure);
router.put("/update-banking", authenticateJWT, updateBankingDetails);
router.put("/update-industry", authenticateJWT, updateIndustryConnections);
router.put("/update-alumni", authenticateJWT, updateAlumniNetwork);
router.put("/update-community", authenticateJWT, updateCommunityInvolvement);

// Other profile update routes
router.put("/update-accreditation", authenticateJWT, updateAccreditation);
router.put("/update-courses", authenticateJWT, updateCoursesOffered);
router.put(
  "/update-placement-stats",
  authenticateJWT,
  updatePlacementStatistics
);
router.put(
  "/update-placement-officer",
  authenticateJWT,
  updatePlacementOfficer
);
router.put("/update-demographics", authenticateJWT, updateStudentDemographics);
router.put("/update-infrastructure", authenticateJWT, updateInfrastructure);
router.put("/update-banking", authenticateJWT, updateBankingDetails);
router.put("/update-industry", authenticateJWT, updateIndustryConnections);
router.put("/update-alumni", authenticateJWT, updateAlumniNetwork);
router.put("/update-community", authenticateJWT, updateCommunityInvolvement);

// Document upload routes
router.post(
  "/upload-accreditation/:accreditationIndex",
  authenticateJWT,
  upload.single("certificate"),
  uploadAccreditationCertificate
);
router.post(
  "/upload-gst",
  authenticateJWT,
  upload.single("certificate"),
  uploadGstCertificate
);
router.post(
  "/upload-affiliation",
  authenticateJWT,
  upload.single("certificate"),
  uploadAffiliationCertificate
);

// Student management routes
router.post("/student/add", authenticateJWT, addPendingStudent);
router.post("/student/approve", authenticateJWT, approveStudent);
router.post("/student/reject", authenticateJWT, rejectStudent);
router.get("/students", authenticateJWT, getCollegeStudents);
router.get("/students/pending", authenticateJWT, getPendingStudents);

// Admin routes
router.post("/admin/comment/:collegeId", authenticateJWT, addCommentByAdmin);
router.put("/admin/status/:collegeId", authenticateJWT, changeCollegeStatus);
router.put("/admin/tier/:collegeId", authenticateJWT, changeCollegeTier);
router.get("/admin/all", authenticateJWT, getAllColleges);

// Dashboard route
router.get("/dashboard", authenticateJWT, (req, res) => {
  res.json({ message: "Welcome to the College Dashboard!", user: req.body });
});

router.put("/change-password", authenticateJWT, changePassword);

//Result Routes
router.get("/student/result/:id", authenticateJWT, getStudentAssessmentResult);
router.get("/for-company", authenticateJWT, getCollegesForCompany);

router.get("/available-jobs", authenticateJWT, getCollegeAvailableJobs);
router.get("/getSavedDetails", authenticateJWT, getCollegeDetails);
router.get("/designatedCompanies", authenticateJWT, getDesignatedCompanies);
router.get("/getCompanyDetailsById/:id", authenticateJWT, getCompanyDetails);

//Routes of invite company

router.post("/invite-company", authenticateJWT, inviteCompany);
router.get("/invited-companies", authenticateJWT, getInvitedCompaniesByCollege);

export default router;
