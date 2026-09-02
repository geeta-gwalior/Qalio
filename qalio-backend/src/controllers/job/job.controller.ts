// //Old code
// // Create Job
// export const createJob = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const job = new Job(req.body);
//     await job.save();
//     res.status(201).json({ success: true, data: job });
//   } catch (error) {
//     res.status(500).json({ success: false, message: (error as Error).message });
//   }
// };

// // Get All Jobs
// export const getAllJobs = async (
//   _req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const jobs = await Job.find()
//       .populate("company")
//       .populate("Student")
//       .populate("College");
//     res.status(200).json({ success: true, data: jobs });
//   } catch (error) {
//     res.status(500).json({ success: false, message: (error as Error).message });
//   }
// };

// // Get Job by ID
// export const getJobById = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   try {
//     const job = await Job.findById(req.params.id).populate("company");
//     if (!job) {
//       res.status(404).json({ success: false, message: "Job not found" });
//       return;
//     }
//     res.status(200).json({ success: true, data: job });
//   } catch (error) {
//     res.status(500).json({ success: false, message: (error as Error).message });
//   }
// };

// // Update Job
// export const updateJob = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const job = await Job.findByIdAndUpdate(req.params.id, req.body, {
//       new: true,
//     });
//     if (!job) {
//       res.status(404).json({ success: false, message: "Job not found" });
//       return;
//     }
//     res.status(200).json({ success: true, data: job });
//   } catch (error) {
//     res.status(500).json({ success: false, message: (error as Error).message });
//   }
// };

// // Delete Job
// export const deleteJob = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const job = await Job.findByIdAndDelete(req.params.id);
//     if (!job) {
//       res.status(404).json({ success: false, message: "Job not found" });
//       return;
//     }
//     res
//       .status(200)
//       .json({ success: true, message: "Job deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: (error as Error).message });
//   }
// };
// //*** */

// import { Request, Response, NextFunction } from "express";
// import { Job } from "../../models/job.model";
// import { Assessment } from "../../models/assessment.model";
// import { InvitedStudents } from "../../models/college/invite.model";
// import { Student } from "../../models/student/student.model";
// import { ErrorHandler } from "../../utils/errorHandler";
// import catchAsyncErrors from "../../middlewares/error/catchAsyncErrors";

// // Create a new job listing
// export const createJob = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
//   const { title, description, companyId } = req.body;

//   if (!title || !description || !companyId) {
//     return next(new ErrorHandler("Please provide all required fields", 400));
//   }

//   const newJob = await Job.create({ title, description, companyId });
//   res.status(201).json({ success: true, job: newJob });
// });

// // Get all job listings
// export const getJobs = catchAsyncErrors(async (req: Request, res: Response) => {
//   const jobs = await Job.find();
//   res.status(200).json({ success: true, jobs });
// });

// // Get a single job listing by ID
// export const getJobById = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
//   const job = await Job.findById(req.params.id);
//   if (!job) {
//     return next(new ErrorHandler("Job not found", 404));
//   }
//   res.status(200).json({ success: true, job });
// });

// // Update a job listing
// export const updateJob = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
//   const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
//   if (!updatedJob) {
//     return next(new ErrorHandler("Job not found", 404));
//   }
//   res.status(200).json({ success: true, job: updatedJob });
// });

// // Delete a job listing
// export const deleteJob = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
//   const deletedJob = await Job.findByIdAndDelete(req.params.id);
//   if (!deletedJob) {
//     return next(new ErrorHandler("Job not found", 404));
//   }
//   res.status(200).json({ success: true, message: "Job deleted successfully" });
// });

// // Associate an assessment with a job
// export const associateAssessment = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
//   const { jobId, assessmentId } = req.body;

//   const job = await Job.findById(jobId);
//   if (!job) {
//     return next(new ErrorHandler("Job not found", 404));
//   }

//   const assessment = await Assessment.findById(assessmentId);
//   if (!assessment) {
//     return next(new ErrorHandler("Assessment not found", 404));
//   }

//   job.assessment = assessmentId;
//   await job.save();

//   res.status(200).json({ success: true, message: "Assessment associated with job" });
// });

// // Invite students to apply for a job
// export const inviteStudents = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
//   const { jobId, collegeId, inviteLink } = req.body;

//   const job = await Job.findById(jobId);
//   if (!job) {
//     return next(new ErrorHandler("Job not found", 404));
//   }

//   const collegeInv = await InvitedStudents.findOne({ collegeId });
//   if (!collegeInv) {
//     return next(new ErrorHandler("No invitation records found", 400));
//   }

//   const invited = collegeInv.students.find(student => student.link === inviteLink);
//   if (!invited) {
//     return next(new ErrorHandler("Invalid invitation link", 400));
//   }

//   const studentsToInvite = await Student.find({ collegeId, isApproved: true });

//   // Logic to send invitations to students (e.g., via email or notification)
//   // For simplicity, we'll just log the students being invited
//   studentsToInvite.forEach(student => {
//     console.log(`Inviting student ${student.userId} to apply for job ${jobId}`);
//     // Send invitation logic here
//   });

//   res.status(200).json({ success: true, message: "Students invited to apply for the job" });
// });

//*******//here is latest chat code ======== ************

// import { Request, Response, NextFunction } from "express";
// import { Job } from "../../models/job.model";
// import { Assessment } from "../../models/assessment.model";
// import { Company } from "../../models/company.model";
// import { College } from "../../models/college.model";
// import { ErrorHandler } from "../../utils/errorHandler";
// import catchAsyncErrors from "../../middlewares/error/catchAsyncErrors";

// // Create a new Job
// export const createJob = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     const { title, description, companyId, assessmentId, visibility, collegeIds } = req.body;

//     // Validate required fields
//     if (!title || !description || !companyId) {
//       return next(new ErrorHandler("Title, description, and company ID are required", 400));
//     }

//     // Check if company exists
//     const company = await Company.findById(companyId);
//     if (!company) {
//       return next(new ErrorHandler("Company not found", 404));
//     }

//     // Check if assessment exists
//     let assessment = null;
//     if (assessmentId) {
//       assessment = await Assessment.findById(assessmentId);
//       if (!assessment) {
//         return next(new ErrorHandler("Assessment not found", 404));
//       }
//     }

//     // Handle visibility and college-specific access
//     if (visibility === "restricted" && collegeIds && collegeIds.length > 0) {
//       const colleges = await College.find({ _id: { $in: collegeIds } });
//       if (colleges.length !== collegeIds.length) {
//         return next(new ErrorHandler("Some colleges not found", 404));
//       }
//     }

//     // Create the job
//     const job = await Job.create({
//       title,
//       description,
//       companyId,
//       assessmentId: assessment ? assessment._id : null,
//       visibility,
//       collegeIds: visibility === "restricted" ? collegeIds : [],
//     });

