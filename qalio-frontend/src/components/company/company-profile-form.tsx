"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  FormDescription,
} from "@/components/ui/form";
import { Loader2, Upload, ChevronLeft, Check } from "lucide-react";
import { getCookie } from "@/utils/getCookie";
import { toast } from "sonner";
import axios from "axios";
import {
  basicInfoSchema,
  officialInfoSchema,
  contactPersonSchema,
  locationSchema,
  jobDetailsSchema,
  companyPoliciesSchema,
  aboutSchema,
} from "@/app/(authenticated)/company/profile/data/data";
import { useAuthStore } from "@/stores/auth-store";

interface CompanyProfileFormProps {
  defaultValues?: any;
  onUpdate?: () => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  isEditMode?: boolean;
}

const MAX_COVER_PHOTO_SIZE_MB = 5; // Max size for cover photo in MB
const MAX_COVER_PHOTO_SIZE_BYTES = MAX_COVER_PHOTO_SIZE_MB * 1024 * 1024; // Convert to bytes

export default function CompanyProfileForm({
  defaultValues,
  onUpdate,
  onCancel,
  isLoading: externalLoading = false,
  isEditMode = true,
}: CompanyProfileFormProps) {
  const authStore = useAuthStore();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyData, setCompanyData] = useState<any>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [apiBaseUrl, setApiBaseUrl] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // File states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<string[]>([]);
  const [jobRoleInput, setJobRoleInput] = useState("");

  // Step configuration
  const steps = [
    { id: "basic-info", label: "Basic Info", schema: basicInfoSchema },
    { id: "official-info", label: "Official Info", schema: officialInfoSchema },
    {
      id: "contact-person",
      label: "Contact Person",
      schema: contactPersonSchema,
    },
    { id: "location", label: "Location", schema: locationSchema },
    { id: "job-details", label: "Job Details", schema: jobDetailsSchema },
    {
      id: "company-policies",
      label: "Company Policies",
      schema: companyPoliciesSchema,
    },
    { id: "about", label: "About", schema: aboutSchema },
    // { id: "documents", label: "Documents", schema: null },
  ];

  // Initialize API base URL
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_QALIO_BACKEND_URL || "";
    setApiBaseUrl(url);
    console.log("API Base URL:", url);
  }, []);

  // Initialize React Hook Form for each tab
  const basicInfoForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      companyName: "",
      website: "",
      corporateEmail: "",
      totalEmployees: 0, // or some default number
      yearFounded: "",
      sector: "",
      industry: "",
      alternatePhone: "",
      hqCity: "",
      annualRevenue: undefined, // or 0 if you prefer
    },
  });
  const officialInfoForm = useForm<z.infer<typeof officialInfoSchema>>({
    resolver: zodResolver(officialInfoSchema),
    defaultValues: {
      companyType: "",
      gstNumber: "",
      udyamRegistrationNumber: "",
      industryType: "",
      yearOfEstablishment: "",
    },
  });
  const contactPersonForm = useForm<z.infer<typeof contactPersonSchema>>({
    resolver: zodResolver(contactPersonSchema),
    defaultValues: {
      name: "",
      designation: "",
      email: "",
      phone: 0,
    },
  });
  const locationForm = useForm<z.infer<typeof locationSchema>>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      locName: "",
      address: "",
      town: "",
      state: "",
      country: "",
      postalCode: "",
    },
  });
  const jobDetailsForm = useForm<z.infer<typeof jobDetailsSchema>>({
    resolver: zodResolver(jobDetailsSchema),
    defaultValues: {
      primaryJobRoles: [],
      numberOfOpenPositions: "",
      expectedSalaryRange: "",
    },
  });
  const companyPoliciesForm = useForm<z.infer<typeof companyPoliciesSchema>>({
    resolver: zodResolver(companyPoliciesSchema),
    defaultValues: {
      internshipStipendPolicy: "",
      workFromHomePolicy: "",
      diversityInclusionInitiatives: "",
    },
  });
  const aboutForm = useForm<z.infer<typeof aboutSchema>>({
    resolver: zodResolver(aboutSchema),
    defaultValues: {
      description: "",
      missions: "",
      programs: "",
    },
  });

  // Fetch company profile data on component mount
  useEffect(() => {
    if (defaultValues) {
      setCompanyData(defaultValues);
      populateFormsWithData(defaultValues);
      setIsLoading(false);
    } else {
      fetchCompanyProfile();
    }
  }, [defaultValues]);

  const populateFormsWithData = (company: any) => {
    const completed: number[] = [];
    if (company.basic) {
      basicInfoForm.reset({
        companyName: company.basic.companyName || "",
        website: company.basic.website || "",
        corporateEmail: company.basic.corporateEmail || "",
        totalEmployees: Number(company.basic.totalEmployees) || 0,
        yearFounded: company.basic.yearFounded?.toString() || "",
        sector: company.basic.sector || "",
        industry: company.basic.industry || "",
        alternatePhone: company.basic.alternatePhone?.toString() || "",
        hqCity: company.basic.hqCity || "",
        annualRevenue: company.basic.annualRevenue,
      });
      if (company.basic.logo) {
        setLogoPreview(company.basic.logo);
      }
      if (company.basic.coverPhoto) {
        setCoverPreview(company.basic.coverPhoto);
      }
      completed.push(0);
    }
    if (company.officialInformation) {
      officialInfoForm.reset({
        companyType: company.officialInformation.companyType || "",
        gstNumber: company.officialInformation.gstNumber || "",
        udyamRegistrationNumber:
          company.officialInformation.udyamRegistrationNumber || "",
        industryType: company.officialInformation.industryType || "",
        yearOfEstablishment:
          company.officialInformation.yearOfEstablishment?.toString() || "",
      });
      completed.push(1);
    }
    if (company.contactPerson) {
      contactPersonForm.reset({
        name: company.contactPerson.name || "",
        designation: company.contactPerson.designation || "",
        email: company.contactPerson.email || "",
        phone: company.contactPerson.phone || 0,
      });
      completed.push(2);
    }
    if (company.location) {
      locationForm.reset({
        locName: company.location.locName || "",
        address: company.location.address || "",
        town: company.location.town || "",
        state: company.location.state || "",
        country: company.location.country || "",
        postalCode: company.location.postalCode || "",
      });
      completed.push(3);
    }
    if (company.jobDetails) {
      jobDetailsForm.reset({
        primaryJobRoles: company.jobDetails.primaryJobRoles || [],
        numberOfOpenPositions:
          company.jobDetails.numberOfOpenPositions?.toString() || "",
        expectedSalaryRange: company.jobDetails.expectedSalaryRange || "",
      });
      setJobRoleInput((company.jobDetails.primaryJobRoles || []).join(", "));
      completed.push(4);
    }
    if (company.companyPolicies) {
      companyPoliciesForm.reset({
        internshipStipendPolicy:
          company.companyPolicies.internshipStipendPolicy || "",
        workFromHomePolicy: company.companyPolicies.workFromHomePolicy || "",
        diversityInclusionInitiatives:
          company.companyPolicies.diversityInclusionInitiatives || "",
      });
      completed.push(5);
    }
    if (company.about) {
      aboutForm.reset({
        description: company.about.description || "",
        missions: company.about.missions || "",
        programs: company.about.programs || "",
      });
      completed.push(6);
    }
    if (company.documents) {
      const documentUrls = Object.values(company.documents) as string[];
      setDocumentPreviews(documentUrls);
      completed.push(7);
    }
    setCompletedSteps(completed);
  };

  const fetchCompanyProfile = async () => {
    try {
      const token = getCookie("jwt");
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        setIsLoading(false);
        return;
      }
      const response = await axios.get(`${apiBaseUrl}/company/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.data.success) {
        const company = response.data.company;
        setCompanyData(company);
        populateFormsWithData(company);
      }
    } catch (error) {
      console.log("Error fetching company profile:", error);
      toast.error("Failed to load company profile");
    } finally {
      setIsLoading(false);
    }
  };

  // File handling functions
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size
      if (file.size > MAX_COVER_PHOTO_SIZE_BYTES) {
        toast.error(
          `Cover photo is too large. Max size is ${MAX_COVER_PHOTO_SIZE_MB}MB.`
        );
        // Clear the file input and preview
        e.target.value = ""; // Clear the selected file
        setCoverFile(null);
        setCoverPreview(null);
        return;
      }

      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    } else {
      // If no file is selected (e.g., user cancels file selection)
      setCoverFile(null);
      setCoverPreview(null);
    }
  };

  // const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files && e.target.files.length > 0) {
  //     const newFiles = Array.from(e.target.files);
  //     setDocuments((prev) => [...prev, ...newFiles]);
  //     const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
  //     setDocumentPreviews((prev) => [...prev, ...newPreviews]);
  //   }
  // };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
    setDocumentPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Navigation functions
  const goToNextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
      window.scrollTo(0, 0);
    }
  };

  const goToPreviousStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 0 && step < steps.length) {
      setActiveStep(step);
      window.scrollTo(0, 0);
    }
  };

  // Show success popup
  const showSuccessNotification = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessPopup(true);
    setTimeout(() => {
      setShowSuccessPopup(false);
    }, 3000);
  };

  // Handle profile completion
  const handleProfileCompletion = async () => {
    setIsSubmitting(true);
    try {
      const token = getCookie("jwt");
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        return;
      }
      const response = await axios.put(
        `${apiBaseUrl}/company/profile/complete`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.data.success) {
        showSuccessNotification("Profile completed successfully!");
        // Dispatch an event to notify the layout that the profile has been updated
        window.dispatchEvent(new CustomEvent("company-profile-updated"));
        if (onUpdate) {
          await onUpdate(); // This will trigger the parent to close the form
        }
      } else {
        toast.error(response.data.message || "Failed to complete profile");
      }
    } catch (error: any) {
      console.log("Error completing profile:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to complete profile";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generic API submission handler
  const submitFormData = async (
    endpoint: string,
    data: any,
    contentType = "application/json"
  ) => {
    const token = getCookie("jwt");
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return null;
    }
    try {
      const fullUrl = `${apiBaseUrl}${endpoint}`; // Construct the full URL
      console.log(`Submitting to ${fullUrl}:`, data); // Log the full URL
      const response = await axios({
        method: "put",
        url: fullUrl, // Use the full URL here
        data: data,
        headers: {
          "Content-Type": contentType,
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(`Response from ${fullUrl}:`, response); // Log the full URL
      return response;
    } catch (error: any) {
      console.log(`Error submitting to ${endpoint}:`, error);
      const errorMessage =
        error.response?.data?.message || `Failed to submit data to ${endpoint}`;
      toast.error(errorMessage);
      return null;
    }
  };

  // Form submission handlers
  const onSubmitBasicInfo = async (data: z.infer<typeof basicInfoSchema>) => {
    setIsSubmitting(true);
    try {
      // Only include fields that have changed
      const formData = new FormData();
      const initialData = companyData?.basic || {};
      let hasChanges = false;
      // Check each field for changes
      Object.entries(data).forEach(([key, value]) => {
        const stringValue = value ? value.toString() : "";
        const initialValue = initialData[key]
          ? initialData[key].toString()
          : "";
        if (stringValue !== initialValue) {
          formData.append(key, stringValue);
          hasChanges = true;
        }
      });
      // Add files if they exist (files always count as changes)
      if (logoFile) {
        formData.append("logo", logoFile);
        hasChanges = true;
      }
      if (coverFile) {
        formData.append("coverPhoto", coverFile);
        hasChanges = true;
      }
      // If nothing has changed, don't make the API call
      if (!hasChanges) {
        toast.success("No changes to save");
        goToNextStep();
        return;
      }
      // Send data to API
      const response = await submitFormData(
        "/company/profile/basic",
        formData,
        "multipart/form-data"
      );
      if (response && response.data.success) {
        showSuccessNotification("Basic information saved successfully!");
        setCompletedSteps((prev) => Array.from(new Set([...prev, 0])));
        // Update the company data with the new values
        const updatedCompanyData = {
          ...companyData,
          basic: {
            ...companyData?.basic,
            ...data,
            logo:
              response.data.company?.basic?.logo || companyData?.basic?.logo,
            coverPhoto:
              response.data.company?.basic?.coverPhoto ||
              companyData?.basic?.coverPhoto,
          },
        };
        setCompanyData(updatedCompanyData);
        populateFormsWithData(updatedCompanyData); // Re-populate all forms with latest data
        // Dispatch an event to notify the layout that the profile has been updated
        window.dispatchEvent(
          new CustomEvent("company-profile-updated", {
            detail: {
              type: "basic",
              data: {
                ...data,
                logo:
                  response.data.company?.basic?.logo ||
                  companyData?.basic?.logo,
                coverPhoto:
                  response.data.company?.basic?.coverPhoto ||
                  companyData?.basic?.coverPhoto,
              },
            },
          })
        );
        goToNextStep();
      } else {
        toast.error("Failed to save basic information");
      }
    } catch (error: any) {
      console.log("Error saving basic info:", error);
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while saving your information";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitOfficialInfo = async (
    data: z.infer<typeof officialInfoSchema>
  ) => {
    setIsSubmitting(true);
    try {
      // Only include fields that have changed
      const initialData = companyData?.officialInformation || {};
      const updateData: Record<string, any> = {};
      let hasChanges = false;
      // Check each field for changes
      Object.entries(data).forEach(([key, value]) => {
        const stringValue = value ? value.toString() : "";
        const initialValue = initialData[key]
          ? initialData[key].toString()
          : "";
        if (stringValue !== initialValue) {
          updateData[key] =
            key === "yearOfEstablishment" && value ? Number(value) : value;
          hasChanges = true;
        }
      });
      // If nothing has changed, don't make the API call
      if (!hasChanges) {
        toast.success("No changes to save");
        goToNextStep();
        return;
      }
      const response = await submitFormData(
        "/company/profile/official",
        updateData
      );
      if (response && response.data.success) {
        showSuccessNotification("Official information saved successfully!");
        setCompletedSteps((prev) => Array.from(new Set([...prev, 1])));
        // Update the company data with the new values
        const updatedCompanyData = {
          ...companyData,
          officialInformation: {
            ...companyData?.officialInformation,
            ...updateData,
          },
        };
        setCompanyData(updatedCompanyData);
        populateFormsWithData(updatedCompanyData); // Re-populate all forms with latest data
        goToNextStep();
      } else {
        toast.error("Failed to save official information");
      }
    } catch (error: any) {
      console.log("Error saving official info:", error);
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while saving your information";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitContactPerson = async (
    data: z.infer<typeof contactPersonSchema>
  ) => {
    setIsSubmitting(true);
    try {
      // Only include fields that have changed
      const initialData = companyData?.contactPerson || {};
      const updateData: Record<string, any> = {};
      let hasChanges = false;
      // Check each field for changes
      Object.entries(data).forEach(([key, value]) => {
        const stringValue = value ? value.toString() : "";
        const initialValue = initialData[key]
          ? initialData[key].toString()
          : "";
        if (stringValue !== initialValue) {
          updateData[key] = value;
          hasChanges = true;
        }
      });
      // If nothing has changed, don't make the API call
      if (!hasChanges) {
        toast.success("No changes to save");
        goToNextStep();
        return;
      }
      const response = await submitFormData(
        "/company/profile/contact-person",
        updateData
      );
      if (response && response.data.success) {
        showSuccessNotification(
          "Contact person information saved successfully!"
        );
        setCompletedSteps((prev) => Array.from(new Set([...prev, 2])));
        // Update the company data with the new values
        const updatedCompanyData = {
          ...companyData,
          contactPerson: {
            ...companyData?.contactPerson,
            ...updateData,
          },
        };
        setCompanyData(updatedCompanyData);
        populateFormsWithData(updatedCompanyData); // Re-populate all forms with latest data
        goToNextStep();
      } else {
        toast.error("Failed to save contact person information");
      }
    } catch (error: any) {
      console.log("Error saving contact person info:", error);
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while saving your information";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitLocation = async (data: z.infer<typeof locationSchema>) => {
    setIsSubmitting(true);
    try {
      // Only include fields that have changed
      const initialData = companyData?.location || {};
      const updateData: Record<string, any> = {};
      let hasChanges = false;
      // Check each field for changes
      Object.entries(data).forEach(([key, value]) => {
        const stringValue = value ? value.toString() : "";
        const initialValue = initialData[key]
          ? initialData[key].toString()
          : "";
        if (stringValue !== initialValue) {
          updateData[key] = value;
          hasChanges = true;
        }
      });
      // If nothing has changed, don't make the API call
      if (!hasChanges) {
        toast.success("No changes to save");
        goToNextStep();
        return;
      }
      const response = await submitFormData(
        "/company/profile/location",
        updateData
      );
      if (response && response.data.success) {
        showSuccessNotification("Location information saved successfully!");
        setCompletedSteps((prev) => Array.from(new Set([...prev, 3])));
        // Update the company data with the new values
        const updatedCompanyData = {
          ...companyData,
          location: {
            ...companyData?.location,
            ...updateData,
          },
        };
        setCompanyData(updatedCompanyData);
        populateFormsWithData(updatedCompanyData); // Re-populate all forms with latest data
        goToNextStep();
      } else {
        toast.error("Failed to save location information");
      }
    } catch (error: any) {
      console.log("Error saving location info:", error);
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while saving your information";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitJobDetails = async (data: z.infer<typeof jobDetailsSchema>) => {
    setIsSubmitting(true);
    try {
      // Ensure primaryJobRoles is an array
      const jobRoles = Array.isArray(data.primaryJobRoles)
        ? data.primaryJobRoles
        : typeof data.primaryJobRoles === "string"
        ? (data.primaryJobRoles as string)
            .split(",")
            .map((role: string) => role.trim())
            .filter(Boolean)
        : [];
      // Only include fields that have changed
      const initialData = companyData?.jobDetails || {};
      const updateData: Record<string, any> = {};
      let hasChanges = false;
      // Check primaryJobRoles for changes
      const initialRoles = initialData.primaryJobRoles || [];
      if (JSON.stringify(jobRoles) !== JSON.stringify(initialRoles)) {
        updateData.primaryJobRoles = jobRoles;
        hasChanges = true;
      }
      // Check other fields for changes
      if (
        data.numberOfOpenPositions?.toString() !==
        initialData.numberOfOpenPositions?.toString()
      ) {
        updateData.numberOfOpenPositions = data.numberOfOpenPositions;
        hasChanges = true;
      }
      if (data.expectedSalaryRange !== initialData.expectedSalaryRange) {
        updateData.expectedSalaryRange = data.expectedSalaryRange;
        hasChanges = true;
      }
      // If nothing has changed, don't make the API call
      if (!hasChanges) {
        toast.success("No changes to save");
        goToNextStep();
        return;
      }
      const response = await submitFormData(
        "/company/profile/job-details",
        updateData
      );
      if (response && response.data.success) {
        showSuccessNotification("Job details saved successfully!");
        setCompletedSteps((prev) => Array.from(new Set([...prev, 4])));
        // Update the company data with the new values
        const updatedCompanyData = {
          ...companyData,
          jobDetails: {
            ...companyData?.jobDetails,
            ...updateData,
          },
        };
        setCompanyData(updatedCompanyData);
        populateFormsWithData(updatedCompanyData); // Re-populate all forms with latest data
        goToNextStep();
      } else {
        toast.error("Failed to save job details");
      }
    } catch (error: any) {
      console.log("Error saving job details:", error);
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while saving your information";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitCompanyPolicies = async (
    data: z.infer<typeof companyPoliciesSchema>
  ) => {
    setIsSubmitting(true);
    try {
      // Only include fields that have changed
      const initialData = companyData?.companyPolicies || {};
      const updateData: Record<string, any> = {};
      let hasChanges = false;
      // Check each field for changes
      Object.entries(data).forEach(([key, value]) => {
        const stringValue = value ? value.toString() : "";
        const initialValue = initialData[key]
          ? initialData[key].toString()
          : "";
        if (stringValue !== initialValue) {
          updateData[key] = value;
          hasChanges = true;
        }
      });
      // If nothing has changed, don't make the API call
      if (!hasChanges) {
        toast.success("No changes to save");
        goToNextStep();
        return;
      }
      const response = await submitFormData(
        "/company/profile/policies",
        updateData
      );
      if (response && response.data.success) {
        showSuccessNotification("Company policies saved successfully!");
        setCompletedSteps((prev) => Array.from(new Set([...prev, 5])));
        // Update the company data with the new values
        const updatedCompanyData = {
          ...companyData,
          companyPolicies: {
            ...companyData?.companyPolicies,
            ...updateData,
          },
        };
        setCompanyData(updatedCompanyData);
        populateFormsWithData(updatedCompanyData); // Re-populate all forms with latest data
        goToNextStep();
      } else {
        toast.error("Failed to save company policies");
      }
    } catch (error: any) {
      console.log("Error saving company policies:", error);
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while saving your information";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmitAbout = async (data: z.infer<typeof aboutSchema>) => {
    setIsSubmitting(true);
    try {
      // Only include fields that have changed
      const initialData = companyData?.about || {};
      const updateData: Record<string, any> = {};
      let hasChanges = false;
      // Check each field for changes
      Object.entries(data).forEach(([key, value]) => {
        const stringValue = value ? value.toString() : "";
        const initialValue = initialData[key]
          ? initialData[key].toString()
          : "";
        if (stringValue !== initialValue) {
          updateData[key] = value;
          hasChanges = true;
        }
      });
      // If nothing has changed, don't make the API call
      if (!hasChanges) {
        toast.success("No changes to save");
        // No need to call onUpdate here, as handleProfileCompletion will handle it
        return;
      }
      const response = await submitFormData(
        "/company/profile/about",
        updateData
      );
      if (response && response.data.success) {
        showSuccessNotification(
          "Company about information saved successfully!"
        );
        setCompletedSteps((prev) => Array.from(new Set([...prev, 6])));
        // Update the company data with the new values
        const updatedCompanyData = {
          ...companyData,
          about: {
            ...companyData?.about,
            ...updateData,
          },
        };
        setCompanyData(updatedCompanyData);
        populateFormsWithData(updatedCompanyData); // Re-populate all forms with latest data
        // No longer calling onUpdate here, it will be called by handleProfileCompletion
        // if this is the last step and the "Save & Complete" button is pressed.
        goToNextStep();
      } else {
        toast.error("Failed to save about information");
      }
    } catch (error: any) {
      console.log("Error saving about info:", error);
      const errorMessage =
        error.response?.data?.message ||
        "An error occurred while saving your information";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  // const onSubmitDocuments = async () => {
  //   if (documents.length === 0) {
  //     handleProfileCompletion();
  //     return;
  //   }
  //   setIsSubmitting(true);
  //   try {
  //     const formData = new FormData();
  //     documents.forEach((doc) => {
  //       formData.append(`documents`, doc);
  //     });
  //     const response = await submitFormData(
  //       "/company/profile/documents",
  //       formData,
  //       "multipart/form-data"
  //     );
  //     if (response && response.data.success) {
  //       showSuccessNotification("Documents uploaded successfully!");
  //       setCompletedSteps((prev) => Array.from(new Set([...prev, 7])));
  //       // Update the company data with the new values
  //       if (response.data.company?.documents) {
  //         const updatedCompanyData = {
  //           ...companyData,
  //           documents: response.data.company.documents,
  //         };
  //         setCompanyData(updatedCompanyData);
  //         populateFormsWithData(updatedCompanyData); // Re-populate all forms with latest data
  //       }
  //       handleProfileCompletion();
  //     } else {
  //       toast.error("Failed to upload documents");
  //     }
  //   } catch (error: any) {
  //     console.log("Error uploading documents:", error);
  //     const errorMessage =
  //       error.response?.data?.message ||
  //       "An error occurred while uploading documents";
  //     toast.error(errorMessage);
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };
  if (isLoading || externalLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#219CAE]" />
      </div>
    );
  }
  // Render the current step form
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Form {...basicInfoForm} key={activeStep}>
            <form
              onSubmit={basicInfoForm.handleSubmit(
                onSubmitBasicInfo,
                (errors) => {
                  console.log("Basic Info Form Validation Errors:", errors);
                  if (Object.keys(errors).length > 0) {
                    // Only show toast if there are actual errors
                    toast.error("Oops! Something’s missing in Basic Info.");
                  }
                }
              )}
              className="space-y-6 w-full"
            >
              <div className="grid grid-cols-1 gap-6 w-full">
                {/* Cover Photo Upload */}
                <div className="space-y-2 w-full">
                  <Label>Cover Photo</Label>
                  <div className="flex items-center gap-4 w-full">
                    <div className="w-36 h-24 border rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                      {coverPreview ? (
                        <img
                          src={coverPreview || "/placeholder.svg"}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Upload className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <Input
                        id="coverPhoto"
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="border-gray-300 focus:border-[#219CAE] focus:ring-[#219CAE] w-full"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended size: 1200x300px. Max size:{" "}
                        {MAX_COVER_PHOTO_SIZE_MB}MB
                      </p>
                    </div>
                  </div>
                </div>
                {/* Company Name */}
                <FormField
                  control={basicInfoForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Company Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter company name"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Website */}
                <FormField
                  control={basicInfoForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Corporate Email */}
                <FormField
                  control={basicInfoForm.control}
                  name="corporateEmail"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Corporate Email *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="contact@company.com"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Alternate Phone */}
                <FormField
                  control={basicInfoForm.control}
                  name="alternatePhone"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Alternate Phone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+1234567890"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Total Employees */}
                <FormField
                  control={basicInfoForm.control}
                  name="totalEmployees"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Total Employees *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter total employees"
                          value={field.value === 0 ? "0" : field.value ?? ""} // handle 0 correctly
                          onChange={(e) => {
                            const value = e.target.value;
                            field.onChange(value === "" ? null : Number(value)); // allow empty
                          }}
                          onWheel={(e) => e.currentTarget.blur()} // prevent scroll
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Year Founded */}
                <FormField
                  control={basicInfoForm.control}
                  name="yearFounded"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Year Founded *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1900"
                          max={new Date().getFullYear()}
                          placeholder="e.g. 2010"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* HQ City */}
                <FormField
                  control={basicInfoForm.control}
                  name="hqCity"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Headquarters City</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. New York"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Sector */}
                <FormField
                  control={basicInfoForm.control}
                  name="sector"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Sector *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select sector" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Manufacturing">
                            Manufacturing
                          </SelectItem>
                          <SelectItem value="Retail">Retail</SelectItem>
                          <SelectItem value="Services">Services</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Industry */}
                <FormField
                  control={basicInfoForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Industry *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select industry" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Software">Software</SelectItem>
                          <SelectItem value="IT Services">
                            IT Services
                          </SelectItem>
                          <SelectItem value="Banking">Banking</SelectItem>
                          <SelectItem value="Insurance">Insurance</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Pharmaceuticals">
                            Pharmaceuticals
                          </SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="E-commerce">E-commerce</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Annual Revenue */}
                <FormField
                  control={basicInfoForm.control}
                  name="annualRevenue"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Annual Revenue (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Enter revenue in Crores"
                          value={field.value ?? ""} // 👈 Prevent undefined
                          onChange={(e) => {
                            const inputVal = e.target.value;
                            field.onChange(
                              inputVal === "" ? null : Number(inputVal)
                            );
                          }}
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        );
      case 1:
        return (
          <Form {...officialInfoForm} key={activeStep}>
            <form
              onSubmit={officialInfoForm.handleSubmit(
                onSubmitOfficialInfo,
                (errors) => {
                  toast.error("Official Info Form Validation Errors:" + errors);
                  if (Object.keys(errors).length > 0) {
                    // Only show toast if there are actual errors
                    toast.error("Oops! Something’s missing in Official Info.");
                  }
                }
              )}
              className="space-y-6 w-full"
            >
              <div className="grid grid-cols-1 gap-6 w-full">
                {/* Company Type */}
                <FormField
                  control={officialInfoForm.control}
                  name="companyType"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Company Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Public Limited">
                            Public Limited
                          </SelectItem>
                          <SelectItem value="Private Limited">
                            Private Limited
                          </SelectItem>
                          <SelectItem value="Partnership">
                            Partnership
                          </SelectItem>
                          <SelectItem value="Sole Proprietorship">
                            Sole Proprietorship
                          </SelectItem>
                          <SelectItem value="LLP">LLP</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* GST Number */}
                <FormField
                  control={officialInfoForm.control}
                  name="gstNumber"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>GST Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter GST number"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Udyam Registration Number */}
                <FormField
                  control={officialInfoForm.control}
                  name="udyamRegistrationNumber"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>
                        Udyam Registration Number (Optional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Udyam registration number"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Industry Type */}
                <FormField
                  control={officialInfoForm.control}
                  name="industryType"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Industry Type *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select industry type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Manufacturing">
                            Manufacturing
                          </SelectItem>
                          <SelectItem value="Service">Service</SelectItem>
                          <SelectItem value="Trading">Trading</SelectItem>
                          <SelectItem value="IT/ITES">IT/ITES</SelectItem>
                          <SelectItem value="FMCG">FMCG</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Year of Establishment */}
                <FormField
                  control={officialInfoForm.control}
                  name="yearOfEstablishment"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Year of Establishment *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1900"
                          max={new Date().getFullYear()}
                          placeholder="e.g. 2010"
                          {...field}
                          className="w-full"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        );
      case 2:
        return (
          <Form {...contactPersonForm} key={activeStep}>
            <form
              onSubmit={contactPersonForm.handleSubmit(
                onSubmitContactPerson,
                (errors) => {
                  console.log("Contact Person Form Validation Errors:", errors);
                  if (Object.keys(errors).length > 0) {
                    // Only show toast if there are actual errors
                    toast.error("Oops! Something’s missing in Contact Person.");
                  }
                }
              )}
              className="space-y-6 w-full"
            >
              <div className="grid grid-cols-1 gap-6 w-full">
                {/* Name */}
                <FormField
                  control={contactPersonForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Contact Person Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Designation */}
                <FormField
                  control={contactPersonForm.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Designation *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="HR Manager"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Email */}
                <FormField
                  control={contactPersonForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="john.doe@company.com"
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Phone */}
                <FormField
                  control={contactPersonForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Phone *</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+1234567890"
                          value={field.value || ""}
                          onChange={(e) => {
                            const numericValue = Number(
                              e.target.value.replace(/\D/g, "")
                            );
                            field.onChange(
                              isNaN(numericValue) ? 0 : numericValue
                            );
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
        );
      case 3:
        return (
          <Form {...locationForm} key={activeStep}>
            <form
              onSubmit={locationForm.handleSubmit(
                onSubmitLocation,
                (errors) => {
                  console.log("Location Form Validation Errors:", errors);
                  if (Object.keys(errors).length > 0) {
                    // Only show toast if there are actual errors
                    toast.error("Oops! Something’s missing in Location.");
                  }
                }
              )}
              className="space-y-6 w-full"
            >
              <div className="grid grid-cols-1 gap-6 w-full">
                {/* Location Name */}
                <FormField
                  control={locationForm.control}
                  name="locName"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Location Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Headquarters, Branch Office, etc."
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Address */}
                <FormField
                  control={locationForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Address *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Street address"
                          className="min-h-[80px] w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Town/City */}
                <FormField
                  control={locationForm.control}
                  name="town"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Town/City *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter town or city"
                          {...field}
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
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          {...field}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Postal Code */}
                <FormField
                  control={locationForm.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Postal Code *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter postal code"
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
        );
      case 4:
        return (
          <Form {...jobDetailsForm} key={activeStep}>
            <form
              onSubmit={jobDetailsForm.handleSubmit(
                onSubmitJobDetails,
                (errors) => {
                  console.log("Job Details Form Validation Errors:", errors);
                  if (Object.keys(errors).length > 0) {
                    // Only show toast if there are actual errors
                    toast.error("Oops! Something’s missing in Job Details.");
                  }
                }
              )}
              className="space-y-6 w-full"
            >
              <div className="grid grid-cols-1 gap-6 w-full">
                {/* Primary Job Roles */}
                <FormField
                  control={jobDetailsForm.control}
                  name="primaryJobRoles"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Primary Job Roles *</FormLabel>
                      <FormDescription>
                        Enter multiple job roles separated by commas, e.g.,
                        Designer, Developer, Tester.
                      </FormDescription>
                      <FormControl>
                        <Textarea
                          placeholder="E.g., Software Engineer, Data Analyst"
                          className="min-h-[80px] w-full"
                          value={jobRoleInput}
                          onChange={(e) => {
                            setJobRoleInput(e.target.value); // ab freely type kar sakte ho
                          }}
                          onBlur={() => {
                            const roles = jobRoleInput
                              .split(",")
                              .map((role) => role.trim())
                              .filter(Boolean); // empty hatao
                            field.onChange(roles); // array set karo form mein
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Number of Open Positions */}
                <FormField
                  control={jobDetailsForm.control}
                  name="numberOfOpenPositions"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Number of Open Positions *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          placeholder="Enter number of open positions"
                          {...field}
                          className="w-full"
                          onWheel={(e) => e.currentTarget.blur()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Expected Salary Range */}
                <FormField
                  control={jobDetailsForm.control}
                  name="expectedSalaryRange"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Expected Salary Range *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="E.g., $50,000 - $80,000 per year"
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
        );
      case 5:
        return (
          <Form {...companyPoliciesForm} key={activeStep}>
            <form
              onSubmit={companyPoliciesForm.handleSubmit(
                onSubmitCompanyPolicies,
                (errors) => {
                  console.log(
                    "Company Policies Form Validation Errors:",
                    errors
                  );
                  if (Object.keys(errors).length > 0) {
                    // Only show toast if there are actual errors
                    toast.error(
                      "Oops! Something’s missing in Company Policies."
                    );
                  }
                }
              )}
              className="space-y-6 w-full"
            >
              <div className="grid grid-cols-1 gap-6 w-full">
                {/* Internship Stipend Policy */}
                <FormField
                  control={companyPoliciesForm.control}
                  name="internshipStipendPolicy"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Internship Stipend Policy *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select policy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Unpaid">Unpaid</SelectItem>
                          <SelectItem value="Depends on Role">
                            Depends on Role
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Work From Home Policy */}
                <FormField
                  control={companyPoliciesForm.control}
                  name="workFromHomePolicy"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Work From Home Policy *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select policy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Fully Remote">
                            Fully Remote
                          </SelectItem>
                          <SelectItem value="Hybrid">Hybrid</SelectItem>
                          <SelectItem value="Onsite">Onsite</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Diversity & Inclusion Initiatives */}
                <FormField
                  control={companyPoliciesForm.control}
                  name="diversityInclusionInitiatives"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Diversity & Inclusion Initiatives *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your company's diversity and inclusion initiatives"
                          className="min-h-[120px] w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a comprehensive description of your company, its
                        history, and what it does.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        );
      case 6:
        return (
          <Form {...aboutForm} key={activeStep}>
            <form
              onSubmit={aboutForm.handleSubmit(onSubmitAbout, (errors) => {
                console.log("About Form Validation Errors:", errors);
                if (Object.keys(errors).length > 0) {
                  // Only show toast if there are actual errors
                  toast.error("Oops! Something’s missing in About.");
                }
              })}
              className="space-y-6 w-full"
            >
              <div className="grid grid-cols-1 gap-6 w-full">
                {/* Description */}
                <FormField
                  control={aboutForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Company Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your company in detail"
                          className="min-h-[150px] w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a comprehensive description of your company, its
                        history, and what it does.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Missions */}
                <FormField
                  control={aboutForm.control}
                  name="missions"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Mission & Vision *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Your company's mission and vision statements"
                          className="min-h-[100px] w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        State your companys mission, vision, and purpose.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Programs */}
                <FormField
                  control={aboutForm.control}
                  name="programs"
                  render={({ field }) => (
                    <FormItem className="w-full">
                      <FormLabel>Programs & Initiatives (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Special programs or initiatives your company runs"
                          className="min-h-[100px] w-full"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Describe any special programs, CSR initiatives, or other
                        activities your company is involved in.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        );
      // case 7:
      //   return (
      //     <div className="space-y-6 w-full">
      //       <div>
      //         <h3 className="text-lg font-medium">Company Documents</h3>
      //         <p className="text-sm text-gray-500">
      //           Upload important company documents such as certifications,
      //           licenses, or brochures.
      //         </p>
      //       </div>
      //       <div className="border rounded-lg p-4 w-full">
      //         <div className="flex items-center justify-center w-full">
      //           <label
      //             htmlFor="document-upload"
      //             className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
      //           >
      //             <div className="flex flex-col items-center justify-center pt-5 pb-6">
      //               <Upload className="w-8 h-8 mb-2 text-gray-500" />
      //               <p className="mb-2 text-sm text-gray-500">
      //                 <span className="font-semibold">Click to upload</span> or
      //                 drag and drop
      //               </p>
      //               <p className="text-xs text-gray-500">
      //                 PDF, DOC, DOCX, XLS, XLSX (MAX. 10MB)
      //               </p>
      //             </div>
      //             <Input
      //               id="document-upload"
      //               type="file"
      //               accept=".pdf,.doc,.docx,.xls,.xlsx"
      //               className="hidden"
      //               onChange={handleDocumentUpload}
      //               multiple
      //             />
      //           </label>
      //         </div>
      //       </div>
      //       {/* Document Previews */}
      //       {documentPreviews.length > 0 && (
      //         <div className="space-y-4 w-full">
      //           <h4 className="text-sm font-medium">Uploaded Documents</h4>
      //           <div className="grid grid-cols-1 gap-4 w-full">
      //             {documentPreviews.map((preview, index) => (
      //               <div
      //                 key={index}
      //                 className="flex items-center justify-between p-3 border rounded-lg w-full"
      //               >
      //                 <div className="flex items-center space-x-3">
      //                   <div className="p-2 bg-gray-100 rounded-md">
      //                     <svg
      //                       className="w-6 h-6 text-gray-500"
      //                       fill="none"
      //                       stroke="currentColor"
      //                       viewBox="0 0 24 24"
      //                       xmlns="http://www.w3.org/2000/svg"
      //                     >
      //                       <path
      //                         strokeLinecap="round"
      //                         strokeLinejoin="round"
      //                         strokeWidth={2}
      //                         d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      //                       />
      //                     </svg>
      //                   </div>
      //                   <div>
      //                     <p className="text-sm font-medium truncate max-w-[200px]">
      //                       {documents[index]?.name || `Document ${index + 1}`}
      //                     </p>
      //                     <p className="text-xs text-gray-500">
      //                       {documents[index]?.size
      //                         ? `${Math.round(documents[index].size / 1024)} KB`
      //                         : ""}
      //                     </p>
      //                   </div>
      //                 </div>
      //                 <Button
      //                   type="button"
      //                   variant="ghost"
      //                   size="sm"
      //                   onClick={() => removeDocument(index)}
      //                   className="text-red-500 hover:text-red-700 hover:bg-red-50"
      //                 >
      //                   <X className="h-4 w-4" />
      //                 </Button>
      //               </div>
      //             ))}
      //           </div>
      //         </div>
      //       )}
      //     </div>
      //   );
      default:
        return null;
    }
  };
  // Handle form submission for the current step
  const handleSubmitCurrentStep = async () => {
    setIsSubmitting(true);
    try {
      if (activeStep === steps.length - 1) {
        // If it's the last step, first submit the 'About' form data
        await aboutForm.handleSubmit(onSubmitAbout, (errors) => {
          console.log(
            "About Form Validation Errors (from handleSubmitCurrentStep):",
            errors
          );
          if (Object.keys(errors).length > 0) {
            toast.error("Oops! Something’s missing in About.");
          }
        })();
        // Then, if the 'About' submission was successful (or no changes),
        // proceed to mark the profile as complete.
        // Note: onSubmitAbout now no longer calls onUpdate directly.
        // handleProfileCompletion will call onUpdate.
        await handleProfileCompletion();
      } else {
        // For all other steps, proceed as before
        switch (activeStep) {
          case 0:
            await basicInfoForm.handleSubmit(onSubmitBasicInfo, (errors) => {
              console.log(
                "Basic Info Form Validation Errors (from handleSubmitCurrentStep):",
                errors
              );
              if (Object.keys(errors).length > 0) {
                toast.error("Oops! Something’s missing in Basic Info.");
              }
            })();
            break;
          case 1:
            await officialInfoForm.handleSubmit(
              onSubmitOfficialInfo,
              (errors) => {
                console.log(
                  "Official Info Form Validation Errors (from handleSubmitCurrentStep):",
                  errors
                );
                if (Object.keys(errors).length > 0) {
                  toast.error("Oops! Something’s missing in Official Info.");
                }
              }
            )();
            break;
          case 2:
            await contactPersonForm.handleSubmit(
              onSubmitContactPerson,
              (errors) => {
                console.log(
                  "Contact Person Form Validation Errors (from handleSubmitCurrentStep):",
                  errors
                );
                if (Object.keys(errors).length > 0) {
                  toast.error("Oops! Something’s missing in Contact Person.");
                }
              }
            )();
            break;
          case 3:
            await locationForm.handleSubmit(onSubmitLocation, (errors) => {
              console.log(
                "Location Form Validation Errors (from handleSubmitCurrentStep):",
                errors
              );
              if (Object.keys(errors).length > 0) {
                toast.error("Oops! Something’s missing in Location.");
              }
            })();
            break;
          case 4:
            await jobDetailsForm.handleSubmit(onSubmitJobDetails, (errors) => {
              console.log(
                "Job Details Form Validation Errors (from handleSubmitCurrentStep):",
                errors
              );
              if (Object.keys(errors).length > 0) {
                toast.error("Oops! Something’s missing in Job Details.");
              }
            })();
            break;
          case 5:
            await companyPoliciesForm.handleSubmit(
              onSubmitCompanyPolicies,
              (errors) => {
                console.log(
                  "Company Policies Form Validation Errors (from handleSubmitCurrentStep):",
                  errors
                );
                if (Object.keys(errors).length > 0) {
                  toast.error("Oops! Something’s missing in Company Policies.");
                }
              }
            )();
            break;
          case 6:
            // This case is now handled by the if (activeStep === steps.length - 1) block above
            break;
          // case 7:
          //   await onSubmitDocuments();
          //   break;
          default:
            break;
        }
      }
    } catch (error) {
      console.log(
        "An unexpected error occurred during form submission:",
        error
      );
      toast.error("An unexpected error occurred during form submission.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="font-jost">
      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded flex items-center shadow-lg">
          <Check className="h-5 w-5 mr-2" />
          <span>{successMessage}</span>
        </div>
      )}
      {/* Header */}
      <div className="bg-gradient-to-r from-[#219CAE] to-[#19b8d0] text-white p-6 rounded-lg mb-6">
        <h1 className="text-2xl font-bold">Edit Your Profile</h1>
        <p className="text-sm mt-1">
          Update your profile information to keep it current
        </p>
        {/* Progress bar */}
        <div className="w-full bg-white/30 rounded-full h-2 mt-4">
          <div
            className="bg-white h-2 rounded-full"
            style={{
              width: `${(completedSteps.length / steps.length) * 100}%`,
            }}
          />
        </div>
      </div>
      {/* Tab Navigation */}
      <div className="flex overflow-x-auto mb-6 border-b">
        {steps.map((step, index) => (
          <button
            key={step.id}
            onClick={() => goToStep(index)}
            className={`px-4 py-2 flex items-center whitespace-nowrap ${
              activeStep === index
                ? "border-b-2 border-[#219CAE] text-[#219CAE] font-medium"
                : completedSteps.includes(index)
                ? "text-gray-700"
                : "text-gray-500"
            }`}
          >
            {completedSteps.includes(index) && (
              <Check className="w-4 h-4 mr-1 text-green-500" />
            )}
            {step.label}
          </button>
        ))}
      </div>
      {/* Content Area */}
      <div className="bg-white rounded-lg p-6 shadow-sm mb-6">
        {renderStepContent()}
      </div>
      {/* Action Buttons */}
      <div className="bg-white rounded-lg p-4 shadow-sm flex justify-end gap-4">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="outline"
            className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 bg-transparent"
          >
            Cancel
          </Button>
        )}
        {activeStep > 0 && (
          <Button
            onClick={goToPreviousStep}
            disabled={isSubmitting}
            variant="outline"
            className="border-[#219CAE] text-[#219CAE] bg-transparent"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
        )}
        <Button
          onClick={handleSubmitCurrentStep}
          disabled={isSubmitting}
          className="bg-[#219CAE] hover:bg-[#1a7a8a] text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : activeStep === steps.length - 1 ? (
            "Save & Complete"
          ) : (
            "Save & Continue"
          )}
        </Button>
      </div>
    </div>
  );
}
