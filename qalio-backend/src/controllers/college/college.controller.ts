import { BaseUser } from "../../models/user/baseUser.model";
import { Request, Response, NextFunction } from "express";
import { College } from "../../models/college/college.model";
import { registerUser } from "../../services/register.service";
import catchAsyncErrors from "../../middlewares/error/catchAsyncErrors";
import { ErrorHandler } from "../../utils/errorHandler";
import InvitedStudents, {
  InvitedStudentEntry,
} from "../../models/college/invite.model";
import crypto from "crypto";
import sendEmail from "../../utils/email/sendEmail";
import { Student } from "../../models/student/student.model";
import mongoose, { Types } from "mongoose";
import cloudinary from "cloudinary";
import { PasswordService } from "../../services/password.service";
import Assessments from "../../models/assessment/assessment.model";
import studentResponseModel from "../../models/assessment/studentResponse.model";
import { Company } from "../../models/company/company.model";
import { generateInvitationEmail } from "../../utils/email/templates/inviteStudent";
import InvitedCompany from "../../models/college/invite.company.model";

interface InvitationEmailProps {
  Email: string;
  firstName: string;
  lastName: string;
  CollegeId: string;
  link: string;
  phone?: string;
  major?: string;
  batch?: string; // Optional batch field
}

interface EmailPayload {
  email: any;
  subject: any;
  html?: any;
  message?: any;
}

interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: "college" | "company" | "university" | "admin";
  };
}

export const registerCollege = (req: Request, res: Response): Promise<any> => {
  req.body.role = "college";
  return registerUser(req, res);
};