//     res.status(201).json({
//       success: true,
//       message: "Job created successfully",
//       job,
//     });
//   }
// );

// // Get all Jobs
// export const getAllJobs = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     const jobs = await Job.find().populate("companyId assessmentId collegeIds");
//     res.status(200).json({
//       success: true,
//       jobs,
//     });
//   }
// );

// // Get a single Job by ID
// export const getJobById = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     const job = await Job.findById(req.params.id).populate("companyId assessmentId collegeIds");
//     if (!job) {
//       return next(new ErrorHandler("Job not found", 404));
//     }
//     res.status(200).json({
//       success: true,
//       job,
//     });
//   }
// );

// // Update a Job
// export const updateJob = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     const { title, description, assessmentId, visibility, collegeIds } = req.body;

//     // Find the job
//     const job = await Job.findById(req.params.id);
//     if (!job) {
//       return next(new ErrorHandler("Job not found", 404));
//     }

//     // Update job details
//     if (title) job.title = title;
//     if (description) job.description = description;
//     if (assessmentId) {
//       const assessment = await Assessment.findById(assessmentId);
//       if (!assessment) {
//         return next(new ErrorHandler("Assessment not found", 404));
//       }
//       job.assessmentId = assessment._id;
//     }
//     if (visibility) job.visibility = visibility;
//     if (collegeIds && collegeIds.length > 0) {
//       const colleges = await College.find({ _id: { $in: collegeIds } });
//       if (colleges.length !== collegeIds.length) {
//         return next(new ErrorHandler("Some colleges not found", 404));
//       }
//       job.collegeIds = collegeIds;
//     }

//     // Save updated job
//     await job.save();

//     res.status(200).json({
//       success: true,
//       message: "Job updated successfully",
//       job,
//     });
//   }
// );

// // Delete a Job
// export const deleteJob = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     const job = await Job.findByIdAndDelete(req.params.id);
//     if (!job) {
//       return next(new ErrorHandler("Job not found", 404));
//     }
//     res.status(200).json({
//       success: true,
//       message: "Job deleted successfully",
//     });
//   }
// );

// // Apply to a Job (Student)
// export const applyToJob = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction): Promise<void> => {
//     const { studentId, jobId } = req.body;

//     // Validate required fields
//     if (!studentId || !jobId) {
//       return next(new ErrorHandler("Student ID and Job ID are required", 400));
//     }

//     // Check if job exists
//     const job = await Job.findById(jobId).populate("assessmentId");
//     if (!job) {
//       return next(new ErrorHandler("Job not found", 404));
//     }

//     // Check if job is visible to the student's college
//     if (job.visibility === "restricted") {
//       const student = await Student.findById(studentId);
//       if (!student || !job.collegeIds.includes(student.collegeId.toString())) {
//         return next(new ErrorHandler("Job not available for your college", 403));
//       }
//     }

//     // Check if assessment is required
//     if (job.assessmentId) {
//       // Redirect to assessment
//       return res.status(200).json({
//         success: true,
//         message: "Assessment required",
//         assessmentLink: `/assessment/${job.assessmentId}`,
//       });
//     }

//     // Proceed with job application
//     // (Implement application logic here)

//     res.status(200).json({
//       success: true,
//       message: "Applied to job successfully",
//     });
//   }
// );

//here is optimise code

// export const createJob = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const {
//       jobTitle,
//       jobDescription,
//       companyId,
//       assessmentId,
//       applicationDeadline,
//       visibility,
//       invitedColleges, // Array<ObjectId>
//       jobType,
//       roleLevel,
//       location,
//       department,
//       salaryRange,
//       employmentType,
//       interview,
//       eligibility,
//     } = req.body;

//     if (!jobTitle || !jobDescription || !companyId || !applicationDeadline) {
//       return next(new ErrorHandler("Missing required fields", 400));
//     }

//     const companyExists = await Company.findById(companyId);

//     if (!companyExists) {
//       return next(new ErrorHandler("Company not found", 404));
//     }

//     let assessment = null;
//     if (assessmentId) {
//       assessment = await Assessments.findById(assessmentId);
//       if (!assessment) {
//         return next(new ErrorHandler("Assessment not found", 404));
//       }
//     }

//     if (
//       visibility === "SelectedColleges" &&
//       (!invitedColleges || invitedColleges.length === 0)
//     ) {
//       return next(
//         new ErrorHandler(
//           "Please provide invited colleges for restricted visibility",
//           400
//         )
//       );
//     }

//     const job = await Job.create({
//       jobTitle,
//       jobDescription,
//       companyId,
//       assessment: assessment?._id,
//       applicationDeadline,
//       publishing: {
//         visibility,
//         status: "Draft",
//       },
//       interview,
//       eligibility,
//       location,
//       department,
//       jobType,
//       roleLevel,
//       salaryRange,
//       employmentType,
//       applicationSettings: {
//         invitedColleges:
//           visibility === "SelectedColleges" ? invitedColleges : [],
//       },
//     });

//     res.status(201).json({ success: true, job });
//   }
// );

// // 🔹 applyToJob (Updated with Assessment Check + Flow)
// export const applyToJob = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { studentId, jobId } = req.body;
//     const student = await Student.findById(studentId);
//     if (!student) return next(new ErrorHandler("Student not found", 404));

//     const job = await Job.findById(jobId)
//       .populate("assessment")
//       .populate("applicationSettings.invitedColleges");

//     if (!job) return next(new ErrorHandler("Job not found", 404));

//     if (job.publishing.visibility === "SelectedColleges") {
//       const isAllowed = job.applicationSettings.invitedColleges?.some(
//         (college: any) =>
//           college._id.equals(student.education[0]?.institutionName)
//       );

//       if (!isAllowed) {
//         return next(
//           new ErrorHandler("You are not authorized to apply for this job", 403)
//         );
//       }
//     }

//     // Assessment check
//     if (job.assessment) {
//       return res.status(200).json({
//         success: true,
//         message: "Assessment required before applying",
//         redirectToAssessment: `/assessment/${job.assessment._id}`,
//       });
//     }

//     // Save application status (simplified; could be in another collection)
//     student.score.push({
//       assessmentId: job.assessment?._id || "N/A",
//       score: 0,
//       performance: "pending",
//       date: new Date(),
//       time: 0,
//       status: "pending",
//     });

//     await student.save();

//     res.status(200).json({
//       success: true,
//       message: "Applied successfully",
//     });
//   }
// );

// // 🔹 getAllJobs (With Filters for Student View)

// export const getAllJobs = catchAsyncErrors(
//   async (req: Request, res: Response) => {
//     const jobs = await Job.find()
//       .populate("companyId")
//       .populate("assessment")
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       jobs,
//     });
//   }
// );

// 🔹 Add: getCompanyJobs, getCollegeJobs, getStudentApplications
// These can be added for role-specific dashboards:

