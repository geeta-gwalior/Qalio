import * as z from "zod";

export const basicInfoSchema = z.object({
  companyName: z.string().min(2, { message: "Company name is required" }),
  website: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .optional()
    .or(z.literal("")),
  corporateEmail: z.string().email({ message: "Please enter a valid email" }),
  totalEmployees: z.number({ required_error: "Total employees is required" }),

  yearFounded: z.string().min(1, { message: "Year founded is required" }),
  sector: z.string().min(1, { message: "Sector is required" }),
  industry: z.string().min(1, { message: "Industry is required" }),
  alternatePhone: z.string().optional().or(z.literal("")),
  hqCity: z.string().min(1, { message: "HQ city is required" }),
  annualRevenue: z.union([z.number(), z.nan()]).optional(),
});

export const officialInfoSchema = z.object({
  companyType: z.string().min(1, { message: "Company type is required" }),
  gstNumber: z.string().optional().or(z.literal("")),
  udyamRegistrationNumber: z.string().optional().or(z.literal("")),
  industryType: z.string().min(1, { message: "Industry type is required" }),
  yearOfEstablishment: z
    .string()
    .min(1, { message: "Year of establishment is required" }),
});

export const contactPersonSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  designation: z.string().min(1, { message: "Please enter designation" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  phone: z
    .number({ invalid_type_error: "Phone must be a number" })
    .int({ message: "Phone must be a whole number" })
    .positive({ message: "Phone must be positive" }),
});

export const locationSchema = z.object({
  locName: z.string().min(1, { message: "Location name is required" }),
  address: z.string().min(1, { message: "Address is required" }),
  town: z.string().min(1, { message: "Town/City is required" }),
  state: z.string().min(1, { message: "State is required" }),
  country: z.string().min(1, { message: "Country is required" }),
  postalCode: z.string().min(1, { message: "Postal code is required" }),
});

export const jobDetailsSchema = z.object({
  primaryJobRoles: z
    .array(z.string())
    .min(1, { message: "At least one job role is required" }),
  numberOfOpenPositions: z
    .string()
    .min(1, { message: "Number of open positions is required" }),
  expectedSalaryRange: z
    .string()
    .min(1, { message: "Expected salary range is required" }),
});

export const companyPoliciesSchema = z.object({
  internshipStipendPolicy: z
    .string()
    .min(1, { message: "Internship stipend policy is required" }),
  workFromHomePolicy: z
    .string()
    .min(1, { message: "Work from home policy is required" }),
  diversityInclusionInitiatives: z
    .string()
    .min(1, { message: "Diversity & inclusion initiatives are required" }),
});

export const aboutSchema = z.object({
  description: z
    .string()
    .min(1, { message: "Company description is required" }),
  missions: z.string().min(1, { message: "Mission & vision is required" }),
  programs: z.string().optional().or(z.literal("")),
});
