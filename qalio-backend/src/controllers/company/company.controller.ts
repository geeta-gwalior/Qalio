import { Company } from "../../models/company/company.model";
import type { AuthRequest } from "../../middlewares/auth/auth.middleware";
import { ErrorHandler } from "../../utils/errorHandler";
import cloudinary from "../../config/cloudinary";
import multer from "multer";
import path from "path";
import fs from "fs";
import { registerUser } from "../../services/register.service";
import { PasswordService } from "../../services/password.service";
import catchAsyncErrors from "../../middlewares/error/catchAsyncErrors";
import type { Request, Response, NextFunction } from "express";
import Assessments from "../../models/assessment/assessment.model";
import studentResponseModel from "../../models/assessment/studentResponse.model";
import { Job } from "../../models/job/job.model";
import InvitedCollege from "../../models/company/invite.college.model";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(
        new Error(
          "Error: File upload only supports the following filetypes - " +
            filetypes
        )
      );
    }
  },
}).fields([
  { name: "logo", maxCount: 1 },
  { name: "coverPhoto", maxCount: 1 },
  { name: "documents", maxCount: 10 },
]);

// Helper function to calculate profile completion percentage
const calculateCompletionPercentage = (company: any) => {
  const sections = [
    "basic",
    "officialInformation",
    "contactPerson",
    "location",
    "jobDetails",
    "companyPolicies",
    "about",
  ];

  let completedSections = 0;

  sections.forEach((section) => {
    if (company[section] && Object.keys(company[section]).length > 0) {
      completedSections++;
    }
  });

  return Math.round((completedSections / sections.length) * 100);
};

// Helper function to delete file from cloudinary
const deleteFromCloudinary = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return { success: true };
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    throw new Error("Failed to delete file from Cloudinary");
  }
};

// Helper function to convert employee range string to number
const convertEmployeeRange = (range: string): number => {
  if (!range) return 0;

  // If it's already a number, return it
  if (!isNaN(Number(range))) {
    return Number(range);
  }

  // Handle ranges like "51-200"
  if (range.includes("-")) {
    const [min, max] = range
      .split("-")
      .map((num) => Number.parseInt(num.trim()));
    return Math.floor((min + max) / 2); // Return the average
  }

  // Handle "1001+" format
  if (range.includes("+")) {
    return Number.parseInt(range.replace("+", ""));
  }

  return 0; // Default fallback
};

// Helper function to convert revenue range string to number
const convertRevenueRange = (range: string): number => {
  if (!range) return 0;

  // If it's already a number, return it
  if (!isNaN(Number(range))) {
    return Number(range);
  }

  // Handle "Less than $1M"
  if (range.toLowerCase().includes("less than")) {
    return 500000; // Assume half of $1M
  }

  // Handle "$1M - $10M" format
  if (range.includes("-")) {
    const parts = range.split("-");
    const min = Number.parseFloat(parts[0].replace(/[^0-9.]/g, ""));
    const max = Number.parseFloat(parts[1].replace(/[^0-9.]/g, ""));

    // Determine multiplier (M for million, B for billion)
    const minMultiplier = parts[0].includes("M")
      ? 1000000
      : parts[0].includes("B")
      ? 1000000000
      : 1;
    const maxMultiplier = parts[1].includes("M")
      ? 1000000
      : parts[1].includes("B")
      ? 1000000000
      : 1;

    return Math.floor((min * minMultiplier + max * maxMultiplier) / 2); // Return the average
  }

  // Handle "$1B+" format
  if (range.includes("+")) {
    const num = Number.parseFloat(range.replace(/[^0-9.]/g, ""));
    const multiplier = range.includes("M")
      ? 1000000
      : range.includes("B")
      ? 1000000000
      : 1;
    return num * multiplier;
  }

  return 0; // Default fallback
};

// Register a new company
export const registerCompany = (req: Request, res: Response): Promise<any> => {
  // Assign role as "college"
  req.body.role = "company";
  return registerUser(req, res);
};
// Get company profile
export const getCompanyProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  const company = await Company.findOne({ userId }).populate("userId");
  if (!company) {
    throw new ErrorHandler("Company profile not found", 404);
  }

  // Calculate completion percentage
  const completionPercentage = calculateCompletionPercentage(company);

  res.status(200).json({
    success: true,
    company: {
      ...company.toObject(),
      completionPercentage,
    },
  });
};