// getCompanyJobs(companyId)

// getCollegeJobs(collegeId) (based on applicationSettings.invitedColleges)

// getStudentApplications(studentId)

// Let me know if you'd like those implemented too.

// ✅ Summary
// You now have a Job Controller aligned with:

// Your SOW modules

// Correctly integrating Assessments, Companies, Colleges, and Students

// Enforcing visibility and redirecting to assessments before application

// Ready for dashboard-level integration with filtered views

//Now here is the latest code

// // 🔹 Create Job
// export const createJob = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const {
//       jobTitle,
//       jobDescription,
//       companyId,
//       assessmentId,
//       applicationDeadline,
//       visibility,
//       invitedColleges,
//       jobType,
//       roleLevel,
//       location,
//       department,
//       salaryRange,
//       employmentType,
//       interview,
//       eligibility,
//     } = req.body;
//     console.log(assessmentId);

//     if (!jobTitle || !jobDescription || !companyId || !applicationDeadline) {
//       return next(new ErrorHandler("Missing required fields", 400));
//     }

//     // const companyExists = await Company.findById(companyId);
//     const companyExists = await Company.findOne({ userId: companyId });
//     if (!companyExists) {
//       return next(new ErrorHandler("Company not found", 404));
//     }

//     let assessment = null;
//     if (assessmentId) {
//       assessment = await Assessments.findById(assessmentId);
//       if (!assessment) {
//         return next(new ErrorHandler("Assessment not found", 404));
//       }
//     }

//     console.log("assesmentDetails:", assessment);

//     if (
//       visibility === "SelectedColleges" &&
//       (!invitedColleges || invitedColleges.length === 0)
//     ) {
//       return next(
//         new ErrorHandler(
//           "Provide invited colleges for restricted visibility",
//           400
//         )
//       );
//     }

//     const job = await Job.create({
//       jobTitle,
//       jobDescription,
//       companyId,
//       assessment: assessment?._id,
//       applicationDeadline,
//       publishing: {
//         visibility,
//         status: "Draft",
//       },
//       interview,
//       eligibility,
//       location,
//       department,
//       jobType,
//       roleLevel,
//       salaryRange,
//       employmentType,
//       applicationSettings: {
//         invitedColleges:
//           visibility === "SelectedColleges" ? invitedColleges : [],
//       },
//     });

//     res.status(201).json({ success: true, job });
//   }
// );

// // 🔹 Get All Jobs
// export const getAllJobs = catchAsyncErrors(
//   async (_req: Request, res: Response) => {
//     const jobs = await Job.find().populate("companyId assessment");
//     res.status(200).json({ success: true, jobs });
//   }
// );

// // 🔹 Get Job By ID
// export const getJobById = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const job = await Job.findById(req.params.jobId).populate(
//       "companyId assessment"
//     );

//     if (!job) return next(new ErrorHandler("Job not found", 404));

//     res.status(200).json({ success: true, job });
//   }
// );

// // 🔹 Update Job
// export const updateJob = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const job = await Job.findByIdAndUpdate(req.params.jobId, req.body, {
//       new: true,
//       runValidators: true,
//     });

//     if (!job) return next(new ErrorHandler("Job not found", 404));

//     res.status(200).json({ success: true, job });
//   }
// );

// // 🔹 Delete Job
// export const deleteJob = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const job = await Job.findByIdAndDelete(req.params.jobId);
//     if (!job) return next(new ErrorHandler("Job not found", 404));
//     res.status(200).json({ success: true, message: "Job deleted" });
//   }
// );

// // 🔹 Apply to Job
// // export const applyToJob = catchAsyncErrors(async (req: Request, res: Response, next: NextFunction) => {
// //   const { studentId, jobId } = req.body;

// //   const student = await Student.findById(studentId);
// //   if (!student) return next(new ErrorHandler("Student not found", 404));

// //   const job = await Job.findById(jobId)
// //     .populate("assessment")
// //     .populate("applicationSettings.invitedColleges");

// //   if (!job) return next(new ErrorHandler("Job not found", 404));

// //   if (job.publishing.visibility === "SelectedColleges") {
// //     const allowed = job.applicationSettings.invitedColleges?.some((college: any) =>
// //       college._id.equals(student.collegePlaced || student.education[0]?.institutionName)
// //     );
// //     if (!allowed) {
// //       return next(new ErrorHandler("You are not authorized to apply for this job", 403));
// //     }
// //   }

// //   if (job.assessment) {
// //     return res.status(200).json({
// //       success: true,
// //       message: "Assessment required before applying",
// //       redirectToAssessment: `/assessment/${job.assessment._id}`,
// //     });
// //   }

// //   student.score.push({
// //     assessmentId: job.assessment?._id || "N/A",
// //     score: 0,
// //     performance: "pending",
// //     date: new Date(),
// //     time: 0,
// //     status: "pending",
// //   });

// //   await student.save();

// //   res.status(200).json({ success: true, message: "Applied successfully" });
// // });

// // 🔹 getCompanyJobs
// export const getCompanyJobs = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { companyId } = req.params;
//     const jobs = await Job.find({ companyId }).populate("assessment");
//     res.status(200).json({ success: true, jobs });
//   }
// );

// // 🔹 getCollegeJobs
// export const getCollegeJobs = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { collegeId } = req.params;

//     const jobs = await Job.find({
//       $or: [
//         { "publishing.visibility": "Public" },
//         { "applicationSettings.invitedColleges": collegeId },
//       ],
//     }).populate("companyId");

//     res.status(200).json({ success: true, jobs });
//   }
// );

// // 🔹 getStudentApplications
// export const getStudentApplications = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     const { studentId } = req.params;
//     const student = await Student.findById(studentId).populate(
//       "score.assessmentId"
//     );

//     if (!student) return next(new ErrorHandler("Student not found", 404));

//     const applications = student.score.map((entry: any) => ({
//       assessment: entry.assessmentId,
//       score: entry.score,
//       status: entry.status,
//       date: entry.date,
//     }));

//     res.status(200).json({ success: true, applications });
//   }
// );
import type { NextFunction, Request, Response } from "express";
import catchAsyncErrors from "../../middlewares/error/catchAsyncErrors";
import { Student } from "../../models/student/student.model";
import { ErrorHandler } from "../../utils/errorHandler";
import { Company } from "../../models/company/company.model";
import { College } from "../../models/college/college.model";
import Assessment from "../../models/assessment/assessment.model";
import { Job } from "../../models/job/job.model";
import { Application } from "../../models/application/application.model";
import mongoose from "mongoose";
import type { ICollege } from "../../types/collegeSchemas";
import cloudinary from "cloudinary";
import multer from "multer";

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: "college" | "company" | "university" | "admin" | "student";
  };
}

