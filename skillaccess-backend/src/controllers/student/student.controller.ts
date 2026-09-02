import { Request, Response, NextFunction } from "express";
import axios from "axios";
import cloudinary from "cloudinary";
import jwt from "jsonwebtoken";
import { College } from "../../models/college/college.model";
import { Company } from "../../models/company/company.model";
import { Student } from "../../models/student/student.model";
import { University } from "../../models/university/university.model";
import { BaseUser, IBaseUser } from "../../models/user/baseUser.model";
import InvitedStudents from "../../models/college/invite.model";
import { ErrorHandler } from "../../utils/errorHandler";
import catchAsyncErrors from "../../middlewares/error/catchAsyncErrors";
import { PasswordService } from "../../services/password.service";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: "college" | "company" | "university" | "admin" | "student";
  };
}

// import { Request, Response } from "express";
import { registerUser } from "../../services/register.service";
import mongoose from "mongoose";
import CompilerLog from "../../models/compilerLog";
import studentResponseModel from "../../models/assessment/studentResponse.model";
import Assessments from "../../models/assessment/assessment.model";
import PublishedStudent from "./published.student.model";

export interface IDocuments {
  resume?: string;
  markSheets?: string[];
  certificates?: string[];
  bonafideCertificate?: string;
}

export const registerStudent = (req: Request, res: Response): Promise<any> => {
  // Assign role as "student"
  req.body.role = "student";
  return registerUser(req, res);
};

export const createStudent = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { CollegeId, inviteLink } = req.query as {
      CollegeId: string;
      inviteLink: string;
    };
    const device = req.headers["user-agent"] || "unknown device";
    let role: "college" | "university" = "college";

    // Validate College / University
    let entity = await College.findOne({ userId: CollegeId }).populate(
      "userId",
      "name"
    );

    console.log("entity", entity);

    if (!entity) {
      entity = await University.findById(CollegeId);
      role = "university";
    }
    if (!entity) return next(new ErrorHandler(`${role} not found`, 404));

    // --- GOOGLE OAUTH INVITED STUDENT REGISTRATION ---
    if (req.body.googleAccessToken) {
      const { googleAccessToken } = req.body;

      const { data } = await axios.get(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        {
          headers: { Authorization: `Bearer ${googleAccessToken}` },
        }
      );

      const {
        given_name: FirstName,
        family_name: LastName,
        email: Email,
        picture: profilePicture,
      } = data;

      // Upload Google profile picture to Cloudinary
      const myCloud = await cloudinary.v2.uploader.upload(profilePicture, {
        folder: "avatars",
        width: 150,
        crop: "scale",
      });

      const avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };

      // Check if email already used
      const existingUser = await BaseUser.findOne({ email: Email });
      if (existingUser)
        return next(new ErrorHandler("User already exists", 400));

      const mailUsed =
        (await Company.findOne({ email: Email })) ||
        (await University.findOne({ email: Email }));
      if (mailUsed)
        return next(new ErrorHandler("Email already used elsewhere", 400));

      const collegeInv = await InvitedStudents.findOne({ [role]: CollegeId });
      if (!collegeInv)
        return next(new ErrorHandler("No invitation records found", 400));

      const invited = collegeInv.students.find(
        (student) => student.link === inviteLink
      );
      if (!invited)
        return next(new ErrorHandler("Invalid invitation link", 400));

      // Create BaseUser
      const baseUser = await BaseUser.create({
        name: `${FirstName} ${LastName}`,
        email: Email,
        password: "", // no password for Google OAuth
        phone: "",
        address: "",
        role: "student",
        isApproved: invited.approved,
        readyToBeApproved: true,
        verificationStatus: "approved",
        authType: "google",
      });

      // Create Student
      await new Student({
        userId: baseUser._id,
        batch: invited.batch,
        major: invited.major || "",
        ...(role === "university"
          ? { universityId: CollegeId, CollegeName: "Unassigned" }
          : { CollegeName: entity.collegeName, CollegeId }),
        registrationLink: inviteLink,
      }).save();

      // await sendToken(baseUser, 201, res, req.ip, device); (you can add this if ready)
      res.status(201).json({ message: "Student created via Google OAuth." });
    }

    // --- MANUAL PASSWORD INVITED STUDENT REGISTRATION ---
    const { password, phone, firstName, lastName, email } = req.body;

    if (!inviteLink || !password || !firstName || !lastName || !email) {
      return next(new ErrorHandler("Please Enter All Required Fields", 400));
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/;
    if (!passwordRegex.test(password)) {
      return next(
        new ErrorHandler(
          "Password must have at least one uppercase, one lowercase, one number and one special character",
          400
        )
      );
    }

    const collegeInv = await InvitedStudents.findOne({ [role]: CollegeId });
    if (!collegeInv)
      return next(new ErrorHandler("No invitation records found", 400));

    const invited = collegeInv.students.find(
      (student) => student.link === inviteLink
    );
    if (!invited) return next(new ErrorHandler("Invalid invitation link", 400));

    // Create BaseUser
    const baseUser = await BaseUser.create({
      name: `${invited.firstName} ${lastName}`,
      email: invited.email,
      password,
      phone: phone || "",
      address: "",
      role: "student",
      isApproved: invited.approved,
      readyToBeApproved: true,
      verificationStatus: "pending",
      authType: "invite",
    });

    // Create Student
    await new Student({
      userId: baseUser._id,
      batch: invited.batch,
      education: [
        {
          institutionName: (entity.userId as any).name || "Unknown Institution",
          degree: invited.major,
          field: invited.major,
          startDate: new Date(`${invited.batch}-06-01`), // or a better default logic
        },
      ],
      // ...(role === "university"
      //   ? { universityId: CollegeId, CollegeName: "Unassigned" }
      //   : { CollegeName: entity.collegeName, CollegeId }),
      // registrationLink: inviteLink,
      major: invited.major,
    }).save();
if(invited.approved===true ){
  const college = await College.findOne({userId: CollegeId });
  if (!college) {
    return next(new ErrorHandler("College not found", 404));
  }


    // Move student from pending to approved
    college.pendingStudents = college.pendingStudents.filter(
      (id) => id.toString() !== baseUser._id
    );
    college.students.push(new mongoose.Types.ObjectId(baseUser._id as string));

    await college.save();
}
    const token = jwt.sign(
      { userId: baseUser._id, email: baseUser.email, role: baseUser.role },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    // await sendToken(baseUser, 201, res, req.ip, device); (you can add this if ready)
    res.status(201).json({
      message: "Student registered successfully via invitation link",
      token,
      user: {
        _id: baseUser._id,
        name: baseUser.name,
        email: baseUser.email,
        role: baseUser.role,
        isApproved: baseUser.isApproved,
        readyToBeApproved: baseUser.readyToBeApproved,
        verificationStatus: baseUser.verificationStatus,
        authType: baseUser.authType,
      },
    });
  }
);