// Get profile status
export const getProfileStatus = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  const company = await Company.findOne({ userId }).select(
    "status statusChangedAt"
  );
  if (!company) {
    throw new ErrorHandler("Company profile not found", 404);
  }

  // Calculate completion percentage
  const completionPercentage = calculateCompletionPercentage(company);

  res.status(200).json({
    success: true,
    status: company.status,
    statusChangedAt: company.statusChangedAt,
    completionPercentage,
  });
};

// Update basic info
export const updateBasicInfo = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  // Process file uploads
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: `Multer error: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: `Error: ${err.message}`,
      });
    }

    try {
      const company = await Company.findOne({ userId });
      if (!company) {
        throw new ErrorHandler("Company profile not found", 404);
      }

      // Extract basic info from request body
      const {
        companyName,
        website,
        corporateEmail,
        totalEmployees,
        yearFounded,
        sector,
        industry,
        companyType,
        alternatePhone,
        hqCity,
        annualRevenue,
      } = req.body;

      // Initialize basic info if it doesn't exist
      if (!company.basic) {
        company.basic = {} as any;
      }

      // Convert string values to appropriate types
      const employeesValue = totalEmployees
        ? convertEmployeeRange(totalEmployees)
        : company.basic.totalEmployees;
      const revenueValue = annualRevenue
        ? convertRevenueRange(annualRevenue)
        : company.basic.annualRevenue;
      const yearFoundedValue = yearFounded
        ? Number.parseInt(yearFounded)
        : company.basic.yearFounded;
      const alternatePhoneValue = alternatePhone
        ? Number.parseInt(alternatePhone)
        : company.basic.alternatePhone;

      // Update basic info
      company.basic = {
        ...company.basic,
        companyName: companyName || company.basic.companyName,
        website: website || company.basic.website,
        corporateEmail: corporateEmail || company.basic.corporateEmail,
        totalEmployees: employeesValue,
        yearFounded: yearFoundedValue,
        sector: sector || company.basic.sector,
        industry: industry || company.basic.industry,
        companyType: companyType || company.basic.companyType,
        alternatePhone: alternatePhoneValue,
        hqCity: hqCity || company.basic.hqCity,
        annualRevenue: revenueValue,
      };

      // Handle logo upload
      if (req.files && (req.files as any).logo) {
        const logoFile = (req.files as any).logo[0];

        // Delete old logo from cloudinary if exists
        if (company.basic?.publicIdLogo) {
          await deleteFromCloudinary(company.basic.publicIdLogo);
        }

        // Upload new logo to cloudinary
        const logoResult = await cloudinary.uploader.upload(logoFile.path, {
          folder: "company_logos",
        });

        company.basic.logo = logoResult.secure_url;
        company.basic.publicIdLogo = logoResult.public_id;

        // Delete temp file
        fs.unlinkSync(logoFile.path);
      }

      // Handle cover photo upload
      if (req.files && (req.files as any).coverPhoto) {
        const coverFile = (req.files as any).coverPhoto[0];

        // Delete old cover from cloudinary if exists
        if (company.basic?.publicIdCover) {
          await deleteFromCloudinary(company.basic.publicIdCover);
        }

        // Upload new cover to cloudinary
        const coverResult = await cloudinary.uploader.upload(coverFile.path, {
          folder: "company_covers",
        });

        company.basic.coverPhoto = coverResult.secure_url;
        company.basic.publicIdCover = coverResult.public_id;

        // Delete temp file
        fs.unlinkSync(coverFile.path);
      }

      await company.save();

      res.status(200).json({
        success: true,
        message: "Basic information updated successfully",
        company,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  });
};

// Update official info
export const updateOfficialInfo = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
    return;
  }

  try {
    const company = await Company.findOne({ userId });
    if (!company) {
      res.status(404).json({
        success: false,
        message: "Company profile not found",
      });
      return;
    }

    const {
      companyType,
      gstNumber,
      udyamRegistrationNumber,
      industryType,
      yearOfEstablishment,
    } = req.body;

    // Initialize official info if it doesn't exist
    if (!company.officialInformation) {
      company.officialInformation = {} as any;
    }

    // Convert yearOfEstablishment to number
    const yearValue = yearOfEstablishment
      ? Number.parseInt(yearOfEstablishment.toString())
      : company.officialInformation.yearOfEstablishment;

    // Update official info with explicit null checks
    company.officialInformation = {
      companyType:
        companyType !== undefined
          ? companyType
          : company.officialInformation.companyType,
      gstNumber:
        gstNumber !== undefined
          ? gstNumber
          : company.officialInformation.gstNumber,
      udyamRegistrationNumber:
        udyamRegistrationNumber !== undefined
          ? udyamRegistrationNumber
          : company.officialInformation.udyamRegistrationNumber,
      industryType:
        industryType !== undefined
          ? industryType
          : company.officialInformation.industryType,
      yearOfEstablishment: yearValue,
    };

    // Log the data being saved for debugging
    console.log("Saving official info:", company.officialInformation);

    await company.save();

    res.status(200).json({
      success: true,
      message: "Official information updated successfully",
      company,
    });
  } catch (error: any) {
    console.error("Error updating official info:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Add the correct endpoint handler for contact person
// Update the updateContactPerson function to use the correct route

// Update contact person
export const updateContactPerson = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  try {
    const company = await Company.findOne({ userId });
    if (!company) {
      throw new ErrorHandler("Company profile not found", 404);
    }

    const { name, designation, email, phone } = req.body;

    // Initialize contact person if it doesn't exist
    if (!company.contactPerson) {
      company.contactPerson = {} as any;
    }

    // Convert phone to number
    const phoneValue = phone ? Number(phone) : company.contactPerson.phone;

    // Update contact person
    company.contactPerson = {
      name: name || company.contactPerson.name,
      designation: designation || company.contactPerson.designation,
      email: email || company.contactPerson.email,
      phone: phoneValue,
    };

    await company.save();

    res.status(200).json({
      success: true,
      message: "Contact person updated successfully",
      company,
    });
  } catch (error: any) {
    console.error("Error updating contact person:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Update location
export const updateLocation = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  const company = await Company.findOne({ userId });
  if (!company) {
    throw new ErrorHandler("Company profile not found", 404);
  }

  const { locName, address, town, state, country, postalCode } = req.body;

  // Initialize location if it doesn't exist
  if (!company.location) {
    company.location = {} as any;
  }

  // Update location
  company.location = {
    locName: locName || company.location.locName,
    address: address || company.location.address,
    town: town || company.location.town,
    state: state || company.location.state,
    country: country || company.location.country,
    postalCode: postalCode || company.location.postalCode,
  };

  await company.save();

  res.status(200).json({
    success: true,
    message: "Location updated successfully",
    company,
  });
};

// Update job details
export const updateJobDetails = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  const company = await Company.findOne({ userId });
  if (!company) {
    throw new ErrorHandler("Company profile not found", 404);
  }

  const { primaryJobRoles, numberOfOpenPositions, expectedSalaryRange } =
    req.body;

  // Initialize job details if it doesn't exist
  if (!company.jobDetails) {
    company.jobDetails = {} as any;
  }

  // Convert numberOfOpenPositions to number
  const positionsValue = numberOfOpenPositions
    ? Number.parseInt(numberOfOpenPositions)
    : company.jobDetails.numberOfOpenPositions;

  // Update job details
  company.jobDetails = {
    primaryJobRoles: primaryJobRoles || company.jobDetails.primaryJobRoles,
    numberOfOpenPositions: positionsValue,
    expectedSalaryRange:
      expectedSalaryRange || company.jobDetails.expectedSalaryRange,
  };

  await company.save();

  res.status(200).json({
    success: true,
    message: "Job details updated successfully",
    company,
  });
};

// Update company policies
export const updateCompanyPolicies = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  const company = await Company.findOne({ userId });
  if (!company) {
    throw new ErrorHandler("Company profile not found", 404);
  }

  const {
    internshipStipendPolicy,
    workFromHomePolicy,
    diversityInclusionInitiatives,
  } = req.body;

  // Initialize company policies if it doesn't exist
  if (!company.companyPolicies) {
    company.companyPolicies = {} as any;
  }

  // Update company policies
  company.companyPolicies = {
    internshipStipendPolicy:
      internshipStipendPolicy ||
      company.companyPolicies.internshipStipendPolicy,
    workFromHomePolicy:
      workFromHomePolicy || company.companyPolicies.workFromHomePolicy,
    diversityInclusionInitiatives:
      diversityInclusionInitiatives ||
      company.companyPolicies.diversityInclusionInitiatives,
  };

  await company.save();

  res.status(200).json({
    success: true,
    message: "Company policies updated successfully",
    company,
  });
};

// Update about
export const updateAbout = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  const company = await Company.findOne({ userId });
  if (!company) {
    throw new ErrorHandler("Company profile not found", 404);
  }

  const { description, missions, programs } = req.body;

  // Initialize about if it doesn't exist
  if (!company.about) {
    company.about = {} as any;
  }

  // Update about
  company.about = {
    description: description || company.about.description,
    missions: missions || company.about.missions,
    programs: programs || company.about.programs,
  };

  await company.save();

  res.status(200).json({
    success: true,
    message: "About information updated successfully",
    company,
  });
};

// Update company leader
export const updateCompanyLeader = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  const company = await Company.findOne({ userId });
  if (!company) {
    throw new ErrorHandler("Company profile not found", 404);
  }

  const { name, title, country, isGlobalLeader } = req.body;

  // Initialize leader if it doesn't exist
  if (!company.leader) {
    company.leader = {} as any;
  }

  // Update leader
  company.leader = {
    name: name || company.leader.name,
    title: title || company.leader.title,
    country: country || company.leader.country,
    isGlobalLeader:
      isGlobalLeader !== undefined
        ? isGlobalLeader
        : company.leader.isGlobalLeader,
  };

  await company.save();

  res.status(200).json({
    success: true,
    message: "Company leader updated successfully",
    company,
  });
};

// Add company award
export const addCompanyAward = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  // Process file uploads for award media
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: `Error: ${err.message}`,
      });
    }

    try {
      const company = await Company.findOne({ userId });
      if (!company) {
        throw new ErrorHandler("Company profile not found", 404);
      }

      const { name, description, dateOfIssue } = req.body;
      const mediaUrls: string[] = [];

      // Handle media uploads
      if (req.files && (req.files as any).media) {
        const mediaFiles = (req.files as any).media;

        for (const file of mediaFiles) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "company_awards",
          });
          mediaUrls.push(result.secure_url);
          fs.unlinkSync(file.path);
        }
      }

      // Initialize awards array if it doesn't exist
      if (!company.awards) {
        company.awards = [];
      }

      // Add new award
      company.awards.push({
        name,
        description,
        dateOfIssue: new Date(dateOfIssue),
        media: mediaUrls,
      });

      await company.save();

      res.status(201).json({
        success: true,
        message: "Company award added successfully",
        company,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  });
};

// Upload company documents
export const uploadCompanyDocuments = async (
  req: AuthRequest,
  res: Response
) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  // Process file uploads
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: `Error: ${err.message}`,
      });
    }

    try {
      const company = await Company.findOne({ userId });
      if (!company) {
        throw new ErrorHandler("Company profile not found", 404);
      }

      // Initialize documents object if it doesn't exist
      if (!company.documents) {
        company.documents = {} as any;
      }

      // Handle document uploads
      if (req.files && (req.files as any).documents) {
        const documentFiles = (req.files as any).documents;

        for (const file of documentFiles) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "company_documents",
          });

          // Store document URL based on original filename or use a generic key
          const filename = file.originalname.toLowerCase();
          let documentKey = `document_${Date.now()}`;

          if (
            filename.includes("incorporation") ||
            filename.includes("certificate")
          ) {
            documentKey = "certificateOfIncorporation";
          } else if (filename.includes("msme")) {
            documentKey = "msmeCertificate";
          } else if (filename.includes("iso")) {
            documentKey = "isoCertification";
          } else if (
            filename.includes("nda") ||
            filename.includes("agreement")
          ) {
            documentKey = "ndaAgreement";
          }
          // Add the document to the company's documents
          (company.documents as any)[documentKey] = result.secure_url;

          // Delete temp file
          fs.unlinkSync(file.path);
        }
      }

      await company.save();

      res.status(200).json({
        success: true,
        message: "Documents uploaded successfully",
        company,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  });
};

// Upload company images
export const uploadCompanyImages = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  // Process file uploads
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: `Error: ${err.message}`,
      });
    }

    try {
      const company = await Company.findOne({ userId });
      if (!company) {
        throw new ErrorHandler("Company profile not found", 404);
      }

      // Handle image uploads
      if (req.files && (req.files as any).images) {
        const imageFiles = (req.files as any).images;
        const imageUrls: string[] = [];

        for (const file of imageFiles) {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "company_images",
          });
          imageUrls.push(result.secure_url);
          fs.unlinkSync(file.path);
        }

        // Store image URLs in company document
        // Initialize basic if it doesn't exist
        if (!company.basic) {
          company.basic = {} as any;
        }

        // Initialize images array if it doesn't exist
        if (!(company.basic as any).images) {
          (company.basic as any).images = [];
        }
        (company.basic as any).images = [
          ...(company.basic as any).images,
          ...imageUrls,
        ];
      }

      await company.save();

      res.status(200).json({
        success: true,
        message: "Images uploaded successfully",
        company,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || "Internal server error",
      });
    }
  });
};

// Complete profile
export const completeProfile = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  const company = await Company.findOne({ userId });
  if (!company) {
    throw new ErrorHandler("Company profile not found", 404);
  }

  // Check if all required sections are completed
  const requiredSections = [
    "basic",
    "officialInformation",
    "contactPerson",
    "location",
    "jobDetails",
    "companyPolicies",
    "about",
  ];

  const missingFields: string[] = [];

  requiredSections.forEach((section) => {
    if (
      !company[section as keyof typeof company] ||
      Object.keys(company[section as keyof typeof company] || {}).length === 0
    ) {
      missingFields.push(section);
    }
  });

  if (missingFields.length > 0) {
    throw new ErrorHandler(
      `Please complete the following sections: ${missingFields.join(", ")}`,
      400
    );
  }

  // Update status to pending for admin approval
  company.status = "pending";
  company.statusChangedAt = new Date();
  company.completedProfile = true;

  await company.save();

  res.status(200).json({
    success: true,
    message: "Profile completed successfully and submitted for approval",
    company,
  });
};

// Get admin comments
export const getAdminComments = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  const company = await Company.findOne({ userId }).populate({
    path: "commentsByAdmin.commentedBy",
    select: "name email",
  });

  if (!company) {
    throw new ErrorHandler("Company profile not found", 404);
  }

  res.status(200).json({
    success: true,
    comments: company.commentsByAdmin,
  });
};

// Initialize dashboard
export const initializeDashboard = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new ErrorHandler("Unauthorized", 401);
  }

  const company = await Company.findOne({ userId });
  if (!company) {
    throw new ErrorHandler("Company profile not found", 404);
  }

  // Initialize dashboard with default values
  company.dashboard = {
    totalJobs: 0,
    studentsHired: 0,
    approved: 0,
    institutes: 0,
    assessments: 0,
    newJobs: 0,
    newHiredEmps: 0,
  };

  await company.save();

  res.status(200).json({
    success: true,
    message: "Dashboard initialized successfully",
    dashboard: company.dashboard,
  });
};
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

export const getStudentJobAssessmentResult = catchAsyncErrors(
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

export const getCompanyJobsWithAssessments = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { userId, role } = req.user!; // Ensure Auth middleware sets req.user

    if (role !== "company") {
      res.status(403).json({ success: false, message: "Access denied" });
    }

    const company = await Company.findOne({ userId })

      .select("jobs")
      .populate({
        path: "jobs",
        select: "jobTitle jobType status applicationDeadline assessment",
        populate: {
          path: "assessment",
          model: "Assessments",
        },
      })
      .lean();

    if (!company) {
      res.status(404).json({ success: false, message: "Company not found" });
    }

    const jobsWithAssessments = company?.jobs || [];

    res.status(200).json({
      success: true,
      message: "Company jobs with assessments fetched successfully",
      jobs: jobsWithAssessments,
    });
  }
);

export const getApplicantsData = catchAsyncErrors(
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const { userId, role } = req.user!;
    const jobId = req.params.id;

    if (role !== "company") {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    const company = await Company.findOne({ userId }).select("_id");

    if (!company) {
      res.status(404).json({ success: false, message: "Company not found" });
      return;
    }

    const job = await Job.findOne({ _id: jobId })
      .select("jobTitle jobType applicants")
      .populate({
        path: "applicants.studentId",
        populate: {
          path: "userId",
          model: "BaseUser",
          select: "name batch major",
        },
      })
      .populate({
        path: "applicants.applicationId",
        select: "resumeUrl coverLetter assessmentScore assessmentCompleted",
      });

    if (!job) {
      res
        .status(404)
        .json({ success: false, message: "Job not found or unauthorized" });
      return;
    }

    const formattedApplications = (job.applicants ?? []).map(
      (applicant: any) => ({
        jobTitle: job.jobTitle,
        jobType: job.jobType,
        jobId: job._id,
        applicationStatus: applicant.status,
        applicationDate: applicant.applicationDate,
        studentName: applicant.studentId?.userId?.name || "Unknown",
        batch: applicant.studentId?.batch || "Unknown",
        major: applicant.studentId?.major || "Unknown",
        studentId: applicant.studentId?._id,
        resumeUrl: applicant.applicationId?.resumeUrl || null,
        coverLetter: applicant.applicationId?.coverLetter || null,
        assessmentScore: applicant.applicationId?.assessmentScore || null,
        assessmentCompleted:
          applicant.applicationId?.assessmentCompleted || false,
      })
    );

    res.status(200).json({
      success: true,
      data: formattedApplications,
    });
  }
);

//   async (req: AuthRequest, res: Response, next: NextFunction) => {
//     const { userId, role } = req.user!;

//     if (role !== "company") {
//       return next(new ErrorHandler("Only companies can access this", 403));
//     }

//     const company = await Company.find({ userId }).populate("jobs").lean();
//     console.log("company here", company);

//     if (!company) {
//       return next(new ErrorHandler("Company not found", 404));
//     }

//     console.log("Jobs2 are", company);
//     // Step 1: Get jobs created by this company
//     const jobs = await Job.find({ companyId: userId })
//       .select("assessment jobTitle jobType status applicationDeadline")
//       .lean();
//     console.log("Jobs are", jobs);

//     // Step 2: Filter jobs with defined assessment field
//     const jobsWithAssessment = jobs.filter(
//       (job): job is typeof job & { assessment: IAssessment } =>
//         job.assessment !== undefined && job.assessment !== null
//     );
//     //console.log("Jobs with assessment",jobsWithAssessment)
//     // Step 3: Extract assessment IDs
//     const assessmentIds = jobsWithAssessment.map((job) => job.assessment);
//     console.log("Assessment Id", assessmentIds);
//     // Step 4: Fetch assessments
//     const assessments = await Assessments.find({
//       _id: { $in: assessmentIds },
//     }).lean();

//     // Step 5: Merge job info into assessment
//     const finalAssessments = assessments.map((assessment) => {
//       const matchingJob = jobsWithAssessment.find(
//         (j) => j.assessment?.toString() === assessment._id?.toString()
//       );
//       console.log("Matching Jobs::", matchingJob);
//       return {
//         ...assessment,
//         job: matchingJob
//           ? {
//               jobTitle: matchingJob.jobTitle,
//               jobType: matchingJob.jobType,
//               status: matchingJob.status,
//               applicationDeadline: matchingJob.applicationDeadline,
//             }
//           : null,
//       };
//     });

//     res.status(200).json({
//       success: true,
//       message: "Assessments with associated job info fetched successfully",
//       assessments: finalAssessments,
//     });
//   }
// );

//Controller for invite college for qalio plateform
export const inviteCollege = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { userId, role } = req.user!;

    if (role !== "company") {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    const { name, email, phone, address } = req.body;

    if (!name || !email) {
      res.status(400).json({
        success: false,
        message: "College name and email are required.",
      });
      return;
    }

    const company = await Company.findOne({ userId }).select("_id");

    if (!company) {
      res.status(404).json({ success: false, message: "Company not found" });
      return;
    }

    // Check if already invited
    const alreadyInvited = await InvitedCollege.findOne({
      company: company._id,
      email,
    });

    if (alreadyInvited) {
      res.status(409).json({
        success: false,
        message: "This college has already been invited.",
      });
      return;
    }

    // Create new invite
    const newInvite = await InvitedCollege.create({
      company: company._id,
      name,
      email,
      phone,
      address,
    });

    res.status(201).json({
      success: true,
      message: "College invited successfully.",
      invitedCollege: newInvite,
    });
  }
);

export const getInvitedCollegesByCompany = catchAsyncErrors(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { userId, role } = req.user!;

    if (role !== "company") {
      res.status(403).json({ success: false, message: "Access denied" });
      return;
    }

    const company = await Company.findOne({ userId }).select("_id");

    if (!company) {
      res.status(404).json({ success: false, message: "Company not found" });
      return;
    }

    const invitedColleges = await InvitedCollege.find({
      company: company._id,
    }).lean();

    res.status(200).json({
      success: true,
      message: "Invited colleges fetched successfully.",
      invitedColleges,
    });
  }
);