export const uploadStudents = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { default: pLimit } = await import("p-limit");
    const limit = pLimit(10); // Controls concurrency

    const { students } = req.body;
    const { userId, role } = req.user!;
    let collegeName = "";

    // Fetch college name if applicable
    if (role === "college") {
      const college = await College.findOne({ userId }).populate(
        "userId",
        "name"
      );
      if (!college) return next(new ErrorHandler("College not found", 404));
      collegeName = (college.userId as any).name;
    }

    //"Ensure there’s an invitations document for this college/user.
    const invitedDoc = await InvitedStudents.findOneAndUpdate(
      { [role]: userId },
      { $set: { [role]: userId } },
      { upsert: true, new: true }
    );

    const emailTasks: Promise<any>[] = [];
    const duplicateEmails: string[] = [];
    const alreadyInvitedEmails: string[] = [];

    for (const student of students) {
      const { firstName, lastName, email, batch, approved, phone, major } =
        student;
      const normalizedEmail = email.toLowerCase();

      // Check if user registered globally
      const isRegistered = await BaseUser.exists({ email: normalizedEmail });

      // Check if already invited by another college
      const invitedElsewhere = await InvitedStudents.exists({
        students: { $elemMatch: { email: normalizedEmail } },
        _id: { $ne: invitedDoc._id },
      });

      // Check if already invited to this college
      const alreadyInvitedHere = invitedDoc.students?.some(
        (s) => s.email.toLowerCase() === normalizedEmail
      );

      // Skip if registered or invited by another college
      if (isRegistered || invitedElsewhere) {
        duplicateEmails.push(normalizedEmail);
        continue;
      }

      // If already invited here, track and continue
      if (alreadyInvitedHere) {
        alreadyInvitedEmails.push(normalizedEmail);
        continue;
      }

      // Otherwise, create invite and email it
      const link = crypto.randomBytes(20).toString("hex");
      invitedDoc.students.push({
        email: normalizedEmail,
        link,
        firstName,
        lastName,
        batch,
        approved,
        phone,
        major,
      });

      const mailContent = generateInvitationEmail({
        Email: normalizedEmail,
        link,
        firstName,
        lastName,
        CollegeId: userId,
        collegeName,
        phone,
        major,
        batch,
      });

      emailTasks.push(limit(() => sendEmail(mailContent)));
    }

    // Save invites and await email sends
    await invitedDoc.save();
    const results = await Promise.allSettled(emailTasks);

    const failedEmails = results
      .map((r, idx) =>
        r.status === "rejected" || !r.value?.success
          ? students[idx].email
          : null
      )
      .filter(Boolean) as string[];

    res.status(200).json({
      success: true,
      message: "Processing complete",
      failedEmails,
      duplicateEmails,
      alreadyInvitedEmails,
    });
  }
);
export const getStudentForCollege = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { role, userId } = req.user!;

    if (role !== "college") {
      return next(
        new ErrorHandler("Only colleges can fetch their students", 403)
      );
    }

    // Query params
    const {
      status,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
      search = "",
    } = req.query;

    const invitedStudentsDoc = await InvitedStudents.findOne({
      college: userId,
    });

    if (!invitedStudentsDoc) {
      return next(new ErrorHandler("No students found for this college", 404));
    }

    let students = invitedStudentsDoc.students || [];

    // ✨ NEW LOGIC HERE - Sync with BaseUser
    // STEP 1: Find base users (signed up)
    const baseUsers = await BaseUser.find({
      email: { $in: students.map((s) => s.email) },
    });

    const baseUserEmails = new Set(baseUsers.map((u) => u.email.toLowerCase()));

    const updatedStudents: any[] = [];

    for (let s of students) {
      const signedUp = baseUserEmails.has(s.email.toLowerCase());

      if (signedUp) {
        s.readyToBeApproved = true;
      }

      updatedStudents.push(s);
    }

    students = updatedStudents;
    // console.log("Updated Students with BaseUser sync: ", students);
    // ---- Filtering based on status ----
    if (status) {
      if (status === "approved") {
        // Step 1: Get BaseUser IDs from College.students
        const collegeDoc = await College.findOne({ userId })
          .populate("students") // students = BaseUser[]
          .exec();

        if (!collegeDoc) {
          res
            .status(404)
            .json({ success: false, message: "College not found" });
        }

        const baseUsers = collegeDoc?.students || [];

        // Step 2: Find all Student docs whose userId is in baseUsers list
        const userIds = baseUsers.map((user: any) => user._id);

        const studentDocs = await Student.find({ userId: { $in: userIds } });

        // Step 3: Merge BaseUser info with Student info
        students = baseUsers
          .map((user: any) => {
            const student = studentDocs.find(
              (s) => s.userId.toString() === user._id.toString()
            );
            console.log("Base User for approved student: ", user);
            return {
              baseUserId: user._id,
              firstName: user.name || "",
              email: user.email || "",
              avatar: user.avatar || "",
              authType: user.authType || "",
              verificationStatus: user.verificationStatus || "",
              major: student?.major || "",
              batch: student?.batch || "",
              approved: student?.approved || false,
              studentId: student?._id || null,
            };
          })
          .reverse();

        // res.status(200).json({ success: true, students });
      } else if (status === "pending") {
        students = students
          .filter((s) => s.readyToBeApproved && !s.approved)
          .map((s) => {
            const baseUser = baseUsers.find(
              (u) => u.email.toLowerCase() === s.email.toLowerCase()
            );

            return {
              ...s,
              baseUserId: baseUser?._id as Types.ObjectId,
              firstName: baseUser?.name,
              avatar: baseUser?.avatar,
              authType: baseUser?.authType,
              verificationStatus: baseUser?.verificationStatus,
              email: baseUser?.email || "",
              batch: s.batch || "2028",
              major: s.major || "", // Ensure major is always defined

              // major:
            };
          })
          .reverse();
      } else if (status === "invited") {
        students = students
          .filter((s) => s.link && !s.readyToBeApproved && !s.approved)
          .reverse();
      }
    }

    // ---- Searching by name or email ----
    if (search) {
      const searchLower = (search as string).toLowerCase();
      students = students.filter((s) => {
        return (
          (s.firstName && s.firstName.toLowerCase().includes(searchLower)) ||
          (s.lastName && s.lastName.toLowerCase().includes(searchLower)) ||
          (s.email && s.email.toLowerCase().includes(searchLower))
        );
      });
    }

    // ---- Sorting ----
    const sortKey = typeof sortBy === "string" ? sortBy : "createdAt";
    const order = sortOrder === "asc" ? 1 : -1;

    students = students.sort((a: any, b: any) => {
      const valA = (a[sortKey] || "").toString().toLowerCase();
      const valB = (b[sortKey] || "").toString().toLowerCase();

      if (valA < valB) return -1 * order;
      if (valA > valB) return 1 * order;
      return 0;
    });

    // ---- Pagination ----
    const pageNumber = parseInt(page as string) || 1;
    const pageSize = parseInt(limit as string) || 10;
    const startIndex = (pageNumber - 1) * pageSize;
    const endIndex = pageNumber * pageSize;

    const paginatedStudents = students.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      totalStudents: students.length,
      page: pageNumber,
      totalPages: Math.ceil(students.length / pageSize),
      students: paginatedStudents,
    });
  }
);