// Helper function to find college ObjectId by name with flexible matching
async function findCollegeByName(
  collegeName: string
): Promise<mongoose.Types.ObjectId | null> {
  if (!collegeName || typeof collegeName !== "string") {
    return null;
  }

  const trimmedName = collegeName.trim();

  try {
    // Try exact match first (case-insensitive)
    let college = await College.findOne({
      collegeName: { $regex: `^${trimmedName}$`, $options: "i" },
    });

    if (college) {
      return college._id as mongoose.Types.ObjectId;
    }

    // If no exact match, try partial match
    college = await College.findOne({
      collegeName: { $regex: trimmedName, $options: "i" },
    });

    if (college) {
      return college._id as mongoose.Types.ObjectId;
    }

    return null;
  } catch (error) {
    console.error("Error in findCollegeByName:", error);
    return null;
  }
}

// FIXED: Get student batch year from multiple sources
function getStudentBatchYear(student: any): number | undefined {
  console.log("=== Getting Student Batch Year ===");
  console.log("Student batch field:", student.batch);
  console.log("Student education:", student.education?.[0]);

  // Priority 1: Direct batch field
  if (student.batch) {
    if (typeof student.batch === "number") {
      console.log("✅ Using batch field (number):", student.batch);
      return student.batch;
    }
    if (typeof student.batch === "string") {
      const batchYear = Number.parseInt(student.batch, 10);
      if (!isNaN(batchYear)) {
        console.log("✅ Using batch field (string):", batchYear);
        return batchYear;
      }
    }
  }

  // Priority 2: Education endDate
  if (student.education?.[0]?.endDate) {
    const endDate = new Date(student.education[0].endDate);
    const year = endDate.getFullYear();
    console.log("✅ Using education endDate:", year);
    return year;
  }

  // Priority 3: Education yearOfPassing
  if (student.education?.[0]?.yearOfPassing) {
    console.log(
      "✅ Using education yearOfPassing:",
      student.education[0].yearOfPassing
    );
    return student.education[0].yearOfPassing;
  }

  console.log("❌ Could not determine batch year");
  return undefined;
}

// Enhanced createJob with college approval logic
export const createJob = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const {
      jobTitle,
      jobDescription,
      companyId,
      assessmentId,
      applicationDeadline,
      jobType,
      roleLevel,
      location,
      department,
      salaryRange,
      employmentType,
      interview,
      eligibility,
      publishing,
      applicationSettings,
      joiningDate
    } = req.body;

    if (!jobTitle || !jobDescription || !companyId || !applicationDeadline) {
      return next(new ErrorHandler("Missing required fields", 400));
    }

    const companyExists = await Company.findOne({ userId: companyId });
    console.log("Company exists:", companyExists);
    if (!companyExists) {
      return next(new ErrorHandler("Company not found", 404));
    }

    let assessment = null;
    if (assessmentId) {
      try {
        assessment = await Assessment.findById(assessmentId);
        if (!assessment) {
          return next(new ErrorHandler("Assessment not found", 404));
        }
      } catch (error) {
        console.log("Assessment lookup failed:", error);
        // Continue without assessment if there's an error
        assessment = null;
      }
    }
    let visibility = publishing?.visibility;
    let invitedColleges = applicationSettings?.invitedColleges;

    if (
      visibility === "SelectedColleges" &&
      (!invitedColleges || invitedColleges.length === 0)
    ) {
      return next(
        new ErrorHandler(
          "Provide invited colleges for selected visibility",
          400
        )
      );
    }

    // Determine if college approval is required
    const requiresCollegeApproval =
      visibility === "SelectedColleges" ||
      applicationSettings?.acceptFrom === "College-specific";
    // Initialize college approvals if required
    let collegeApprovals = [];
    if (requiresCollegeApproval && invitedColleges?.length > 0) {
      collegeApprovals = invitedColleges.map((collegeId: string) => ({
        collegeId: mongoose.Types.ObjectId.isValid(collegeId)
          ? new mongoose.Types.ObjectId(collegeId)
          : collegeId,
        status: "pending",
        allowedBatches: eligibility?.graduationYears || [],
        allowedMajors: eligibility?.allowedMajors || [],
      }));
    }
    // When attaching an assessment to a new job:
    var clonedAssessmentId;
    if (assessment) {
      const randomSuffix = Math.random().toString(36).slice(2, 6).toUpperCase();

      const assessmentObj = assessment.toObject();
      const { _id, __v, createdAt, updatedAt, ...rest } = assessmentObj as any; // Safe cast if IAssessment lacks timestamps

      const clone = new Assessment({
        ...rest,
        _id: new mongoose.Types.ObjectId(),
        name: `${assessment.name} #${randomSuffix}`,
        studentResponses: [],
        invitedStudents: [],
        startDate: new Date().toISOString(),
        endDate: applicationDeadline,
      });
      const savedClone = await clone.save();
      clonedAssessmentId = savedClone._id;
    }

    const job = await Job.create({
      jobTitle,
      jobDescription,
      companyId: companyExists.userId,
      assessment: clonedAssessmentId,
      applicationDeadline,
      publishing: {
        ...publishing,
        visibility,
        status: publishing?.status,
      },
      interview,
      eligibility,
      location,
      department,
      jobType,
      roleLevel,
      salaryRange,
      employmentType,
      applicationSettings: {
        ...applicationSettings,
        invitedColleges:
          visibility === "SelectedColleges" ? invitedColleges : [],
      },
      collegeApprovals,
      requiresCollegeApproval,
      joiningDate
    });

    await Company.findByIdAndUpdate(
      companyExists._id,
      { $push: { jobs: job._id } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      job,
      clonedAssessmentId,
      message: requiresCollegeApproval
        ? "Job created and sent for college approval"
        : "Job created successfully",
    });
  }
);