// export const approveStudentForCollege = catchAsyncErrors(
//   async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const { studentId } = req.body;
//     const collegeUserId = req.user?.userId;

//     if (req.user?.role !== "college") {
//       return next(new ErrorHandler("Only colleges can approve students", 403));
//     }

//     const college = await College.findOne({ userId: collegeUserId });
//     if (!college) {
//       return next(new ErrorHandler("College not found", 404));
//     }

//     const student = await Student.findOne({ userId: studentId });
//     if (!student) {
//       return next(new ErrorHandler("Student not found", 404));
//     }

//     // ✅ Already approved check
//     const alreadyApproved = college.students.some((id) =>
//       id.equals(student.userId)
//     );
//     if (alreadyApproved) {
//       res.status(200).json({
//         success: true,
//         message: "Student is already approved",
//       });
//       return;
//     }

//     // ✅ Add to approved students
//     college.students.push(student.userId);

//     // ✅ Remove from pendingStudents if exists
//     college.pendingStudents = college.pendingStudents.filter(
//       (id) => !id.equals(student.userId)
//     );

//     // ✅ Save updated college
//     await college.save();

//     // ✅ Update student doc as approved (optional based on your needs)
//     student.approved = true;

//     // ✅ Optional: Match student’s college name to this college (if logic requires)
//     if (student.education && student.education.length > 0) {
//       student.education[0].institutionName = college.collegeName;
//     }

//     await student.save();

//     res.status(200).json({
//       success: true,
//       message: "Student approved successfully",
//     });
//   }
// );

// Get Student Profile (optional for frontend preview)
export const getStudentProfile = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const student = await Student.findOne({
      userId: req.user?.userId,
    }).populate("userId");
    if (!student) return next(new ErrorHandler("Student not found", 404));

    res.status(200).json({
      success: true,
      student,
    });
  }
);