export const approveStudentForCollege = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { studentId } = req.body;
    const collegeUserId = req.user?.userId;
    // console.log("Approving student for college", studentId, collegeUserId);

    if (req.user?.role !== "college") {
      return next(new ErrorHandler("Only colleges can approve students", 403));
    }

    const college = await College.findOne({ userId: collegeUserId });
    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    const student = await Student.findOne({ userId: studentId });
    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    const alreadyApproved = college.students.some((id) =>
      id.equals(student.userId)
    );

    if (alreadyApproved) {
      res.status(200).json({
        success: true,
        message: "Student is already approved",
      });
      return;
    }

    // ✅ Add to approved students
    college.students.push(student.userId);

    // ✅ Remove from pending students if present
    college.pendingStudents = college.pendingStudents.filter(
      (id) => !id.equals(student.userId)
    );

    await college.save();

    // ✅ Update student document
    student.approved = true;
    await student.save();

    // ✅ Update base user
    const baseUser = await BaseUser.findById(student.userId);
    if (!baseUser) {
      return next(new ErrorHandler("Base user not found", 404));
    }

    baseUser.isApproved = true;
    await baseUser.save();

    const invitedDoc = await InvitedStudents.findOne({
      college: college.userId,
    }); // Changed from college._id to college.userId

    if (invitedDoc) {
      const baseUserEmail = baseUser.email.toLowerCase().trim();
      let foundStudent = false;

      invitedDoc.students = invitedDoc.students.map((entry) => {
        const entryEmail = entry.email.toLowerCase().trim();

        if (entryEmail === baseUserEmail) {
          foundStudent = true;
          return {
            ...(entry as any), // Type assertion if needed
            approved: true,
          };
        }
        return entry;
      });

      if (foundStudent) {
        // Alternative way to ensure change detection
        invitedDoc.markModified("students");
        await invitedDoc.save();
        console.log("Successfully updated invited students doc");
      } else {
        console.log("No matching student found in invited students");
      }
    } else {
      console.log("No invited students document found for college");
    }

    res.status(200).json({
      success: true,
      message: "Student approved successfully",
    });
  }
);

//college profile contoller

// Update base user information (including avatar)
export const updateBaseUserInfo = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const allowedFields = ["name", "phone", "address", "avatar"];
    const updates: any = {};

    // Only update fields that are provided
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const baseUser = await BaseUser.findByIdAndUpdate(userId, updates, {
      new: true,
    }).select("-password -otp -resetPasswordToken -resetPasswordExpire");

    if (!baseUser) {
      return next(new ErrorHandler("User not found", 404));
    }

    // Also get the updated college profile to return complete data
    const college = await College.findOne({ userId })
      .populate("students", "name email")
      .populate("pendingStudents", "name email")
      .populate("designatedCompanies", "name email");

    // Combine college and base user data
    const profileData = college
      ? {
          ...college.toObject(),
          name: baseUser.name,
          email: baseUser.email,
          phone: baseUser.phone,
          address: baseUser.address,
          avatar: baseUser.avatar?.url || null,
        }
      : null;

    res.status(200).json({
      success: true,
      message: "Base user info updated successfully",
      user: baseUser,
      college: profileData,
    });
  }
);