// FIXED: Enhanced applyToJobWithValidation
export const applyToJobWithValidation = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { studentId, jobId, applicationData, resumeUrl, coverLetter } =
      req.body;

    // Find student by userId
    const student = await Student.findOne({ userId: studentId }).populate({
      path: "education.institutionName",
      select: "_id collegeName collegeCode",
    });

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    // Find job with all related data - REMOVED assessment population temporarily
    const job = await Job.findById(jobId)
      .populate({
        path: "companyId",
        select: "basic.companyName basic.logo",
      })
      .populate({
        path: "assessment",
        select: "appearedStudents", // Only need appearedStudents
      });

    if (!job) {
      return next(new ErrorHandler("Job not found", 404));
    }

    // Check if job is published
    if (job.publishing?.status !== "Published") {
      return next(new ErrorHandler("Job is not published yet", 403));
    }

    // Check if student already applied
    const existingApplication = await Application.findOne({
      studentId: student._id,
      jobId: jobId,
    });

    if (existingApplication) {
      return next(
        new ErrorHandler("You have already applied to this job", 400)
      );
    }

    // FIXED: Get student batch year
    const studentBatchYear = getStudentBatchYear(student);
    // Get student college info
    const rawInstitution = student.education[0]?.institutionName;
    let actualCollegeId: any = null;

    // Handle college name to ObjectId conversion
    if (
      typeof rawInstitution === "object" &&
      rawInstitution &&
      "_id" in rawInstitution
    ) {
      const populatedInstitution = rawInstitution as {
        _id: mongoose.Types.ObjectId;
        collegeName?: string;
      };
      actualCollegeId = populatedInstitution._id;
    } else if (typeof rawInstitution === "string") {
      const foundCollegeId = await findCollegeByName(rawInstitution.trim());
      actualCollegeId = foundCollegeId;

      if (actualCollegeId) {
        console.log("✅ College resolved:", {
          searchTerm: rawInstitution,
          resolvedId: actualCollegeId.toString(),
        });
      } else {
        console.log(" Could not resolve college:", rawInstitution);
      }
    } else if (mongoose.Types.ObjectId.isValid(rawInstitution)) {
      actualCollegeId = new mongoose.Types.ObjectId(rawInstitution);
      console.log("✅ College is valid ObjectId:", actualCollegeId.toString());
    }

    // Check job visibility and permissions
    if (job.publishing?.visibility === "Private") {
      return next(new ErrorHandler("Job is not open for applications", 403));
    }

    if (job.publishing?.visibility === "SelectedColleges") {
      if (!actualCollegeId) {
        return next(
          new ErrorHandler(
            "This job is only available to college students",
            403
          )
        );
      }
      // Check if college is invited using ObjectId
      const isCollegeInvited = job.applicationSettings?.invitedColleges?.some(
        (invitedCollegeId: any) =>
          invitedCollegeId.toString() === actualCollegeId.toString()
      );

      console.log("📋 College invitation check:", {
        actualCollegeId: actualCollegeId.toString(),
        invitedColleges: job.applicationSettings?.invitedColleges?.map(
          (id: any) => id.toString()
        ),
        isInvited: isCollegeInvited,
      });

      if (!isCollegeInvited) {
        return next(
          new ErrorHandler("This job is not available to your college", 403)
        );
      }

      // Check college approval using ObjectId
      const collegeApproval = job.collegeApprovals?.find(
        (approval: any) =>
          approval.collegeId.toString() === actualCollegeId.toString()
      );

      if (!collegeApproval || collegeApproval.status !== "approved") {
        return next(
          new ErrorHandler("This job is not approved by your college", 403)
        );
      }

      // Check batch eligibility from college approval
      if (
        collegeApproval.allowedBatches &&
        collegeApproval.allowedBatches.length > 0
      ) {
        if (!studentBatchYear) {
          return next(
            new ErrorHandler(
              "Unable to determine your batch year. Please update your profile information.",
              400
            )
          );
        }

        if (!collegeApproval.allowedBatches.includes(studentBatchYear)) {
          return next(
            new ErrorHandler(
              `This job is only available for batch years: ${collegeApproval.allowedBatches.join(
                ", "
              )}. Your batch year is ${studentBatchYear}.`,
              403
            )
          );
        }
      }
    }

    // Check general eligibility criteria
    if (
      job.eligibility?.graduationYears &&
      job.eligibility.graduationYears.length > 0
    ) {
      if (!studentBatchYear) {
        return next(
          new ErrorHandler(
            "Unable to determine your batch year. Please update your profile information.",
            400
          )
        );
      }

      if (!job.eligibility.graduationYears.includes(studentBatchYear)) {
        return next(
          new ErrorHandler(
            `This job requires batch years: ${job.eligibility.graduationYears.join(
              ", "
            )}. Your batch year is ${studentBatchYear}.`,
            403
          )
        );
      }
    }

    // Check if job deadline has passed
    if (new Date() > new Date(job.applicationDeadline)) {
      return next(new ErrorHandler("Application deadline has passed", 400));
    }

    let applicationStatus = "Applied";

    if (job.assessment) {
      const appeared = (job.assessment as any)?.appearedStudents?.some(
        (id: any) =>
          id.toString() ===
          (student.userId as mongoose.Types.ObjectId).toString()
      );
      applicationStatus = appeared
        ? "Assessment Completed and Applied"
        : "Applied";
    }

    // Create new application
    const newApplication = await Application.create({
      studentId: student._id,
      jobId: jobId,
      applicationData: applicationData || {},
      resumeUrl: resumeUrl,
      coverLetter: coverLetter,
      assessmentId: job.assessment,
      status: applicationStatus,
    });

    await Job.findByIdAndUpdate(jobId, {
      $addToSet: {
        applicants: {
          studentId: student._id,
          applicationId: newApplication._id,
          status: newApplication.status, // "Assessment Pending" or "Applied"
          applicationDate: new Date(),
        },
      },
      $inc: { applicantCount: 1 },
    });

    // Get company name safely
    const companyData = job.companyId as any;
    const companyName = companyData?.basic?.companyName || "Unknown Company";

    // If assessment is required, return assessment info
    if (job.assessment) {
      res.status(200).json({
        success: true,
        message: "Application received! Assessment required.",
        applicationId: newApplication._id,
        redirectToAssessment: `/assessment/${job.assessment}`,
        assessmentId: job.assessment,
        requiresAssessment: true,
        jobTitle: job.jobTitle,
        companyName: companyName,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Application submitted successfully",
      applicationId: newApplication._id,
      jobTitle: job.jobTitle,
      companyName: companyName,
    });
  }
);

