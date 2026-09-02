export interface BaseUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: string;
  avatar?: string;
}

export interface Education {
  institutionName: string;
  degree: string;
  field: string;
  startDate: string | Date;
  endDate?: string | Date;
  isCurrentlyStudying?: boolean;
  percentage?: number;
  description?: string;
}

export interface PortfolioItem {
  title: string;
  url: string;
  type: string;
  description?: string;
}

export interface WorkExperienceItem {
  companyName: string;
  position: string;
  location?: string;
  startDate: string | Date;
  endDate?: string | Date;
  isCurrentlyWorking?: boolean;
  description?: string;
  type: "internship" | "job";
}

export interface WorkExperience {
  internships?: WorkExperienceItem[];
  jobs?: WorkExperienceItem[];
}

export interface Skills {
  technicalSkills: string[];
  nonTechnicalSkills?: string[];
  preferredJobRoles: string[];
  preferredJobLocations?: string[];
  additionalInfo?: string;
}

export interface Documents {
  resume?: string;
  markSheets?: string[];
  certificates?: string[];
  bonafideCertificate?: string;
}

export interface StudentProfile {
  _id: string;
  userId: BaseUser;
  dob?: string;
  gender?: string;
  altContactNumber?: string;
  aadharNumber?: string;
  panCardNumber?: string;
  digitalSignature?: string;
  education?: Education[];
  skills?: Skills;
  portfolio?: PortfolioItem[];
  workExperience?: WorkExperience;
  documents?: Documents;
  completedProfile: boolean;
}

export interface BasicInfoFormData {
  dob: Date | null;
  gender: "male" | "female" | "other";
  altContactNumber?: string;
  aadharNumber?: string;
  panCardNumber?: string;
  digitalSignature?: string;
}

export interface BaseUserUpdateData {
  id?: string;
  role?: "Student" | "Company" | "College" | "University" | "Admin";
  name?: string;
  phone?: string;
  address?: string;
  email?: string;
  avatar?: string;
}
