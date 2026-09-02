import { z } from "zod"

export const basicInfoSchema = z.object({
  collegeName: z.string().min(1, "College name is required"),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
  totalStudents: z.number().min(0, "Total students must be a positive number"),
  totalCompanies: z.number().min(0, "Total companies must be a positive number").optional(),
  totalJobs: z.number().min(0, "Total jobs must be a positive number").optional(),
  avgPackage: z.number().min(0, "Average package must be a positive number").optional(),
})

export const locationSchema = z.object({
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  region: z.string().optional(),
})

export const academicInfoSchema = z.object({
  university: z.string().min(1, "University is required"),
  collegeType: z.enum(["Government", "Private", "Autonomous"]),
  yearOfEstablishment: z.number().min(1800, "Please enter a valid year").max(new Date().getFullYear()),
})

// Fixed courses schema to make specializations optional with proper default


export const coursesSchema = z.object({
  coursesOffered: z.array(
    z.object({
      program: z.string().min(1, "Program is required"),
      specializations: z.array(z.string()),
      intakeCapacity: z.number().min(0),
      level: z.string().optional(),
      duration: z.string().optional(),
    })
  ),
});


export const placementSchema = z.object({
  placementStatistics: z
    .object({
      average: z.string().optional(),
      highest: z.string().optional(),
      averagePackage: z.string().optional(),
    })
    .optional(),
  topCompanies: z.array(z.string()).optional(),
  placementOfficer: z
    .object({
      name: z.string().optional(),
      email: z.string().email("Please enter a valid email").optional().or(z.literal("")),
      phone: z.string().optional(),
      designation: z.string().optional(),
    })
    .optional(),
})

export const infrastructureSchema = z.object({
  infrastructure: z.object({
    laboratoryDetails: z.string().optional(),
    campusArea: z.string().optional(),
    hostelFacility: z.enum(["yes", "no"]).optional(),
    libraryFacilities: z.string().optional(),
    sportsFacilities: z.string().optional(),
    transportFacilities: z.string().optional(),
  }),
})

export const bankingSchema = z.object({
  bankingDetails: z.object({
    panCard: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
    accountHolderName: z.string().optional(),
    branchName: z.string().optional(),
    gstNumber: z.string().optional(),
  }),
})

export const aboutSchema = z.object({
  description: z.string().min(1, "Description is required"),
  achievement: z.enum(["Statistics", "Percentage", "DataName"]).optional(),
  performance: z.string().optional(),
})