// FIXED: getJobsAvailableToStudent - REMOVED assessment population
export const getJobsAvailableToStudent = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { studentId } = req.params;

    console.log("=== Fetching Jobs for Student ===!!!!!!");
    console.log("Student ID:", studentId);

    // Find student by userId
    const student = await Student.findOne({ userId: studentId }).populate({
      path: "education.institutionName",
      select: "_id collegeName collegeCode",
    });

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    // Get student's batch year and college info
    const studentBatchYear = getStudentBatchYear(student);
    const rawInstitution = student.education[0]?.institutionName;
    let actualCollegeId: any = null;

    console.log("📊 Student details:", {
      rawInstitution,
      type: typeof rawInstitution,
      batchYear: studentBatchYear,
    });

    // Convert college name to ObjectId if needed
    if (
      typeof rawInstitution === "object" &&
      rawInstitution &&
      "_id" in rawInstitution
    ) {
      const populatedInstitution = rawInstitution as {
        _id: mongoose.Types.ObjectId;
        collegeName?: string;
      };
      actualCollegeId = populatedInstitution._id;
    } else if (typeof rawInstitution === "string") {
      actualCollegeId = await findCollegeByName(rawInstitution.trim());
    } else if (mongoose.Types.ObjectId.isValid(rawInstitution)) {
      actualCollegeId = new mongoose.Types.ObjectId(rawInstitution);
    }

    const hasCollege = !!actualCollegeId;

    // Get jobs student has already applied to
    const appliedJobs = await Application.find({
      studentId: student._id,
    }).select("jobId");
    const appliedJobIds = appliedJobs.map((app) => app.jobId);

    // Build base query for all jobs
    const baseJobQuery: any = {
      _id: { $nin: appliedJobIds },
      applicationDeadline: { $gte: new Date() },
      "publishing.status": "Published",
    };

    let availableJobs: any[] = [];

    if (hasCollege) {
      console.log("🎯 Fetching college-specific and public jobs...");

      // Query 1: Public jobs with batch year filter - REMOVED assessment population
      const publicJobsQuery = {
        ...baseJobQuery,
        "publishing.visibility": "Public",
        $or: [
          { "eligibility.graduationYears": { $exists: false } },
          { "eligibility.graduationYears": { $size: 0 } },
          ...(studentBatchYear
            ? [{ "eligibility.graduationYears": studentBatchYear }]
            : []),
        ],
      };

      const publicJobs = await Job.find(publicJobsQuery).populate({
        path: "companyId",
        select: "name avatar industry website",
      });

      console.log("🌐 Public jobs found:", publicJobs.length);

      // Query 2: College-specific jobs that are approved for this college - REMOVED assessment population
      let collegeSpecificJobs: any[] = [];

      if (actualCollegeId) {
        try {
          const collegeSpecificJobsQuery = {
            ...baseJobQuery,
            "publishing.visibility": "SelectedColleges",
            "applicationSettings.invitedColleges": actualCollegeId,
            collegeApprovals: {
              $elemMatch: {
                collegeId: actualCollegeId,
                status: "approved",
                $and: [
                  {
                    $or: [
                      { allowedBatches: { $exists: false } },
                      { allowedBatches: { $size: 0 } },
                      ...(studentBatchYear
                        ? [{ allowedBatches: studentBatchYear }]
                        : []),
                    ],
                  },
                  {
                    $or: [
                      { allowedMajors: { $exists: false } },
                      { allowedMajors: { $size: 0 } },
                      ...(student.major
                        ? [{ allowedMajors: student.major }]
                        : []),
                    ],
                  },
                ],
              },
            },
          };

          collegeSpecificJobs = await Job.find(
            collegeSpecificJobsQuery
          ).populate({
            path: "companyId",
            select: "name avatar basic.industry basic.website",
          });
        } catch (error) {
          console.error("Error fetching college-specific jobs:", error);
          collegeSpecificJobs = [];
        }
      }

      // Combine and deduplicate jobs
      const allJobsMap = new Map();

      publicJobs.forEach((job) => {
        allJobsMap.set((job._id as mongoose.Types.ObjectId).toString(), job);
      });

      collegeSpecificJobs.forEach((job) => {
        allJobsMap.set((job._id as mongoose.Types.ObjectId).toString(), job);
      });

      availableJobs = Array.from(allJobsMap.values());
    } else {
      console.log("🌐 Student has no college, showing only public jobs...");

      const nonCollegeJobsQuery = {
        ...baseJobQuery,
        "publishing.visibility": "Public",
        $or: [
          { "eligibility.graduationYears": { $exists: false } },
          { "eligibility.graduationYears": { $size: 0 } },
          ...(studentBatchYear
            ? [{ "eligibility.graduationYears": studentBatchYear }]
            : []),
        ],
      };

      availableJobs = await Job.find(nonCollegeJobsQuery).populate({
        path: "companyId",
        select: "name avatar industry website",
      });

      console.log("🌐 Non-college public jobs found:", availableJobs.length);
    }

    // Add batch eligibility info to each job
    const jobsWithEligibility = availableJobs.map((job) => {
      const jobObj = job.toObject();

      let batchEligible = true;
      let eligibleBatches: number[] = [];

      if (hasCollege && actualCollegeId) {
        const collegeApproval = job.collegeApprovals?.find(
          (approval: any) =>
            approval.collegeId.toString() === actualCollegeId.toString()
        );

        if (
          collegeApproval &&
          collegeApproval.allowedBatches &&
          collegeApproval.allowedBatches.length > 0
        ) {
          eligibleBatches = collegeApproval.allowedBatches;
          batchEligible =
            typeof studentBatchYear === "number"
              ? eligibleBatches.includes(studentBatchYear)
              : false;
        } else if (
          job.eligibility?.graduationYears &&
          job.eligibility.graduationYears.length > 0
        ) {
          eligibleBatches = job.eligibility.graduationYears;
          batchEligible =
            typeof studentBatchYear === "number"
              ? eligibleBatches.includes(studentBatchYear)
              : false;
        }
      } else if (
        job.eligibility?.graduationYears &&
        job.eligibility.graduationYears.length > 0
      ) {
        eligibleBatches = job.eligibility.graduationYears;
        batchEligible =
          typeof studentBatchYear === "number"
            ? eligibleBatches.includes(studentBatchYear)
            : false;
      }

      return {
        ...jobObj,
        batchEligible,
        eligibleBatches,
        studentBatchYear,
      };
    });

    console.log("✅ Final jobs with eligibility:", jobsWithEligibility.length);

    res.status(200).json({
      success: true,
      jobs: jobsWithEligibility,
      studentInfo: {
        hasCollege,
        collegeId: actualCollegeId?.toString() || null,
        batchYear: studentBatchYear,
      },
      totalJobs: jobsWithEligibility.length,
      appliedJobsCount: appliedJobs.length,
    });
  }
);