export const getStudentProfileForCollege = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const student = await Student.findOne({
      userId: id,
    }).populate("userId");
    if (!student) return next(new ErrorHandler("Student not found", 404));

    res.status(200).json({
      success: true,
      student,
    });
  }
);

//Get public id student details
export const getPublicStudentProfile = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const isPublished = await PublishedStudent.findOne({ studentId: id });
    if (!isPublished) {
      res.status(403).json({ success: false, message: "Profile not public" });
      return;
    }

    const student = await Student.findById(id).populate("userId", [
      "name",
      "email",
      "phone",
      "role",
      "address",
      "avatar",
    ]);
    if (!student) return next(new ErrorHandler("Student not found", 404));

    res.status(200).json({
      success: true,
      student,
    });
  }
);

export const togglePublishProfile = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { studentId, publish } = req.body;

    if (!studentId) return next(new ErrorHandler("Missing studentId", 400));

    try {
      if (publish) {
        await PublishedStudent.updateOne(
          { studentId },
          { studentId },
          { upsert: true }
        );
      } else {
        await PublishedStudent.deleteOne({ studentId });
      }

      res.status(200).json({
        success: true,
        message: publish
          ? "Profile published successfully"
          : "Profile unpublished",
      });
    } catch (err) {
      return next(new ErrorHandler("Failed to toggle publish state", 500));
    }
  }
);

// Update BaseUser Info (optional update step)
export const updateBaseUserInfo = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const allowedFields = ["name", "phone", "address", "avatar"];
    const updates: Partial<IBaseUser> = {};

    // for (const field of allowedFields) {
    //   if (req.body[field] !== undefined) {
    //     updates[field] = req.body[field];
    //   }
    // }

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field as keyof IBaseUser] = req.body[field];
      }
    }

    const baseUser = await BaseUser.findByIdAndUpdate(
      req.user?.userId,
      updates,
      { new: true }
    ).select("-password -otp"); // exclude sensitive fields in response

    if (!baseUser) return next(new ErrorHandler("User not found", 404));

    res.status(200).json({
      success: true,
      message: "Base user info updated successfully",
      user: baseUser,
    });
  }
);

// Update Basic Info (Step 1)
export const updateBasicInfo = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      dob,
      gender,
      altContactNumber,
      aadharNumber,
      panCardNumber,
      digitalSignature,
    } = req.body;

    const student = await Student.findOneAndUpdate(
      { userId: req.user?.userId },
      {
        dob,
        gender,
        altContactNumber,
        aadharNumber,
        panCardNumber,
        digitalSignature,
      },
      { new: true }
    );

    if (!student) return next(new ErrorHandler("Student not found", 404));

    res.status(200).json({ success: true, student });
  }
);

// Update Education Info (Step 2)
export const updateEducation = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { education } = req.body; // array of educations

    const student = await Student.findOneAndUpdate(
      { userId: req.user?.userId },
      { education },
      { new: true }
    );

    if (!student) return next(new ErrorHandler("Student not found", 404));

    res.status(200).json({ success: true, student });
  }
);

// Update Skills (Step 3)
export const updateSkills = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { skills } = req.body; // { technicalSkills, nonTechnicalSkills, preferredJobRoles, preferredJobLocations }

    const student = await Student.findOneAndUpdate(
      { userId: req.user?.userId },
      { skills },
      { new: true }
    );

    if (!student) return next(new ErrorHandler("Student not found", 404));

    res.status(200).json({ success: true, student });
  }
);

// Update Portfolio (Step 4)
export const updatePortfolio = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { portfolio } = req.body; // array of portfolio links

    const student = await Student.findOneAndUpdate(
      { userId: req.user?.userId },
      { portfolio },
      { new: true }
    );

    if (!student) return next(new ErrorHandler("Student not found", 404));

    res.status(200).json({ success: true, student });
  }
);

// Update Work Experience (Step 5)
export const updateWorkExperience = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { workExperience } = req.body; // { internships: [], jobs: [] }

    const student = await Student.findOneAndUpdate(
      { userId: req.user?.userId },
      { workExperience },
      { new: true }
    );

    if (!student) return next(new ErrorHandler("Student not found", 404));

    res.status(200).json({ success: true, student });
  }
);