// Upload avatar
export const uploadAvatar = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    if (!req.file) {
      return next(new ErrorHandler("No file uploaded", 400));
    }

    // Upload to cloudinary
    const base64String = req.file.buffer.toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${base64String}`;

    const result = await cloudinary.v2.uploader.upload(dataURI, {
      folder: "college/avatars",
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    // Update the base user's avatar
    const baseUser = await BaseUser.findByIdAndUpdate(
      userId,
      {
        $set: {
          avatar: {
            publicId: result.public_id,
            url: result.secure_url,
          },
        },
      },
      { new: true }
    ).select("-password -otp -resetPasswordToken -resetPasswordExpire");

    if (!baseUser) {
      return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Avatar uploaded successfully",
      user: baseUser,
      avatar: {
        publicId: result.public_id,
        url: result.secure_url,
      },
    });
  }
);

// Get college profile with base user info
export const getCollegeProfile = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Get college data
    const college = await College.findOne({ userId })
      .populate("userId")
      .populate("students", "name email")
      .populate("pendingStudents", "name email")
      .populate("designatedCompanies", "name email");

    if (!college) {
      return next(new ErrorHandler("College profile not found", 404));
    }

    // Get base user data (including avatar)
    const baseUser = await BaseUser.findById(userId).select(
      "-password -otp -resetPasswordToken -resetPasswordExpire"
    );

    if (!baseUser) {
      return next(new ErrorHandler("Base user not found", 404));
    }

    // Combine college and base user data
    const profileData = {
      ...college.toObject(),
      name: baseUser.name,
      email: baseUser.email,
      phone: baseUser.phone,
      address: baseUser.address,
      avatar: baseUser.avatar?.url || null,
    };

    res.status(200).json({
      success: true,
      college: profileData,
    });
  }
);

// Create a new college profile
export const createCollege = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Check if college already exists
    const existingCollege = await College.findOne({ userId });
    if (existingCollege) {
      return next(new ErrorHandler("College profile already exists", 400));
    }

    const {
      collegeName,
      description,
      website,
      country,
      state,
      city,
      zipCode,
      region,
      university,
      collegeType,
      yearOfEstablishment,
    } = req.body;

    // Validate required fields
    if (!collegeName) {
      return next(new ErrorHandler("College name is required", 400));
    }

    // Create new college
    const college = await College.create({
      userId,
      collegeName,
      description,
      website,
      country,
      state,
      city,
      zipCode,
      region,
      university,
      collegeType,
      yearOfEstablishment,
      qrVerify: false,
      totalStudents: 0,
      totalCompanies: 0,
      totalJobs: 0,
      avgPackage: 0,
      campusDrives: [],
      pendingStudents: [],
      students: [],
      assessments: [],
      topics: [],
      emails: [],
      emailsSent: [],
      designatedCompanies: [],
      jobs: [],
      accreditations: [],
      coursesOffered: [],
      topCompanies: [],
      mous: [],
      industryTieUps: [],
    });

    res.status(201).json({
      success: true,
      message: "College profile created successfully",
      college,
    });
  }
);

// Get college by ID (for public or admin view)
export const getCollegeById = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return next(new ErrorHandler("Invalid college ID", 400));
    }

    const college = await College.findById(id).select(
      "-emails -emailsSent -resetPasswordToken -resetPasswordExpire"
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      college,
    });
  }
);

// Update basic college information
export const updateBasicInfo = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const {
      collegeName,
      description,
      website,
      country,
      state,
      city,
      zipCode,
      region,
      university,
      collegeType,
      yearOfEstablishment,
      totalStudents,
    } = req.body;

    const updates: any = {};

    // Only update fields that are provided
    if (collegeName !== undefined) updates.collegeName = collegeName;
    if (description !== undefined) updates.description = description;
    if (website !== undefined) updates.website = website;
    if (country !== undefined) updates.country = country;
    if (state !== undefined) updates.state = state;
    if (city !== undefined) updates.city = city;
    if (zipCode !== undefined) updates.zipCode = zipCode;
    if (region !== undefined) updates.region = region;
    if (university !== undefined) updates.university = university;
    if (collegeType !== undefined) updates.collegeType = collegeType;
    if (yearOfEstablishment !== undefined)
      updates.yearOfEstablishment = yearOfEstablishment;
    if (totalStudents !== undefined) updates.totalStudents = totalStudents;

    const college = await College.findOneAndUpdate(
      { userId },
      { $set: updates },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "College information updated successfully",
      college,
    });
  }
);

// Update accreditation information
export const updateAccreditation = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const { accreditations } = req.body;

    if (!accreditations || !Array.isArray(accreditations)) {
      return next(new ErrorHandler("Invalid accreditation data", 400));
    }

    // Validate each accreditation
    for (const accreditation of accreditations) {
      if (!accreditation.body) {
        return next(new ErrorHandler("Accreditation body is required", 400));
      }
    }

    const college = await College.findOneAndUpdate(
      { userId },
      { $set: { accreditations } },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Accreditation information updated successfully",
      college,
    });
  }
);

// Upload accreditation certificate
export const uploadAccreditationCertificate = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};
    if (!userId) return next(new ErrorHandler("User not authenticated", 401));

    const { accreditationIndex } = req.params;
    const index = Number.parseInt(accreditationIndex);
    if (isNaN(index))
      return next(new ErrorHandler("Invalid accreditation index", 400));
    if (!req.file) return next(new ErrorHandler("No file uploaded", 400));

    // Upload to cloudinary
    const base64String = req.file.buffer.toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${base64String}`;

    const result = await cloudinary.v2.uploader.upload(dataURI, {
      folder: "college/accreditation",
      resource_type: "auto",
    });

    const college = await College.findOne({ userId });
    if (!college) return next(new ErrorHandler("College not found", 404));

    const newCertificate = {
      publicId: result.public_id,
      url: result.secure_url,
    };

    // Ensure accreditations array
    if (!Array.isArray(college.accreditations)) {
      college.accreditations = [];
    }

    // Add or update
    if (index >= 0 && index < college.accreditations.length) {
      college.accreditations[index].accreditationCertificate = newCertificate;
    } else {
      college.accreditations[index] = {
        body: "Other",
        accreditationCertificate: newCertificate,
      };
    }

    // 💥 Trim array to match exactly up to last index used
    college.accreditations = college.accreditations.slice(0, index + 1);

    await college.save();

    res.status(200).json({
      success: true,
      message: "Accreditation certificate uploaded successfully",
      certificate: newCertificate,
    });
  }
);