// College Approve/Reject Job
export const approveJobForCollege = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { jobId } = req.params;
    const { status, allowedBatches, rejectionReason, allowedMajors } = req.body;
    const { userId, role } = req.user!;

    if (role !== "college") {
      return next(new ErrorHandler("Only colleges can approve jobs", 403));
    }

    const college = (await College.findOne({ userId })) as
      | (ICollege & { _id: mongoose.Types.ObjectId })
      | null;
    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }
    const job = await Job.findById(jobId);
    const assessment = job?.assessment;
    if (!job) {
      return next(new ErrorHandler("Job not found", 404));
    }

    // Find the approval entry for this college
    let approvalIndex =
      job.collegeApprovals?.findIndex(
        (approval) => approval.collegeId.toString() === college._id.toString()
      ) ?? -1;

    // If no approval found, check if college is invited and create approval entry
    if (approvalIndex === -1) {
      const isInvited = job.applicationSettings?.invitedColleges?.some(
        (invitedCollegeId: any) =>
          invitedCollegeId.toString() === college._id.toString()
      );

      if (!isInvited) {
        return next(
          new ErrorHandler("College not authorized for this job", 403)
        );
      }

      // Create new approval entry
      if (!job.collegeApprovals) {
        job.collegeApprovals = [];
      }

      job.collegeApprovals.push({
        collegeId: college._id,
        status: "pending",
        allowedBatches: job.eligibility?.graduationYears || [],
        allowedMajors: job.eligibility?.allowedMajors || [],
      });

      approvalIndex = job.collegeApprovals.length - 1;
    }

    // Update approval status
    if (job.collegeApprovals && job.collegeApprovals[approvalIndex]) {
      job.collegeApprovals[approvalIndex].status = status;
      job.collegeApprovals[approvalIndex].approvedBy =
        new mongoose.Types.ObjectId(userId);
      job.collegeApprovals[approvalIndex].approvedAt = new Date();

      if (
        status === "approved" &&
        allowedBatches &&
        assessment &&
        allowedMajors
      ) {
        job.collegeApprovals[approvalIndex].allowedBatches = allowedBatches;
        job.collegeApprovals[approvalIndex].allowedMajors = allowedMajors;

        // Get all student IDs belonging to this college
        const collegeStudentIds = college?.students || [];
        if (collegeStudentIds.length > 0) {
          // Find students whose:
          // 1. _id is in college's students array AND
          // 2. batch is in allowedBatches

          const majorFilter =
            allowedMajors && allowedMajors.length > 0
              ? { major: { $in: allowedMajors } }
              : {};

          const eligibleStudents = await Student.find({
            userId: { $in: collegeStudentIds },
            batch: { $in: allowedBatches },
            ...majorFilter,
          }).select("userId");

          if (eligibleStudents.length > 0) {
            const studentIds = eligibleStudents.map((s) => s.userId);

            await Assessment.findByIdAndUpdate(
              assessment,
              { $addToSet: { invitedStudents: { $each: studentIds } } },
              { new: true }
            );
          }
        }
        // Add company to college's designatedCompanies if not already present
        if (!college.designatedCompanies?.includes(job.companyId)) {
          await College.findByIdAndUpdate(
            college._id,
            { $addToSet: { designatedCompanies: job.companyId } },
            { new: true }
          );
        }
      }

      if (status === "rejected" && rejectionReason) {
        job.collegeApprovals[approvalIndex].rejectionReason = rejectionReason;
      }
    }

    await job.save();

    res.status(200).json({
      success: true,
      message: `Job ${status} successfully`,
      job,
    });
  }
);

// Get Jobs Pending Approval for College
export const getJobsPendingApproval = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId, role } = req.user!;

    if (role !== "college") {
      return next(new ErrorHandler("Only colleges can view pending jobs", 403));
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    const jobs = await Job.find({
      "collegeApprovals.collegeId": college._id,
      "collegeApprovals.status": "pending",
    })
      .populate({
        path: "companyId",
        select: "basic.companyName basic.logo basic.industry",
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      jobs,
      count: jobs.length,
    });
  }
);

// Get College Jobs with approval info
export const getCollegeJobs = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId, role } = req.user!;

    if (role !== "college") {
      return next(new ErrorHandler("Only colleges can view their jobs", 403));
    }

    const college = (await College.findOne({ userId })) as
      | (ICollege & { _id: mongoose.Types.ObjectId })
      | null;
    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    const { status = "all" } = req.query;

    const matchQuery: any = {
      $or: [
        { "collegeApprovals.collegeId": college._id },
        { "applicationSettings.invitedColleges": college._id },
      ],
    };

    if (status !== "all") {
      matchQuery["collegeApprovals.status"] = status;
    }

    const jobs = await Job.find(matchQuery)
      .populate({
        path: "companyId",
        select: "name avatar basic.industry",
      })
      .sort({ createdAt: -1 });

    // Add approval info for this college
    const jobsWithApprovalInfo = jobs.map((job) => {
      const jobObj = job.toObject();
      const collegeApproval = job.collegeApprovals?.find(
        (approval) => approval.collegeId.toString() === college._id.toString()
      );

      return {
        ...jobObj,
        collegeApprovalStatus: collegeApproval?.status || "pending",
        allowedBatches: collegeApproval?.allowedBatches || [],
        allowedMajors: collegeApproval?.allowedMajors || [],
        approvedAt: collegeApproval?.approvedAt,
        rejectionReason: collegeApproval?.rejectionReason,
      };
    });

    res.status(200).json({
      success: true,
      jobs: jobsWithApprovalInfo,
      count: jobsWithApprovalInfo.length,
    });
  }
);

// FIXED: Get All Jobs - removed assessment population temporarily
export const getAllJobs = catchAsyncErrors(
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const jobs = await Job.find()
        .populate({
          path: "companyId",
          select: "name email avatar role verificationStatus", // Only select needed fields
        })
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        jobs,
        count: jobs.length,
      });
    } catch (error) {
      console.error("Error fetching all jobs:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch jobs",
      });
    }
  }
);

// Get Job by ID
export const getJobById = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const job = await Job.findById(req.params.jobId)
      .populate({
        path: "companyId",
        select: "name basic.avatar basic.industry basic.website",
      })
      .populate({
        path: "assessment", // this will include appearedStudents as raw IDs
      });

    if (!job) return next(new ErrorHandler("Job not found", 404));

    console.log("Job found:", job);
    res.status(200).json({ success: true, job });
  }
);

// Update Job
export const updateJob = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { assessmentId, ...otherData } = req.body;

    // Handle assessment update
    const updateData = { ...otherData };
    if (assessmentId) {
      try {
        // Verify assessment exists
        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) {
          return next(new ErrorHandler("Assessment not found", 404));
        }
        updateData.assessment = assessmentId;
      } catch (error) {
        console.log("Assessment lookup failed during update:", error);
        // Continue without assessment if there's an error
      }
    } else if (assessmentId === null || assessmentId === "") {
      // Remove assessment if explicitly set to null or empty
      updateData.assessment = null;
    }

    const job = await Job.findByIdAndUpdate(req.params.jobId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!job) return next(new ErrorHandler("Job not found", 404));
    res.status(200).json({ success: true, job });
  }
);

// Delete Job
export const deleteJob = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const job = await Job.findByIdAndDelete(req.params.jobId);
    if (!job) return next(new ErrorHandler("Job not found", 404));
    res.status(200).json({ success: true, message: "Job deleted" });
  }
);

// Get Public Jobs
export const getPublicJobs = catchAsyncErrors(
  async (_req: Request, res: Response): Promise<void> => {
    const jobs = await Job.find({
      "publishing.visibility": "Public",
      "publishing.status": "Published",
      applicationDeadline: { $gte: new Date() },
    }).populate({
      path: "companyId",
      select: "basic.companyName basic.logo basic.industry",
    });

    res.status(200).json({ success: true, jobs });
  }
);

