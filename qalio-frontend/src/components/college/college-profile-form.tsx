"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  Plus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { getCookie } from "@/utils/getCookie";
import CollegeCompletionSummary from "./college-completion-summary";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";

// Add this constant at the top of the file, perhaps after imports or before component definition
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 2MB in bytes

// Updated schemas to match backend model
const basicInfoSchema = z.object({
  collegeName: z.string().min(1, "College name is required").optional(),
  website: z.string().optional(),
  totalStudents: z.number().min(0).optional(),
  totalCompanies: z.number().min(0).optional(),
  totalJobs: z.number().min(0).optional(),
  oldPassword: z.string().optional(),
});

const locationSchema = z.object({
  country: z.string().min(1, "Country is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  zipCode: z.string().min(1, "Zip code is required"),
  region: z.string().optional(),
});

const academicInfoSchema = z.object({
  university: z.string().min(1, "University is required"),
  collegeType: z.enum(["Government", "Private", "Autonomous"]),
  yearOfEstablishment: z.coerce
    .number()
    .min(1800, "Too early")
    .max(new Date().getFullYear(), "Too late")
    .optional(),
});

const coursesSchema = z.object({
  coursesOffered: z.array(
    z.object({
      program: z.string().min(1, "Program name is required"),
      specializations: z.array(z.string()).optional(),
      intakeCapacity: z.number().min(0).optional(),
    })
  ),
});

const placementSchema = z.object({
  placementStatistics: z
    .object({
      average: z
        .union([
          z
            .string()
            .refine(
              (val) => val === "" || !isNaN(Number(val)),
              "Please enter a valid number"
            )
            .transform((val) => (val === "" ? undefined : Number(val))),
          z.number(),
        ])
        .optional(),
      highest: z
        .union([
          z
            .string()
            .refine(
              (val) => val === "" || !isNaN(Number(val)),
              "Please enter a valid number"
            )
            .transform((val) => (val === "" ? undefined : Number(val))),
          z.number(),
        ])
        .optional(),
      averagePackage: z
        .union([
          z
            .string()
            .refine(
              (val) => val === "" || !isNaN(Number(val)),
              "Please enter a valid number"
            )
            .transform((val) => (val === "" ? undefined : Number(val))),
          z.number(),
        ])
        .optional(),
    })
    .optional(),
  placementOfficer: z
    .object({
      name: z.string().optional(),
      email: z
        .string()
        .email("Enter a valid email")
        .optional()
        .or(z.literal("")),
      phone: z.string().optional(),
    })
    .optional(),
  topCompanies: z.array(z.string()).optional(),
});

const bankingSchema = z.object({
  bankingDetails: z.object({
    panCard: z.string().optional(),
    bankName: z.string().optional(),
    accountNumber: z.string().optional(),
    ifscCode: z.string().optional(),
  }),
});

const aboutSchema = z.object({
  description: z.string().optional(),
});

// New schema for documents - UPDATED FOR ACCREDITATIONS
const documentSchema = z.object({
  gstCertificate: z
    .object({
      url: z.string().optional(),
      publicId: z.string().optional(),
      _id: z.string().optional(),
      file: z.any().optional(), // For new file upload
    })
    .optional(),
  affiliationCertificate: z
    .object({
      url: z.string().optional(),
      publicId: z.string().optional(),
      _id: z.string().optional(),
      file: z.any().optional(), // For new file upload
    })
    .optional(),
  accreditations: z.array(
    z.object({
      body: z.string().optional(), // Added 'body' field from backend response
      _id: z.string().optional(),
      accreditationCertificate: z // Nested object for certificate details
        .object({
          url: z.string().optional(),
          publicId: z.string().optional(),
          _id: z.string().optional(),
        })
        .optional(),
      file: z.any().optional(), // For new file upload
    })
  ),
});

interface CollegeProfileFormProps {
  defaultValues?: any;
  onUpdate?: (updatedData: any) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  isEditMode?: boolean;
  collegeAPI: any;
  onProfileUpdate?: (profileData: any) => void;
  currentStep?: number;
  onStepComplete?: (stepIndex: number) => void;
  completedSteps?: number[];
}

export default function CollegeProfileForm({
  defaultValues,
  onUpdate,
  onCancel,
  isLoading: externalLoading = false,
  isEditMode = true,
  collegeAPI,
  onProfileUpdate,
  currentStep = 0,
  onStepComplete,
  completedSteps = [],
}: CollegeProfileFormProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collegeData, setCollegeData] = useState<any>(null);
  const [isDataPopulated, setIsDataPopulated] = useState(false);
  const [formsInitialized, setFormsInitialized] = useState(false);
  const [completedStepsState, setCompletedSteps] =
    useState<number[]>(completedSteps);

  // Step configuration - Updated to 10 steps (including completion summary)
  const steps = [
    { id: "basic-info", label: "Basic Info", schema: basicInfoSchema },
    { id: "location", label: "Location", schema: locationSchema },
    { id: "academic-info", label: "Academic Info", schema: academicInfoSchema },
    { id: "courses", label: "Courses", schema: coursesSchema },
    { id: "placement", label: "Placement", schema: placementSchema },
    { id: "banking", label: "Banking", schema: bankingSchema },
    { id: "about", label: "About", schema: aboutSchema },
    { id: "documents", label: "Documents", schema: documentSchema }, // Updated schema
    { id: "completion", label: "Review & Complete", schema: null },
  ];

  const user: any = useAuthStore((state) => state.user);

  // Initialize React Hook Form for each step
  const basicInfoForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      collegeName: user?.name || "",
      website: "",
      totalStudents: 0,
      totalCompanies: 0,
      totalJobs: 0,
      oldPassword: "",
    },
    mode: "onChange",
  });
  const locationForm = useForm<z.infer<typeof locationSchema>>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      country: "",
      state: "",
      city: "",
      zipCode: "",
      region: "",
    },
    mode: "onChange",
  });
  const academicInfoForm = useForm<z.infer<typeof academicInfoSchema>>({
    resolver: zodResolver(academicInfoSchema),
    defaultValues: {
      university: "",
      collegeType: "Private",
      yearOfEstablishment: undefined, // ✅ empty by default
    },
    mode: "onChange",
  });
  const coursesForm = useForm<z.infer<typeof coursesSchema>>({
    resolver: zodResolver(coursesSchema),
    defaultValues: {
      coursesOffered: [{ program: "", specializations: [], intakeCapacity: 0 }],
    },
    mode: "onChange",
  });
  const { fields, append, remove, update } = useFieldArray({
    control: coursesForm.control,
    name: "coursesOffered",
  });
  const placementForm = useForm<z.infer<typeof placementSchema>>({
    resolver: zodResolver(
      placementSchema as z.ZodType<{
        placementStatistics?: {
          average?: number;
          highest?: number;
          averagePackage?: number;
        };
        placementOfficer?: {
          name?: string;
          email?: string;
          phone?: string;
        };
        topCompanies?: string[];
      }>
    ),
    defaultValues: {
      placementStatistics: {
        average: 0, // Changed from "" to 0
        highest: 0, // Changed from "" to 0
        averagePackage: 0, // Changed from "" to 0
      },
      placementOfficer: {
        name: "",
        email: "",
        phone: "",
      },
      topCompanies: [],
    },
    mode: "onChange",
  });

  const bankingForm = useForm<z.infer<typeof bankingSchema>>({
    resolver: zodResolver(bankingSchema),
    mode: "onChange",
  });
  const aboutForm = useForm<z.infer<typeof aboutSchema>>({
    resolver: zodResolver(aboutSchema),
    mode: "onChange",
  });

  // New form for documents
  const documentsForm = useForm<z.infer<typeof documentSchema>>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      gstCertificate: { url: "", publicId: "", _id: "", file: undefined },
      affiliationCertificate: {
        url: "",
        publicId: "",
        _id: "",
        file: undefined,
      },
      accreditations: [], // Default to empty array
    },
    mode: "onChange",
  });

  const {
    fields: accreditationFields,
    append: appendAccreditation,
    remove: removeAccreditation,
  } = useFieldArray({
    control: documentsForm.control,
    name: "accreditations",
  });

  const router = useRouter();

  // Populate forms with existing data
  useEffect(() => {
    if (defaultValues && !isDataPopulated) {
      setCollegeData(defaultValues);
      populateFormsWithData(defaultValues);
      setIsDataPopulated(true);
      setFormsInitialized(true);
      setIsLoading(false);
    }
  }, [defaultValues, isDataPopulated]);

  // FIXED: Only reset forms when step changes AND we don't have existing data
  useEffect(() => {
    if (!collegeData || formsInitialized) return;

    switch (currentStep) {
      case 0:
        basicInfoForm.reset({
          collegeName: "",
          website: "",
          totalStudents: 0,
          totalCompanies: 0,
          totalJobs: 0,
          oldPassword: "",
        });
        break;
      case 1:
        locationForm.reset({
          country: "",
          state: "",
          city: "",
          zipCode: "",
          region: "",
        });
        break;
      case 2:
        academicInfoForm.reset({
          university: "",
          collegeType: "Private",
          yearOfEstablishment: undefined, // ✅ empty by default
        });
        break;
      case 3:
        coursesForm.reset({
          coursesOffered: [
            { program: "", specializations: [], intakeCapacity: 0 },
          ],
        });
        break;
      case 4:
        placementForm.reset({
          placementStatistics: { average: 0, highest: 0, averagePackage: 0 },
          placementOfficer: { name: "", email: "", phone: "" },
          topCompanies: [],
        });
        break;
      case 5: // Banking
        bankingForm.reset({
          bankingDetails: {
            panCard: collegeData.bankingDetails?.panCard || "",
            bankName: collegeData.bankingDetails?.bankName || "",
            accountNumber: collegeData.bankingDetails?.accountNumber || "",
            ifscCode: collegeData.bankingDetails?.ifscCode || "",
          },
        });
        break;
      case 6: // About
        aboutForm.reset({
          description: collegeData.description || "",
        });
        break;
      case 7: // Documents
        documentsForm.reset({
          gstCertificate: collegeData.gstCertificate || {
            url: "",
            publicId: "",
            _id: "",
            file: undefined,
          },
          affiliationCertificate: collegeData.affiliationCertificate || {
            url: "",
            publicId: "",
            _id: "",
            file: undefined,
          },
          // Map accreditations to match the frontend schema structure
          accreditations:
            collegeData.accreditations?.map((acc: any) => ({
              body: acc.body || "",
              _id: acc._id,
              accreditationCertificate: acc.accreditationCertificate || {
                url: "",
                publicId: "",
                _id: "",
              },
              file: undefined,
            })) || [],
        });
        break;
    }
  }, [
    currentStep,
    isDataPopulated,
    formsInitialized,
    defaultValues,
    collegeData,
  ]); // Added collegeData dependency

  const populateFormsWithData = (college: any) => {
    if (!college) {
      console.log("❌ No college data to populate");
      return;
    }
    try {
      // Basic Info
      const basicInfoData = {
        collegeName: college.collegeName || "",
        website: college.website || "",
        totalStudents: college.totalStudents
          ? Number(college.totalStudents)
          : 0,
        totalCompanies: college.totalCompanies
          ? Number(college.totalCompanies)
          : 0,
        totalJobs: college.totalJobs ? Number(college.totalJobs) : 0,
        oldPassword: "",
      };
      basicInfoForm.reset(basicInfoData);

      // Location
      const locationData = {
        country: college.country || "",
        state: college.state || "",
        city: college.city || "",
        zipCode: college.zipCode || "",
        region: "",
      };
      locationForm.reset(locationData);

      // Academic Info
      const academicData = {
        university: college.university || "",
        collegeType: college.collegeType || "Private",
        yearOfEstablishment:
          Number(college.yearOfEstablishment) || new Date().getFullYear(),
      };
      academicInfoForm.reset(academicData);

      // Courses - FIXED: Better handling of courses data
      if (
        college.coursesOffered &&
        Array.isArray(college.coursesOffered) &&
        college.coursesOffered.length > 0
      ) {
        const coursesData = {
          coursesOffered: college.coursesOffered.map((course: any) => ({
            program: course.program || "",
            specializations: Array.isArray(course.specializations)
              ? course.specializations
              : [],
            intakeCapacity: Number(course.intakeCapacity) || 0,
          })),
        };

        coursesForm.reset(coursesData);
      } else {
        coursesForm.reset({
          coursesOffered: [
            { program: "", specializations: [], intakeCapacity: 0 },
          ],
        });
      }

      // Placement
      const placementData = {
        placementStatistics: {
          average: college.placementStatistics?.average || "",
          highest: college.placementStatistics?.highest || "",
          averagePackage: college.placementStatistics?.averagePackage || "",
        },
        placementOfficer: {
          name: college.placementOfficer?.name || "",
          email: college.placementOfficer?.email || "",
          phone: college.placementOfficer?.phone || "",
        },
        topCompanies: Array.isArray(college.topCompanies)
          ? college.topCompanies
          : [],
      };
      placementForm.reset(placementData);

      // Banking
      const bankingData = {
        bankingDetails: {
          panCard: college.bankingDetails?.panCard || "",
          bankName: college.bankingDetails?.bankName || "",
          accountNumber: college.bankingDetails?.accountNumber || "",
          ifscCode: college.bankingDetails?.ifscCode || "",
        },
      };
      bankingForm.reset(bankingData);

      // About
      const aboutData = {
        description: college.description || "",
      };
      // Explicitly reset aboutForm with its specific data
      aboutForm.reset({ description: aboutData.description });

      // Documents - UPDATED FOR ACCREDITATIONS
      const documentsData = {
        gstCertificate: college.gstCertificate || {
          url: "",
          publicId: "",
          _id: "",
          file: undefined,
        },
        affiliationCertificate: college.affiliationCertificate || {
          url: "",
          publicId: "",
          _id: "",
          file: undefined,
        },
        accreditations:
          college.accreditations?.map((acc: any) => ({
            body: acc.body || "", // Include 'body' field
            _id: acc._id,
            accreditationCertificate: acc.accreditationCertificate || {
              url: "",
              publicId: "",
              _id: "",
            },
            file: undefined, // Ensure file is undefined for existing
          })) || [],
      };
      documentsForm.reset(documentsData);
    } catch (error) {
      console.error("❌ Error populating forms:", error);
      toast.error("Failed to load existing data");
    }
  };

  // Update local data
  const updateLocalData = (newData: any) => {
    const updatedData = { ...collegeData, ...newData };
    setCollegeData(updatedData);
    if (onProfileUpdate) {
      onProfileUpdate(updatedData);
    }
  };

  // Course management functions
  const addCourse = () => {
    append({ program: "", specializations: [], intakeCapacity: 0 });
  };
  const removeCourse = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };
  const addSpecialization = (courseIndex: number, specialization: string) => {
    const current =
      coursesForm.getValues(`coursesOffered.${courseIndex}.specializations`) ||
      [];
    const updated = [...current, specialization];

    update(courseIndex, {
      ...coursesForm.getValues(`coursesOffered.${courseIndex}`),
      specializations: updated,
    });
  };
  const removeSpecialization = (courseIndex: number, specIndex: number) => {
    const current =
      coursesForm.getValues(`coursesOffered.${courseIndex}.specializations`) ||
      [];
    const updated = current.filter((_, i) => i !== specIndex);

    update(courseIndex, {
      ...coursesForm.getValues(`coursesOffered.${courseIndex}`),
      specializations: updated,
    });
  };

  // Generic API call function for PUT requests
  const callAPI = async (endpoint: string, data: any) => {
    try {
      const token = getCookie("jwt");
      if (!token) {
        throw new Error("Authentication token not found");
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/${endpoint}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        }
      );
      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `Failed to update ${endpoint}`);
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`❌ Error updating ${endpoint}:`, error);
      throw error;
    }
  };

  // Generic file upload function
  const uploadFile = async (file: File, endpoint: string) => {
    if (!file) return null;
    const token = getCookie("jwt");
    if (!token) {
      throw new Error("Authentication token not found");
    }

    // ADD THIS BLOCK FOR FILE SIZE VALIDATION
    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error(
        `File size exceeds the ${MAX_FILE_SIZE_MB}MB limit. Please upload a smaller file.`
      );
      return null; // Prevent upload if file is too large
    }
    // END OF ADDED BLOCK

    const formData = new FormData();
    formData.append("certificate", file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/${endpoint}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(
          errorData.message || `Failed to upload file to ${endpoint}`
        );
      }
      const result = await response.json();
      return result;
    } catch (error) {
      console.error(`❌ Error uploading file to ${endpoint}:`, error);
      throw error;
    }
  };

  // Form submission handlers
  const onSubmitBasicInfo = async (data: z.infer<typeof basicInfoSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await callAPI("update-basic", data);
      if (response.success) {
        toast.success("Basic information saved successfully!");
        handleStepComplete?.(0);
        updateLocalData(data);
      }
    } catch (error) {
      toast.error("Failed to save basic information");
    } finally {
      setIsSubmitting(false);
    }
  };
  const onSubmitLocation = async (data: z.infer<typeof locationSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await callAPI("update-basic", data);
      if (response.success) {
        toast.success("Location information saved successfully!");
        handleStepComplete?.(1);
        updateLocalData(data);
      }
    } catch (error) {
      toast.error("Failed to save location information");
    } finally {
      setIsSubmitting(false);
    }
  };
  const onSubmitAcademicInfo = async (
    data: z.infer<typeof academicInfoSchema>
  ) => {
    setIsSubmitting(true);
    try {
      const response = await callAPI("update-basic", data);
      if (response.success) {
        toast.success("Academic information saved successfully!");
        handleStepComplete?.(2);
        updateLocalData(data);
      }
    } catch (error) {
      toast.error("Failed to save academic information");
    } finally {
      setIsSubmitting(false);
    }
  };
  const onSubmitCourses = async (data: z.infer<typeof coursesSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await callAPI("update-courses", data);
      if (response.success) {
        toast.success("Courses information saved successfully!");
        handleStepComplete?.(3);
        updateLocalData(data);
      }
    } catch (error) {
      toast.error("Failed to save courses information");
    } finally {
      setIsSubmitting(false);
    }
  };
  const onSubmitPlacement = async (data: z.infer<typeof placementSchema>) => {
    setIsSubmitting(true);
    try {
      // Update placement statistics
      if (data.placementStatistics) {
        await callAPI("update-placement-stats", {
          placementStatistics: data.placementStatistics,
        });
      }
      // Update placement officer
      if (data.placementOfficer) {
        await callAPI("update-placement-officer", {
          placementOfficer: data.placementOfficer,
        });
      }
      toast.success("Placement information saved successfully!");
      handleStepComplete?.(4);
      updateLocalData(data);
    } catch (error) {
      toast.error("Failed to save placement information");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitBanking = async (data: z.infer<typeof bankingSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await callAPI("update-banking", data);
      if (response.success) {
        toast.success("Banking information saved successfully!");
        handleStepComplete?.(5);
        updateLocalData(data);
      }
    } catch (error) {
      toast.error("Failed to save banking information");
    } finally {
      setIsSubmitting(false);
    }
  };
  const onSubmitAbout = async (data: z.infer<typeof aboutSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await callAPI("update-basic", data);
      if (response.success) {
        toast.success("About information saved successfully!");
        handleStepComplete?.(6);
        updateLocalData(data);
      }
    } catch (error) {
      toast.error("Failed to save about information");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitDocuments = async (data: z.infer<typeof documentSchema>) => {
    setIsSubmitting(true);
    try {
      let updatedCollegeData = { ...collegeData };

      // 1. Upload GST Certificate
      if (data.gstCertificate?.file) {
        const result = await uploadFile(data.gstCertificate.file, "upload-gst");
        // ADD NULL CHECK HERE
        if (result?.gstCertificate) {
          updatedCollegeData = {
            ...updatedCollegeData,
            gstCertificate: result.gstCertificate,
          };
          documentsForm.setValue(
            "gstCertificate.url",
            result.gstCertificate.url
          );
          documentsForm.setValue(
            "gstCertificate.publicId",
            result.gstCertificate.publicId
          );
          documentsForm.setValue(
            "gstCertificate._id",
            result.gstCertificate._id
          );
          documentsForm.setValue("gstCertificate.file", undefined); // Clear the file input
          toast.success("GST Certificate uploaded successfully!");
        }
      }

      // 2. Upload Affiliation Certificate
      if (data.affiliationCertificate?.file) {
        const result = await uploadFile(
          data.affiliationCertificate.file,
          "upload-affiliation"
        );
        // ADD NULL CHECK HERE
        if (result?.affiliationCertificate) {
          updatedCollegeData = {
            ...updatedCollegeData,
            affiliationCertificate: result.affiliationCertificate,
          };
          documentsForm.setValue(
            "affiliationCertificate.url",
            result.affiliationCertificate.url
          );
          documentsForm.setValue(
            "affiliationCertificate.publicId",
            result.affiliationCertificate.publicId
          );
          documentsForm.setValue(
            "affiliationCertificate._id",
            result.affiliationCertificate._id
          );
          documentsForm.setValue("affiliationCertificate.file", undefined); // Clear the file input
          toast.success("Affiliation Certificate uploaded successfully!");
        }
      }

      // 3. Upload Accreditation Certificates - UPDATED LOGIC
      const newAccreditations: any[] = [];
      for (let i = 0; i < data.accreditations.length; i++) {
        const accreditation = data.accreditations[i];
        if (accreditation.file) {
          // Use the existing _id if available, otherwise it's a new accreditation
          const endpoint = accreditation._id
            ? `upload-accreditation/${accreditation._id}`
            : `upload-accreditation/${i}`; // Fallback to index for new ones
          const result = await uploadFile(accreditation.file, endpoint);

          // ADD NULL CHECK HERE
          if (result?.accreditation) {
            const uploadedAccreditation = result.accreditation;
            newAccreditations.push(uploadedAccreditation);

            // Update the form field with the new URL, publicId, _id
            documentsForm.setValue(
              `accreditations.${i}.accreditationCertificate.url`,
              uploadedAccreditation.accreditationCertificate.url
            );
            documentsForm.setValue(
              `accreditations.${i}.accreditationCertificate.publicId`,
              uploadedAccreditation.accreditationCertificate.publicId
            );
            documentsForm.setValue(
              `accreditations.${i}.accreditationCertificate._id`,
              uploadedAccreditation.accreditationCertificate._id
            );
            documentsForm.setValue(
              `accreditations.${i}.body`,
              uploadedAccreditation.body || "Other"
            ); // Ensure body is set
            documentsForm.setValue(
              `accreditations.${i}._id`,
              uploadedAccreditation._id
            ); // Ensure _id is set
            documentsForm.setValue(`accreditations.${i}.file`, undefined); // Clear the file input
            toast.success(
              `Accreditation Certificate ${i + 1} uploaded successfully!`
            );
          } else {
            // If uploadFile returned null (due to size limit), keep the original accreditation data
            // This ensures that if a user tries to upload a too-large file, the existing data for that accreditation isn't lost.
            newAccreditations.push(accreditation);
          }
        } else {
          // If no new file, keep the existing accreditation data
          newAccreditations.push(accreditation);
        }
      }
      updatedCollegeData = {
        ...updatedCollegeData,
        accreditations: newAccreditations,
      };

      // Update local college data after all uploads
      updateLocalData(updatedCollegeData);
      handleStepComplete?.(7); // Corrected step index for 'Documents'
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast.error("Failed to upload documents. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // NEW: Final submission handler for completion summary
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Check if we have the minimum required data
      const hasBasicInfo = collegeData?.collegeName;
      const hasLocation = collegeData?.country && collegeData?.city;
      const hasAcademic = collegeData?.university;
      if (!hasBasicInfo || !hasLocation || !hasAcademic) {
        toast.error(
          "Please complete at least the basic information, location, and academic details before submitting."
        );
        setIsSubmitting(false);
        return;
      }
      // Mark profile as completed
      const token = getCookie("jwt");
      const completionResponse = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/update-basic`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ completedProfile: true }),
        }
      );
      if (!completionResponse.ok) {
        throw new Error("Failed to mark profile as complete");
      }
      const completionData = await completionResponse.json();

      toast.success("Profile completed successfully!");
      onStepComplete?.(8); // Corrected step index for 'Completion'
      if (onUpdate) {
        await onUpdate({ ...collegeData, completedProfile: true });
      }
      // Add a small delay to ensure backend is updated, then redirect
      setTimeout(() => {
        window.location.href = "/college/profile";
      }, 2000);
    } catch (error) {
      console.error("Error completing profile:", error);
      toast.error("Failed to complete profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStepComplete = (stepIndex: number) => {
    if (!completedStepsState.includes(stepIndex)) {
      setCompletedSteps([...completedStepsState, stepIndex]);
    }
    // Mark this step as completed in the profile data
    const stepNames = [
      "basicInfo",
      "location",
      "academicInfo",
      "courses",
      "placement",
      "banking",
      "about",
      "documents",
      "completion",
    ];
    if (stepIndex < stepNames.length) {
      updateLocalData({ [`${stepNames[stepIndex]}Completed`]: true });
    }
    // Call the parent's onStepComplete to trigger navigation
    if (onStepComplete) {
      onStepComplete(stepIndex);
    }
  };

  const handleNext = () => {
    router.push(`/college/profile/complete?step=${currentStep + 1}`);
  };

  // Handle form submission for current step
  const handleSubmitCurrentStep = async () => {
    try {
      switch (currentStep) {
        case 0:
          await basicInfoForm.handleSubmit(onSubmitBasicInfo)();
          break;
        case 1:
          await locationForm.handleSubmit(onSubmitLocation)();
          break;
        case 2:
          await academicInfoForm.handleSubmit(onSubmitAcademicInfo)();
          break;
        case 3:
          await coursesForm.handleSubmit(onSubmitCourses)();
          break;
        case 4:
          await placementForm.handleSubmit(onSubmitPlacement)();
          break;
        case 5: // Banking
          await bankingForm.handleSubmit(onSubmitBanking)();
          break;
        case 6: // About
          await aboutForm.handleSubmit(onSubmitAbout)();
          break;
        case 7: // Documents
          await documentsForm.handleSubmit(onSubmitDocuments)();
          break;
        case 8: // Completion summary handles its own submission
          break;
        default:
          break;
      }
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  };

  // Debug: Log current form values
  useEffect(() => {
    if (isDataPopulated) {
    }
  }, [
    currentStep,
    isDataPopulated,
    basicInfoForm,
    locationForm,
    academicInfoForm,
    coursesForm,
    placementForm,
    bankingForm,
    aboutForm,
    documentsForm,
  ]);

  const { setValue } = basicInfoForm;
  // 🧠 3. Set value from user context
  useEffect(() => {
    if (user?.name) {
      setValue("collegeName", user.name);
    }
  }, [user, setValue]);

  // Render step content
  const renderStepContent = () => {
    // Show loading if data is being populated
    if (!formsInitialized && defaultValues) {
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#219CAE] mx-auto mb-4" />
            <p className="text-gray-500">Loading form data...</p>
          </div>
        </div>
      );
    }
    switch (currentStep) {
      case 0:
        return (
          <div key="basic-info-step" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Basic Information</h2>
              <p className="text-sm text-gray-500 mt-1">
                Enter your colleges basic information.
              </p>
            </div>
            <Card>
              <CardContent className="p-6">
                <Form {...basicInfoForm} key={`form-basic-${currentStep}`}>
                  <form className="space-y-6 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <FormField
                        control={basicInfoForm.control}
                        name="collegeName"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>College Name *</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                readOnly
                                className="w-full bg-gray-100 cursor-not-allowed"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={basicInfoForm.control}
                        name="website"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Website</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://example.edu"
                                {...field}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={basicInfoForm.control}
                        name="totalStudents"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Total Students</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter total number of students"
                                {...field}
                                value={field.value === 0 ? "" : field.value}
                                onChange={(e) => {
                                  const value =
                                    e.target.value === ""
                                      ? 0
                                      : Number.parseInt(e.target.value, 10);
                                  field.onChange(isNaN(value) ? 0 : value);
                                }}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        );
      case 1:
        return (
          <div key="location-info-step" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Location Information</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add your college location details.
              </p>
            </div>
            <Card>
              <CardContent className="p-6">
                <Form {...locationForm} key={`form-location-${currentStep}`}>
                  <form className="space-y-6 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      {/* Country */}
                      <FormField
                        control={locationForm.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Country *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter country"
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const valid = /^[a-zA-Z0-9\s-]*$/.test(value);
                                  if (valid) field.onChange(value);
                                }}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* State */}
                      <FormField
                        control={locationForm.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>State *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter state"
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const valid = /^[a-zA-Z0-9\s-]*$/.test(value);
                                  if (valid) field.onChange(value);
                                }}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* City */}
                      <FormField
                        control={locationForm.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>City *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter city"
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const valid = /^[a-zA-Z0-9\s-]*$/.test(value);
                                  if (valid) field.onChange(value);
                                }}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Zip Code */}
                      <FormField
                        control={locationForm.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Zip Code *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter zip code"
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const valid = /^[a-zA-Z0-9\s-]*$/.test(value);
                                  if (valid) field.onChange(value);
                                }}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Region */}
                      <FormField
                        control={locationForm.control}
                        name="region"
                        render={({ field }) => (
                          <FormItem className="w-full md:col-span-2">
                            <FormLabel>Region</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter region (optional)"
                                value={field.value}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const valid = /^[a-zA-Z0-9\s-]*$/.test(value);
                                  if (valid) field.onChange(value);
                                }}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Academic Information</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add your college academic details.
              </p>
            </div>
            <Card>
              <CardContent className="p-6">
                <Form
                  {...academicInfoForm}
                  key={`form-academic-${currentStep}`}
                >
                  <form className="space-y-6 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <FormField
                        control={academicInfoForm.control}
                        name="university"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>University *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter university name"
                                {...field}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={academicInfoForm.control}
                        name="collegeType"
                        render={({ field }) => (
                          <FormItem className="!w-full">
                            <FormLabel>College Type *</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="!w-full">
                                  <SelectValue
                                    className="!w-full"
                                    placeholder="Select college type"
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Government">
                                  Government
                                </SelectItem>
                                <SelectItem value="Private">Private</SelectItem>
                                <SelectItem value="Autonomous">
                                  Autonomous
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={academicInfoForm.control}
                        name="yearOfEstablishment"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Year of Establishment</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Enter year"
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  // pass undefined if input is empty so it's optional
                                  field.onChange(raw === "" ? undefined : raw);
                                }}
                                className="w-full"
                                onWheel={(e) => e.preventDefault()}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Courses Offered</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add the courses offered by your college
              </p>
            </div>
            <Card>
              <CardContent className="p-6">
                <Form {...coursesForm} key={`form-courses-${currentStep}`}>
                  <form className="space-y-6">
                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-4 border rounded-lg space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">Course {index + 1}</h3>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeCourse(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={coursesForm.control}
                            name={`coursesOffered.${index}.program`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Program Name*</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Bachelor of Technology"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={coursesForm.control}
                            name={`coursesOffered.${index}.intakeCapacity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Intake Capacity</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="e.g., 60"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) => {
                                      const value =
                                        e.target.value === ""
                                          ? 0
                                          : Number(e.target.value);
                                      field.onChange(value);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Specializations
                          </label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {field.specializations &&
                              field.specializations.length > 0 &&
                              field.specializations.map(
                                (spec: string, specIndex: number) => (
                                  <div
                                    key={specIndex}
                                    className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                                  >
                                    <span>{spec}</span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeSpecialization(index, specIndex)
                                      }
                                      className="text-gray-500 hover:text-red-500"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                )
                              )}
                          </div>
                          <SpecializationInput
                            onAdd={(specialization) =>
                              addSpecialization(index, specialization)
                            }
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addCourse}
                      className="w-full bg-transparent"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Course
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Placement Information</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add placement statistics and officer details
              </p>
            </div>
            <Card>
              <CardContent className="p-6">
                <Form {...placementForm} key={`form-placement-${currentStep}`}>
                  <form className="space-y-6 w-full">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-4">
                          Placement Statistics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={placementForm.control}
                            name="placementStatistics.average"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Average Placement Rate (%)
                                </FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 85" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={placementForm.control}
                            name="placementStatistics.highest"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Highest Package (LPA)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 12" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={placementForm.control}
                            name="placementStatistics.averagePackage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Average Package (LPA)</FormLabel>
                                <FormControl>
                                  <Input placeholder="e.g., 6.5" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-4">
                          Placement Officer
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            control={placementForm.control}
                            name="placementOfficer.name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Officer Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter placement officer name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={placementForm.control}
                            name="placementOfficer.email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Officer Email</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter placement officer email"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={placementForm.control}
                            name="placementOfficer.phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Officer Phone</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter placement officer phone"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Banking Details</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add your college banking information
              </p>
            </div>
            <Card>
              <CardContent className="p-6">
                <Form {...bankingForm} key={`form-banking-${currentStep}`}>
                  <form className="space-y-6 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                      <FormField
                        control={bankingForm.control}
                        name="bankingDetails.panCard"
                        render={({ field }) => {
                          return (
                            <FormItem className="w-full">
                              <FormLabel>PAN Card</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter PAN card number"
                                  {...field}
                                  className="w-full"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={bankingForm.control}
                        name="bankingDetails.bankName"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Bank Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter bank name"
                                {...field}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bankingForm.control}
                        name="bankingDetails.accountNumber"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter account number"
                                {...field}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bankingForm.control}
                        name="bankingDetails.ifscCode"
                        render={({ field }) => (
                          <FormItem className="w-full">
                            <FormLabel>IFSC Code</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter IFSC code"
                                {...field}
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">About College</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add detailed information about your college
              </p>
            </div>
            <Card>
              <CardContent className="p-6">
                <Form {...aboutForm} key={`form-about-${currentStep}`}>
                  <form className="space-y-6 w-full">
                    <div className="grid grid-cols-1 gap-6 w-full">
                      <FormField
                        control={aboutForm.control}
                        name="description"
                        render={({ field }) => {
                          return (
                            <FormItem className="w-full">
                              <FormLabel>College Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Enter a detailed description about your college"
                                  className="min-h-[200px] w-full"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Upload Documents</h2>
              <p className="text-sm text-gray-500 mt-1">
                Upload relevant certificates and documents
              </p>
            </div>
            <Form {...documentsForm} key={`form-documents-${currentStep}`}>
              <form className="space-y-6">
                {/* GST Certificate Section */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-lg font-medium">GST Certificate</h3>
                    <FormField
                      control={documentsForm.control}
                      name="gstCertificate.file"
                      render={({
                        field: { value, onChange, ...fieldProps },
                      }) => (
                        <FormItem>
                          <FormLabel>Upload GST Certificate</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(event) => {
                                  onChange(
                                    event.target.files && event.target.files[0]
                                  );
                                }}
                                className="flex-1"
                                {...fieldProps}
                              />
                              {/* Safely access gstCertificate.url */}
                              {documentsForm.getValues("gstCertificate")
                                ?.url && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      documentsForm.getValues("gstCertificate")
                                        ?.url,
                                      "_blank"
                                    )
                                  }
                                >
                                  View Existing
                                </Button>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                          {/* Safely display gstCertificate.url */}
                          {documentsForm.getValues("gstCertificate")?.url && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              Existing:{" "}
                              <a
                                href={
                                  documentsForm.getValues("gstCertificate")?.url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline truncate"
                              >
                                {documentsForm
                                  .getValues("gstCertificate")
                                  ?.url?.split("/")
                                  .pop()}
                              </a>
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Affiliation Certificate Section */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-lg font-medium">
                      Affiliation Certificate
                    </h3>
                    <FormField
                      control={documentsForm.control}
                      name="affiliationCertificate.file"
                      render={({
                        field: { value, onChange, ...fieldProps },
                      }) => (
                        <FormItem>
                          <FormLabel>Upload Affiliation Certificate</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(event) => {
                                  onChange(
                                    event.target.files && event.target.files[0]
                                  );
                                }}
                                className="flex-1"
                                {...fieldProps}
                              />
                              {/* Safely access affiliationCertificate.url */}
                              {documentsForm.getValues("affiliationCertificate")
                                ?.url && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    window.open(
                                      documentsForm.getValues(
                                        "affiliationCertificate"
                                      )?.url,
                                      "_blank"
                                    )
                                  }
                                >
                                  View Existing
                                </Button>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                          {/* Safely display affiliationCertificate.url */}
                          {documentsForm.getValues("affiliationCertificate")
                            ?.url && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              Existing:{" "}
                              <a
                                href={
                                  documentsForm.getValues(
                                    "affiliationCertificate"
                                  )?.url
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline truncate"
                              >
                                {documentsForm
                                  .getValues("affiliationCertificate")
                                  ?.url?.split("/")
                                  .pop()}
                              </a>
                            </p>
                          )}
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Accreditation Certificates Section */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="text-lg font-medium">
                      Accreditation Certificates
                    </h3>
                    {accreditationFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-4 border rounded-lg space-y-4"
                      >
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">
                            Accreditation {index + 1}
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAccreditation(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                        {/* Added a field for 'body' as per backend response */}
                        <FormField
                          control={documentsForm.control}
                          name={`accreditations.${index}.body`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                Accreditation Body (Optional)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., NAAC, NBA"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={documentsForm.control}
                          name={`accreditations.${index}.file`}
                          render={({
                            field: { value, onChange, ...fieldProps },
                          }) => (
                            <FormItem>
                              <FormLabel>Upload Certificate</FormLabel>
                              <FormControl>
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    onChange={(event) => {
                                      onChange(
                                        event.target.files &&
                                          event.target.files[0]
                                      );
                                    }}
                                    className="flex-1"
                                    {...fieldProps}
                                  />
                                  {/* Safely access nested URL */}
                                  {documentsForm.getValues(
                                    `accreditations.${index}`
                                  )?.accreditationCertificate?.url && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        window.open(
                                          documentsForm.getValues(
                                            `accreditations.${index}`
                                          )?.accreditationCertificate?.url,
                                          "_blank"
                                        )
                                      }
                                    >
                                      View Existing
                                    </Button>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                              {/* Safely display nested URL */}
                              {documentsForm.getValues(
                                `accreditations.${index}`
                              )?.accreditationCertificate?.url && (
                                <p className="text-sm text-gray-500 flex items-center gap-1">
                                  <FileText className="h-4 w-4" />
                                  Existing:{" "}
                                  <a
                                    href={
                                      documentsForm.getValues(
                                        `accreditations.${index}`
                                      )?.accreditationCertificate?.url
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline truncate"
                                  >
                                    {documentsForm
                                      .getValues(`accreditations.${index}`)
                                      ?.accreditationCertificate?.url?.split(
                                        "/"
                                      )
                                      .pop()}
                                  </a>
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        appendAccreditation({
                          body: "", // Default body for new accreditation
                          accreditationCertificate: {
                            url: "",
                            publicId: "",
                            _id: "",
                          },
                          file: undefined,
                        })
                      }
                      className="w-full bg-transparent"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Accreditation
                    </Button>
                  </CardContent>
                </Card>
              </form>
            </Form>
          </div>
        );
      case 8:
        return (
          <CollegeCompletionSummary
            profileData={collegeData}
            onSubmit={handleFinalSubmit}
            isLoading={isSubmitting}
            isEditMode={isEditMode}
          />
        );
      default:
        return <div>Step content for step {currentStep}</div>;
    }
  };
  if (isLoading || externalLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#219CAE] mx-auto mb-4" />
          <p className="text-gray-500">Loading form data...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 pb-10">
      {" "}
      {/* Extra bottom padding */}
      {/* Content Area */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        {renderStepContent()}
      </div>
      {/* Action Buttons */}
      <div className="bg-white border-t border-gray-200 pt-6 mt-6 px-4 md:px-6">
        {" "}
        {/* Horizontal padding added */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
          {/* Previous Button */}
          <Button
            variant="outline"
            onClick={() => {
              if (currentStep > 0) {
                const params = new URLSearchParams();
                params.set("step", steps[currentStep - 1].id);
                router.push(`/college/profile/complete?${params.toString()}`);
              }
            }}
            disabled={currentStep === 0 || isSubmitting}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          {/* Centered Save Button - Hidden on the last step */}
          {currentStep < steps.length - 1 && (
            <Button
              onClick={handleSubmitCurrentStep}
              disabled={isSubmitting}
              className="bg-[#219CAE] hover:bg-[#1a7a8a] text-white px-8"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save & Continue"
              )}
            </Button>
          )}
          {/* Next Button */}
          {currentStep < steps.length - 1 && (
            <Button
              variant="outline"
              onClick={() => {
                const params = new URLSearchParams();
                params.set("step", steps[currentStep + 1].id);
                router.push(`/college/profile/complete?${params.toString()}`);
              }}
              disabled={isSubmitting}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
  // Helper component for specialization input
  function SpecializationInput({
    onAdd,
  }: {
    onAdd: (specialization: string) => void;
  }) {
    const [value, setValue] = useState("");
    const handleAdd = () => {
      if (value.trim()) {
        onAdd(value.trim());
        setValue("");
      }
    };
    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAdd();
      }
    };
    return (
      <div className="flex gap-2">
        <Input
          placeholder="Add specialization"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAdd}
          disabled={!value.trim()}
        >
          Add
        </Button>
      </div>
    );
  }
}