// Update courses offered
export const updateCoursesOffered = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const { coursesOffered } = req.body;

    if (!coursesOffered || !Array.isArray(coursesOffered)) {
      return next(new ErrorHandler("Invalid courses data", 400));
    }

    // Validate each course
    for (const course of coursesOffered) {
      if (!course.program) {
        return next(
          new ErrorHandler("Program name is required for each course", 400)
        );
      }
      if (!course.specializations || !Array.isArray(course.specializations)) {
        return next(new ErrorHandler("Specializations must be an array", 400));
      }
    }

    const college = await College.findOneAndUpdate(
      { userId },
      { $set: { coursesOffered } },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Courses information updated successfully",
      college,
    });
  }
);

// Update placement statistics
export const updatePlacementStatistics = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const { placementStatistics } = req.body;

    const college = await College.findOneAndUpdate(
      { userId },
      { $set: { placementStatistics } },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    // Update avgPackage if average package is provided
    if (placementStatistics && placementStatistics.averagePackage) {
      const avgPackageValue = Number.parseFloat(
        placementStatistics.averagePackage
      );
      if (!isNaN(avgPackageValue)) {
        college.avgPackage = avgPackageValue;
        await college.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Placement statistics updated successfully",
      college,
    });
  }
);

// Update placement officer details
export const updatePlacementOfficer = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const { placementOfficer } = req.body;

    const college = await College.findOneAndUpdate(
      { userId },
      { $set: { placementOfficer } },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Placement officer details updated successfully",
      college,
    });
  }
);

// Update student strength and gender ratio
export const updateStudentDemographics = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const { studentStrength, genderRatio, categoryDistribution } = req.body;

    const updates: any = {};
    if (studentStrength) updates.studentStrength = studentStrength;
    if (genderRatio) updates.genderRatio = genderRatio;
    if (categoryDistribution)
      updates.categoryDistribution = categoryDistribution;

    const college = await College.findOneAndUpdate(
      { userId },
      { $set: { updates } },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    // Update totalStudents if total is provided
    if (studentStrength && studentStrength.total) {
      const totalStudentsValue = Number.parseInt(studentStrength.total);
      if (!isNaN(totalStudentsValue)) {
        college.totalStudents = totalStudentsValue;
        await college.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Student demographics updated successfully",
      college,
    });
  }
);

// Update infrastructure details
export const updateInfrastructure = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const { infrastructure } = req.body;

    const college = await College.findOneAndUpdate(
      { userId },
      { $set: { infrastructure } },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Infrastructure details updated successfully",
      college,
    });
  }
);