// Update Documents (Step 6)
export const updateDocuments = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { documents } = req.body; // { resume, markSheets, certificates, bonafideCertificate }

    const student = await Student.findOneAndUpdate(
      { userId: req.user?.userId },
      { documents },
      { new: true }
    );

    if (!student) return next(new ErrorHandler("Student not found", 404));

    res.status(200).json({ success: true, student });
  }
);

// Complete Profile (Final Step)
export const completeProfile = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const student = await Student.findOneAndUpdate(
      { userId: req.user?.userId },
      { completedProfile: true },
      { new: true }
    );

    if (!student) return next(new ErrorHandler("Student not found", 404));

    res
      .status(200)
      .json({ success: true, message: "Profile completed successfully." });
  }
);

export const approveSelfAfterCompletion = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== "student") {
      return next(
        new ErrorHandler("Only students can perform this action", 403)
      );
    }

    const student = await Student.findOne({ userId: req.user.userId });
    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    const baseUser = await BaseUser.findById(req.user.userId);
    if (!baseUser) {
      return next(new ErrorHandler("Base user not found", 404));
    }

    // Mark the student as approved
    student.approved = true;
    await student.save();

    baseUser.isApproved = true;
    await baseUser.save();

    res.status(200).json({
      success: true,
      message: "Student approved after completing profile",
    });
  }
);

// Upload Resume / Marksheet / Certificate
export const uploadStudentDocuments = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.files) {
      return next(new ErrorHandler("No files uploaded", 400));
    }

    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    const uploadToCloudinary = async (
      file: Express.Multer.File,
      folder: string
    ) => {
      const base64String = file.buffer.toString("base64");
      const dataURI = `data:${file.mimetype};base64,${base64String}`;
      const result = await cloudinary.v2.uploader.upload(dataURI, {
        folder,
        resource_type: "auto",
      });
      return result.secure_url;
    };

    const uploads: Partial<IDocuments> = {};

    if (files.resume?.[0]) {
      uploads.resume = await uploadToCloudinary(
        files.resume[0],
        "student_docs/resume"
      );
    }

    if (files.bonafideCertificate?.[0]) {
      uploads.bonafideCertificate = await uploadToCloudinary(
        files.bonafideCertificate[0],
        "student_docs/bonafide"
      );
    }

    if (files.markSheets) {
      uploads.markSheets = await Promise.all(
        files.markSheets.map((file) =>
          uploadToCloudinary(file, "student_docs/marksheets")
        )
      );
    }

    if (files.certificates) {
      uploads.certificates = await Promise.all(
        files.certificates.map((file) =>
          uploadToCloudinary(file, "student_docs/certificates")
        )
      );
    }

    const student = await Student.findOneAndUpdate(
      { userId: req.user?.userId },
      { $set: { documents: uploads } },
      { new: true }
    );

    if (!student) return next(new ErrorHandler("Student not found", 404));

    res.status(200).json({ success: true, documents: student.documents });
  }
);

// Change password
export const changePassword = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new ErrorHandler("All password fields are required", 400));
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return next(new ErrorHandler("New passwords do not match", 400));
    }

    // Validate password strength
    const passwordValidation =
      PasswordService.validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return next(new ErrorHandler(passwordValidation.message, 400));
    }

    try {
      // Update password using service
      const result = await PasswordService.updatePassword(
        userId,
        currentPassword,
        newPassword
      );

      if (result.success) {
        res.status(200).json({
          success: true,
          message: result.message,
        });
      } else {
        return next(new ErrorHandler(result.message, 400));
      }
    } catch (error) {
      console.error("Error changing password:", error);
      return next(new ErrorHandler("Failed to update password", 500));
    }
  }
);

export const saveCompilerLog = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      student,
      assessment,
      attempt = 1,
      code,
      question,
      testcase,
      totalTestCases,
      totalPassedTestCases,
      codeLanguage,
    } = req.body;

    if (!student || !assessment || !question || !codeLanguage) {
      return next(new ErrorHandler("Required fields are missing", 400));
    }

    const compilerLog = await CompilerLog.create({
      student,
      assessment,
      attempt,
      code,
      question,
      testcase,
      totalTestCases,
      totalPassedTestCases,
      codeLanguage,
    });

    res.status(201).json({
      success: true,
      message: "Compiler log saved successfully",
      compilerLog,
    });
  }
);