// FIXED: Get Company Jobs - removed assessment population temporarily
export const getCompanyJobs = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    process.stdout.write("Entered route handler\n");

    const { userId } = req.user!;
    try {
      // Option 1: Get jobs through Company's jobs array (recommended)
      const company = await Company.findOne({ userId })
        .populate({
          path: "jobs",
          populate: {
            path: "assessment",
            model: "Assessments",
          },
        })
        .select("jobs")
        .lean();
      console.log("Company found:", company);

      if (!company) {
        res.status(404).json({
          success: false,
          message: "Company not found",
        });
      }

      // Option 2: Alternative direct query to Job collection
      // const jobs = await Job.find({ companyId: userId })
      //   .populate('assessment')
      //   .sort({ createdAt: -1 })
      //   .lean();

      res.status(200).json({
        success: true,
        jobs: company?.jobs || [],
        count: company?.jobs?.length || 0,
      });
    } catch (error: any) {
      console.error("Error fetching company jobs:", error);

      // More specific error handling
      if (error.name === "CastError") {
        res.status(400).json({
          success: false,
          message: `Invalid data format: ${error.message}`,
        });
      }

      res.status(500).json({
        success: false,
        message: "Failed to fetch company jobs",
      });
    }
  }
);

// Get Student Applications with Jobs
export const getStudentApplicationsWithJobs = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { studentId } = req.params;

    //✅ Validate the student exists
    const student = await Student.findOne({ userId: studentId });

    if (!student) {
      res.status(404).json({
        success: false,
        message: "Student not found!!!!",
      });
      return;
    }
    const id = student._id;
    // ✅ Use studentId directly for the query
    const applications = await Application.find({ studentId: id })

      .populate({
        path: "jobId",
        select: "jobTitle location jobType applicationDeadline",
        populate: {
          path: "companyId",
          select: "name avatar industry",
        },
      })
      .sort({ applicationDate: -1 });

    // Format applications for frontend
    const formattedApplications = applications.map((app) => {
      const jobData = app.jobId as any;
      return {
        _id: app._id,
        job: {
          _id: jobData?._id,
          jobTitle: jobData?.jobTitle,
          companyId: jobData?.companyId,
          location: jobData?.location,
          jobType: jobData?.jobType,
          applicationDeadline: jobData?.applicationDeadline,
        },
        applicationDate: app.applicationDate,
        status: app.status,
        assessmentScore: app.assessmentScore,
        assessmentCompleted: app.assessmentCompleted,
        assessmentId: app.assessmentId,
        lastUpdated: app.lastUpdated,
      };
    });

    res.status(200).json({
      success: true,
      applications: formattedApplications,
      totalApplications: formattedApplications.length,
    });
  }
);

// Update Application Status
export const updateApplicationStatus = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { applicationId } = req.params;
    const { status, assessmentScore, companyNotes, rejectionReason } = req.body;

    const application = await Application.findById(applicationId);
    if (!application)
      return next(new ErrorHandler("Application not found", 404));

    // Update fields
    if (status) application.status = status;
    if (assessmentScore !== undefined) {
      application.assessmentScore = assessmentScore;
      application.assessmentCompleted = true;
    }
    if (companyNotes) application.companyNotes = companyNotes;
    if (rejectionReason) application.rejectionReason = rejectionReason;

    await application.save();

    res.status(200).json({
      success: true,
      message: "Application status updated successfully",
      application,
    });
  }
);

// Get Job Applications
export const getJobApplications = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { jobId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    const query: any = { jobId };
    if (status) query.status = status;

    const applications = await Application.find(query)
      .populate({
        path: "studentId",
        select: "userId personal education skills experience batch",
        populate: {
          path: "userId",
          select: "name email",
        },
      })
      .populate({
        path: "jobId",
        select: "jobTitle",
      })
      .sort({ applicationDate: -1 })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit));

    const totalApplications = await Application.countDocuments(query);

    res.status(200).json({
      success: true,
      applications,
      totalApplications,
      currentPage: Number(page),
      totalPages: Math.ceil(totalApplications / Number(limit)),
    });
  }
);

// Legacy compatibility function
export const applyToJob = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Redirect to the enhanced validation function
    return applyToJobWithValidation(req, res, next);
  }
);

// Configure multer for resume uploads
export const resumeStorage = multer.memoryStorage();
export const resumeUpload = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Accept only PDF, DOC, and DOCX files
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only PDF, DOC, and DOCX files are allowed"));
    }
  },
});

// Upload Resume for Job Application
export const uploadResumeForJobApplication = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.file) {
      return next(new ErrorHandler("No resume file uploaded", 400));
    }

    const { studentId } = req.body;

    // Find student by userId or _id
    const student = studentId
      ? (await Student.findOne({ userId: studentId })) ||
        (await Student.findById(studentId))
      : null;

    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    try {
      // Convert file to base64 for Cloudinary upload (same pattern as uploadStudentDocuments)
      const file = req.file;
      const base64String = file.buffer.toString("base64");
      const dataURI = `data:${file.mimetype};base64,${base64String}`;

      // Upload to Cloudinary
      const result = await cloudinary.v2.uploader.upload(dataURI, {
        folder: "job_applications/resumes",
        resource_type: "auto",
        public_id: `resume_${student._id}_${Date.now()}`,
      });

      // Update student's resume URL in their profile (optional)
      if (student.documents) {
        await Student.findByIdAndUpdate(student._id, {
          "documents.resume": result.secure_url,
        });
      } else {
        await Student.findByIdAndUpdate(student._id, {
          documents: { resume: result.secure_url },
        });
      }

      res.status(200).json({
        success: true,
        message: "Resume uploaded successfully",
        resumeUrl: result.secure_url,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        public_id: result.public_id,
        studentId: student._id,
      });
    } catch (error) {
      console.error("Resume upload error:", error);
      return next(new ErrorHandler("Failed to upload resume", 500));
    }
  }
);

// NEW: Get Company Assessments for Job Creation
export const getCompanyAssessments = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId, role } = req.user!;

    if (role !== "company") {
      return next(
        new ErrorHandler("Only companies can access this endpoint", 403)
      );
    }

    try {
      // Find company by userId
      const company = await Company.findOne({ userId });
      if (!company) {
        return next(new ErrorHandler("Company not found", 404));
      }

      // Fetch assessments created by this company
      const assessments = await Assessment.find({
        createdBy: userId,
        createdByCompany: true,
        // Include both published and active assessments
        $or: [
          { status: "Published" },
          { status: "active" },
          { isPublished: true },
          { status: { $exists: false } }, // For backward compatibility
        ],
      })
        .select(
          "_id name additionalDescription totalTime totalMarks level type status isPublished totalQuestionsCount"
        )
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        message: "Company assessments fetched successfully",
        assessments,
        count: assessments.length,
      });
    } catch (error) {
      console.error("Error fetching company assessments:", error);
      return next(new ErrorHandler("Failed to fetch assessments", 500));
    }
  }
);