// Update banking details
export const updateBankingDetails = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const { bankingDetails } = req.body;

    const college = await College.findOneAndUpdate(
      { userId },
      { $set: { bankingDetails } },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Banking details updated successfully",
      college,
    });
  }
);

// Upload GST certificate
export const uploadGstCertificate = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    if (!req.file) {
      return next(new ErrorHandler("No file uploaded", 400));
    }

    // Upload to cloudinary
    const base64String = req.file.buffer.toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${base64String}`;

    const result = await cloudinary.v2.uploader.upload(dataURI, {
      folder: "college/gst",
      resource_type: "auto",
    });

    const college = await College.findOneAndUpdate(
      { userId },
      {
        $set: {
          gstCertificate: {
            publicId: result.public_id,
            url: result.secure_url,
          },
        },
      },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "GST certificate uploaded successfully",
      certificate: {
        publicId: result.public_id,
        url: result.secure_url,
      },
    });
  }
);

// Upload affiliation certificate
export const uploadAffiliationCertificate = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    if (!req.file) {
      return next(new ErrorHandler("No file uploaded", 400));
    }

    // Upload to cloudinary
    const base64String = req.file.buffer.toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${base64String}`;

    const result = await cloudinary.v2.uploader.upload(dataURI, {
      folder: "college/affiliation",
      resource_type: "auto",
    });

    const college = await College.findOneAndUpdate(
      { userId },
      {
        $set: {
          affiliationCertificate: {
            publicId: result.public_id,
            url: result.secure_url,
          },
        },
      },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Affiliation certificate uploaded successfully",
      certificate: {
        publicId: result.public_id,
        url: result.secure_url,
      },
    });
  }
);

// Update top companies, MOUs, and industry tie-ups
export const updateIndustryConnections = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const { topCompanies, mous, industryTieUps, additionalInfo } = req.body;

    const updates: any = {};
    if (topCompanies) updates.topCompanies = topCompanies;
    if (mous) updates.mous = mous;
    if (industryTieUps) updates.industryTieUps = industryTieUps;
    if (additionalInfo) updates.additionalInfo = additionalInfo;

    const college = await College.findOneAndUpdate(
      { userId },
      { $set: { updates } },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Industry connections updated successfully",
      college,
    });
  }
);

// Update alumni network
export const updateAlumniNetwork = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const { alumniNetwork } = req.body;

    const college = await College.findOneAndUpdate(
      { userId },
      { $set: { alumniNetwork } },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Alumni network updated successfully",
      college,
    });
  }
);

// Update community involvement
export const updateCommunityInvolvement = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const { communityInvolvement } = req.body;

    const college = await College.findOneAndUpdate(
      { userId },
      { $set: { communityInvolvement } },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Community involvement updated successfully",
      college,
    });
  }
);

// Add a comment by admin
export const addCommentByAdmin = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};
    const { collegeId } = req.params;
    const { comment } = req.body;

    if (!userId || req.user?.role !== "admin") {
      return next(new ErrorHandler("Unauthorized access", 403));
    }

    if (!comment) {
      return next(new ErrorHandler("Comment is required", 400));
    }

    const college = await College.findByIdAndUpdate(
      collegeId,
      {
        $push: {
          commentsByAdmin: {
            comment,
            commentedBy: userId,
            commentedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Comment added successfully",
      college,
    });
  }
);

// Change college status (admin only)
export const changeCollegeStatus = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};
    const { collegeId } = req.params;
    const { status } = req.body;

    if (!userId || req.user?.role !== "admin") {
      return next(new ErrorHandler("Unauthorized access", 403));
    }

    if (!status || !["approved", "pending", "rejected"].includes(status)) {
      return next(new ErrorHandler("Invalid status", 400));
    }

    const college = await College.findByIdAndUpdate(
      collegeId,
      {
        $set: {
          status,
          statusChangedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    // Update the base user's approval status if college is approved
    if (status === "approved") {
      await BaseUser.findByIdAndUpdate(college.userId, {
        $set: { isApproved: true },
      });
    }

    res.status(200).json({
      success: true,
      message: `College status changed to ${status}`,
      college,
    });
  }
);

// Change college tier (admin only)
export const changeCollegeTier = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};
    const { collegeId } = req.params;
    const { tier } = req.body;

    if (!userId || req.user?.role !== "admin") {
      return next(new ErrorHandler("Unauthorized access", 403));
    }

    if (!tier || !["tier1", "tier2", "tier3"].includes(tier)) {
      return next(new ErrorHandler("Invalid tier", 400));
    }

    const college = await College.findByIdAndUpdate(
      collegeId,
      { $set: { tier } },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      message: `College tier changed to ${tier}`,
      college,
    });
  }
);

