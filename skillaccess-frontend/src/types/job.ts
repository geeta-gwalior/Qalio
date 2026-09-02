// Add this interface for company data
interface ICompanyBasic {
  companyName: string;
  logo?: string;
  industry?: string;
}

export interface ICompanyPopulated {
  _id: string;
  basic: ICompanyBasic;
  avatar?: string;
  name?: string;
}

// Update the IJob interface
export interface IJob {
  department?: any;
  _id: string;
  jobTitle?: string; // made optional
  jobDescription?: string; // made optional
  companyId: ICompanyPopulated;
  location?: string[];
  jobType?: string; // made optional
  roleLevel?: string;
  numberOfOpenings?: number;
  salaryRange?: {
    min?: number;
    max?: number;
  };
  applicationDeadline?: Date | string;
  createdAt?: Date | string;
  eligibility?: {
    minEducationLevel?: string;
    allowedDegrees?: string[];
    graduationYears?: number[];
    minPercentage?: number;
    experienceRequired?: string;
    requiredSkills?: string[];
  };
  benefits?: string[];
  assessment?: {
    description?: string;
    required?: boolean;
    appearedStudents?: string[];
    _id: string;
  };
  publishing?: {
    status: "Draft" | "Published" | "Scheduled";
    publishDate?: Date;
    visibility: "Public" | "Private" | "SelectedColleges";
    internalNotes?: string;
  };
  applicationSettings?: {
    customQuestions?: Array<{
      question: string;
      type: string;
      options?: string[];
      required?: boolean;
    }>;
  };
  eligibleBatches?: number[];
}