export const getStudentResultByID = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const studentId = req.user?.userId;

    console.log("Fetching results for student:", studentId);
    if (!studentId) {
      return next(new ErrorHandler("Student ID is required", 400));
    }

    // Step 1: Get all StudentResponse entries for this student
    const allAttempts = await studentResponseModel
      .find({ student: studentId })
      .populate({
        path: "assessment",
        model: "Assessments",
        select:
          "name level totalTime totalMarks selectedStudents config.resultPolicy",
      })
      .populate({
        path: "responses.questionId",
        model: "Question",
        select: "title correctAnswer totalMarks questionType",
      })
      .lean();

    if (!allAttempts || allAttempts.length === 0) {
      res.status(200).json({
        success: true,
        message: "No assessment attempts found for this student",
        studentId,
        totalAssessmentsAttempted: 0,
        assessments: [],
        isFirstTimeUser: true,
      });
    }

    // Step 2: Group attempts by assessment ID
    const groupedByAssessment: Record<string, any[]> = {};
    for (const attempt of allAttempts) {
      const assessmentId = attempt.assessment?._id?.toString();
      if (!assessmentId) continue;

      if (!groupedByAssessment[assessmentId]) {
        groupedByAssessment[assessmentId] = [];
      }
      groupedByAssessment[assessmentId].push(attempt);
    }

    // Step 3: Build structured response
    const results = Object.entries(groupedByAssessment).map(
      ([assessmentId, attempts]) => {
        const highestAttempt = attempts.reduce((max, curr) =>
          curr.totalMarksScored > max.totalMarksScored ? curr : max
        );

        return {
          assessmentId,
          assessmentInfo: highestAttempt.assessment,
          totalAttempts: attempts.length,
          attempts: attempts.map((a) => ({
            attemptId: a._id,
            totalMarksScored: a.totalMarksScored,
            status: a.status,
            submittedAt: a.submittedAt,
            evaluatedStatus: a.evaluatedStatus,
          })),
          highestScoringAttempt: {
            attemptId: highestAttempt._id,
            totalMarksScored: highestAttempt.totalMarksScored,
            submittedAt: highestAttempt.submittedAt,
            responses: highestAttempt.responses,
          },
        };
      }
    );

    res.status(200).json({
      success: true,
      message: "All assessments and best attempts fetched for student",
      studentId,
      totalAssessmentsAttempted: results.length,
      assessments: results,
    });
  }
);

export const getStudentAssessmentResult = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id: assessmentId } = req.params;
    console.log("Entered here finally");
    const { studentId } = req.query; // or use req.body if coming from POST

    if (!studentId) {
      return next(new ErrorHandler("Student ID is required", 400));
    }

    if (!assessmentId) {
      return next(new ErrorHandler("Assessment ID is required", 400));
    }

    // 1. Check if the assessment exists
    const assessment = await Assessments.findById(assessmentId).lean();
    if (!assessment) {
      return next(new ErrorHandler("Assessment not found", 404));
    }

    // 2. Fetch all responses by the student for this assessment
    const studentAttempts = await studentResponseModel
      .find({
        assessment: assessmentId,
        student: studentId,
      })
      .populate({
        path: "student",
        model: "BaseUser",
        select: "name email",
      })
      .populate({
        path: "responses.questionId",
        model: "Question",
        select: "title questionLevel questionType totalMarks",
      })
      .lean();

    if (!studentAttempts || studentAttempts.length === 0) {
      return next(
        new ErrorHandler(
          "No attempts found for this student on this assessment",
          404
        )
      );
    }

    // 3. Optional: Sort attempts by submission time (latest first)
    // studentAttempts.sort((a, b) =>
    //   new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    // );

    // 4. Build summary of all attempts
    const attemptSummary = studentAttempts.map((attempt) => ({
      attemptId: attempt._id,
      totalMarksScored: attempt.totalMarksScored,
      submittedAt: attempt.submittedAt,
      startedAt: attempt.startedAt,
      status: attempt.status,
    }));

    res.status(200).json({
      success: true,
      message: "Student's assessment attempts fetched successfully",
      assessment,
      student: {
        _id: studentAttempts[0].student._id,
        //  name: studentAttempts[0].student.name,
        //  email: studentAttempts[0].student.email,
      },
      totalAttempts: studentAttempts.length,
      attempts: attemptSummary,
      fullResponses: studentAttempts, // full detailed responses if needed
    });
  }
);