// Add a student to pending students
export const addPendingStudent = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};
    const { studentId } = req.body;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    if (!studentId) {
      return next(new ErrorHandler("Student ID is required", 400));
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    const college = await College.findOneAndUpdate(
      { userId },
      { $addToSet: { pendingStudents: studentId } },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Student added to pending list",
      college,
    });
  }
);

// Approve a pending student
export const approveStudent = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};
    const { studentId } = req.body;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    if (!studentId) {
      return next(new ErrorHandler("Student ID is required", 400));
    }

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return next(new ErrorHandler("Student not found", 404));
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    // Check if student is in pending list
    if (
      !college.pendingStudents.includes(new mongoose.Types.ObjectId(studentId))
    ) {
      return next(new ErrorHandler("Student not in pending list", 400));
    }

    // Move student from pending to approved
    college.pendingStudents = college.pendingStudents.filter(
      (id) => id.toString() !== studentId
    );
    college.students.push(new mongoose.Types.ObjectId(studentId));
    await college.save();

    // Update student's college reference
    await Student.findByIdAndUpdate(studentId, {
      $set: {
        CollegeId: college._id,
        CollegeName: college.collegeName,
      },
    });

    res.status(200).json({
      success: true,
      message: "Student approved successfully",
      college,
    });
  }
);

// Reject a pending student
export const rejectStudent = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};
    const { studentId } = req.body;

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    if (!studentId) {
      return next(new ErrorHandler("Student ID is required", 400));
    }

    const college = await College.findOneAndUpdate(
      { userId },
      { $pull: { pendingStudents: new mongoose.Types.ObjectId(studentId) } },
      { new: true }
    );

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Student rejected successfully",
      college,
    });
  }
);

// Get all students of a college
export const getCollegeStudents = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const college = await College.findOne({ userId }).populate({
      path: "students",
      populate: {
        path: "userId",
        select: "name email phone",
      },
    });

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      students: college.students,
    });
  }
);

// Get all pending students of a college
export const getPendingStudents = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const college = await College.findOne({ userId }).populate({
      path: "pendingStudents",
      populate: {
        path: "userId",
        select: "name email phone",
      },
    });

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      pendingStudents: college.pendingStudents,
    });
  }
);

// Get all colleges (admin only)
export const getAllColleges = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId, role } = req.user || {};

    if (!userId || role !== "admin") {
      return next(new ErrorHandler("Unauthorized access", 403));
    }

    const { status, tier } = req.query as {
      status?: string;
      tier?: string;
    };

    const query: any = {};
    if (status) query.status = status;
    if (tier) query.tier = tier;

    const colleges = await College.find(query).select(
      "collegeName status tier totalStudents avgPackage city state"
    );

    res.status(200).json({
      success: true,
      colleges,
    });
  }
);

// Search colleges
export const searchColleges = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { query, location, tier, collegeType } = req.query as {
      query?: string;
      location?: string;
      tier?: string;
      collegeType?: string;
    };

    const searchQuery: any = { status: "approved" };

    if (query) {
      searchQuery.$or = [
        { collegeName: { $regex: query, $options: "i" } },
        { university: { $regex: query, $options: "i" } },
      ];
    }

    if (location) {
      searchQuery.$or = searchQuery.$or || [];
      searchQuery.$or.push(
        { city: { $regex: location, $options: "i" } },
        { state: { $regex: location, $options: "i" } },
        { country: { $regex: location, $options: "i" } }
      );
    }

    if (tier) {
      searchQuery.tier = tier;
    }

    if (collegeType) {
      searchQuery.collegeType = collegeType;
    }

    const colleges = await College.find(searchQuery).select(
      "collegeName city state tier collegeType avgPackage totalStudents"
    );

    res.status(200).json({
      success: true,
      count: colleges.length,
      colleges,
    });
  }
);

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

export const getStudentAssessmentResult = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id: assessmentId } = req.params;

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

// Add this new function to fetch colleges for company selection
export const getCollegesForCompany = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Fetch all colleges with basic info needed for selection
      const colleges = await College.find({})
        .select("_id collegeName")
        .sort({ collegeName: 1 });

      if (!colleges || colleges.length === 0) {
        res.status(200).json({
          success: true,
          message: "No colleges found",
          colleges: [],
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Colleges fetched successfully",
        colleges,
      });
    } catch (error: any) {
      next(new ErrorHandler(error.message, 500));
    }
  }
);
// Get jobs available to this college (for college dashboard)
export const getCollegeAvailableJobs = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const college = await College.findOne({ userId });
    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    // Import Job model at the top of the file
    const { Job } = require("../../models/job/job.model");

    const jobs = await Job.find({
      $and: [
        {
          $or: [
            { "publishing.visibility": "Public" },
            {
              "publishing.visibility": "SelectedColleges",
              "applicationSettings.invitedColleges": college._id,
            },
          ],
        },
        { applicationDeadline: { $gte: new Date() } },
      ],
    })
      .populate("companyId", "name industry logo")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      jobs,
      count: jobs.length,
    });
  }
);
export const getCollegeDetails = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    const college = await College.findOne({ userId });

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    res.status(200).json({
      success: true,
      college, // Returns the complete college document
    });
  }
);

export const getDesignatedCompanies = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId } = req.user || {};

    if (!userId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    // Find the college by userId
    const college = await College.findOne({ userId });

    if (!college) {
      return next(new ErrorHandler("College not found", 404));
    }

    // Fetch the companies whose _id is in designatedCompanies
    const companies = await Company.find({
      userId: { $in: college.designatedCompanies },
    }).populate({
      path: "userId",
      select: "name email phone avatar address", // only fetch needed fields
    });

    res.status(200).json({
      success: true,
      companies,
    });
  }
);

export const getCompanyDetails = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId: requesterUserId } = req.user || {}; // Renamed to avoid confusion
    const { id: targetUserId } = req.params; // From route params
    console.log("UserId:", targetUserId);
    if (!requesterUserId) {
      return next(new ErrorHandler("User not authenticated", 401));
    }

    if (!targetUserId) {
      return next(new ErrorHandler("User ID param is required", 400));
    }

    // Find the company where userId matches the target
    const company = await Company.findOne({ userId: targetUserId }).populate({
      path: "userId",
      select: "name email phone avatar address",
    });

    if (!company) {
      return next(new ErrorHandler("Company not found", 404));
    }

    res.status(200).json({
      success: true,
      company,
    });
  }
);

export const inviteCompany = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { userId, role } = req.user!;

    if (role !== "college") {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    const { name, email, phone, address } = req.body;

    if (!name || !email) {
      res.status(400).json({
        success: false,
        message: "Company name and email are required.",
      });
      return;
    }

    const college = await College.findOne({ userId }).select("_id");

    if (!college) {
      res.status(404).json({ success: false, message: "College not found" });
      return;
    }

    // Check if already invited
    const existingInvite = await InvitedCompany.findOne({
      collegeId: college._id,
      email,
    });

    if (existingInvite) {
      res.status(409).json({
        success: false,
        message: "This company has already been invited.",
      });
      return;
    }

    const newInvite = await InvitedCompany.create({
      collegeId: college._id,
      name,
      email,
      phone,
      address,
    });

    res.status(201).json({
      success: true,
      message: "Company invited successfully.",
      invitedCompany: newInvite,
    });
  }
);

export const getInvitedCompaniesByCollege = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { userId, role } = req.user!;

    if (role !== "college") {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    const college = await College.findOne({ userId }).select("_id");

    if (!college) {
      res.status(404).json({ success: false, message: "College not found" });
      return;
    }

    const invitedCompanies = await InvitedCompany.find({
      collegeId: college._id,
    }).lean();

    res.status(200).json({
      success: true,
      message: "Invited companies fetched successfully.",
      invitedCompanies,
    });
  }
);
