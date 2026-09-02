"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, File, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUpload, MultiFileUpload } from "@/components/file-upload";
import { toast } from "sonner";
import { getCookie } from "@/utils/getCookie";

const documentsSchema = z.object({
  resume: z.string().optional(),
  markSheets: z.array(z.string()).optional(),
  certificates: z.array(z.string()).optional(),
  bonafideCertificate: z.string().optional(),
});

export type DocumentsFormData = z.infer<typeof documentsSchema>;

interface DocumentsFormProps {
  initialData?: DocumentsFormData;
  onSubmit: (data: DocumentsFormData) => void;
  isLoading: boolean;
}

export default function DocumentsForm({
  initialData,
  onSubmit,
  isLoading,
}: DocumentsFormProps) {
  const [markSheet, setMarkSheet] = useState("");
  const [certificate, setCertificate] = useState("");
  const [activeTab, setActiveTab] = useState("upload");

  // File upload states
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [bonafideFile, setBonafideFile] = useState<File | null>(null);
  const [markSheetFiles, setMarkSheetFiles] = useState<File[]>([]);
  const [certificateFiles, setCertificateFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const form = useForm<DocumentsFormData>({
    resolver: zodResolver(documentsSchema),
    defaultValues: initialData || {
      resume: "",
      markSheets: [],
      certificates: [],
      bonafideCertificate: "",
    },
  });

  async function uploadDocuments(files: {
    resume?: File;
    bonafideCertificate?: File;
    markSheets?: File[];
    certificates?: File[];
  }) {
    const token = getCookie("jwt");
    if (!token) {
      throw new Error("Authentication required");
    }

    const formData = new FormData();

    if (files.resume) {
      formData.append("resume", files.resume);
    }

    if (files.bonafideCertificate) {
      formData.append("bonafideCertificate", files.bonafideCertificate);
    }

    if (files.markSheets && files.markSheets.length > 0) {
      files.markSheets.forEach((file) => {
        formData.append("markSheets", file);
      });
    }

    if (files.certificates && files.certificates.length > 0) {
      files.certificates.forEach((file) => {
        formData.append("certificates", file);
      });
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/upload-documents`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload documents");
      }

      return await response.json();
    } catch (error) {
      console.error("Error uploading documents:", error);
      throw error;
    }
  }

  async function updateDocuments(documentUrls: {
    resume?: string;
    bonafideCertificate?: string;
    markSheets?: string[];
    certificates?: string[];
  }) {
    const token = getCookie("jwt");
    if (!token) {
      throw new Error("Authentication required");
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/update-documents`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ documents: documentUrls }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update documents");
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating documents:", error);
      throw error;
    }
  }

  const handleSubmit = async (data: DocumentsFormData) => {
    if (
      activeTab === "upload" &&
      (resumeFile ||
        bonafideFile ||
        markSheetFiles.length > 0 ||
        certificateFiles.length > 0)
    ) {
      try {
        // Validate resume file type
        if (resumeFile) {
          const allowedResumeTypes = [".pdf", ".doc", ".docx"];
          const fileExt = resumeFile.name.toLowerCase().split(".").pop();
          if (!fileExt || !allowedResumeTypes.includes(`.${fileExt}`)) {
            toast.error("Resume must be a PDF, DOC, or DOCX file");
            return;
          }
        }

        setIsUploading(true);
        setUploadProgress(10);

        // Simulate progress (in a real app, you might use an upload progress event)
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 500);

        const uploadResult = await uploadDocuments({
          resume: resumeFile || undefined,
          bonafideCertificate: bonafideFile || undefined,
          markSheets: markSheetFiles.length > 0 ? markSheetFiles : undefined,
          certificates:
            certificateFiles.length > 0 ? certificateFiles : undefined,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        // Update the form with the new URLs
        // if (uploadResult.documents) {
        //   const updatedData = {
        //     ...data,
        //     ...uploadResult.documents,
        //   };
        //   onSubmit(updatedData);
        // } else {
        //   onSubmit(data);
        // }
        if (uploadResult.documents) {
          const updatedData: DocumentsFormData = {
            resume: uploadResult.documents.resume ?? data.resume,
            bonafideCertificate:
              uploadResult.documents.bonafideCertificate ??
              data.bonafideCertificate,
            markSheets: uploadResult.documents.markSheets ?? data.markSheets,
            certificates:
              uploadResult.documents.certificates ?? data.certificates,
          };

          onSubmit(updatedData);
        } else {
          onSubmit(data);
        }

        toast.success("Documents uploaded successfully");
      } catch (error) {
        setUploadError(
          error instanceof Error ? error.message : "Failed to upload documents"
        );
        toast.error("Failed to upload documents");
      } finally {
        setIsUploading(false);
      }
    } else {
      // Just submit the URLs
      onSubmit(data);
    }
  };

  const addMarkSheet = () => {
    if (markSheet.trim() !== "" && markSheet.startsWith("http")) {
      const currentMarkSheets = form.getValues("markSheets") || [];
      if (!currentMarkSheets.includes(markSheet.trim())) {
        form.setValue("markSheets", [...currentMarkSheets, markSheet.trim()]);
        setMarkSheet("");
      }
    }
  };

  const removeMarkSheet = (url: string) => {
    const currentMarkSheets = form.getValues("markSheets") || [];
    form.setValue(
      "markSheets",
      currentMarkSheets.filter((s) => s !== url)
    );
  };

  const addCertificate = () => {
    if (certificate.trim() !== "" && certificate.startsWith("http")) {
      const currentCertificates = form.getValues("certificates") || [];
      if (!currentCertificates.includes(certificate.trim())) {
        form.setValue("certificates", [
          ...currentCertificates,
          certificate.trim(),
        ]);
        setCertificate("");
      }
    }
  };

  const removeCertificate = (url: string) => {
    const currentCertificates = form.getValues("certificates") || [];
    form.setValue(
      "certificates",
      currentCertificates.filter((s) => s !== url)
    );
  };

  const handleMarkSheetFilesSelect = (files: File[]) => {
    setMarkSheetFiles(files);
  };

  const handleCertificateFilesSelect = (files: File[]) => {
    setCertificateFiles(files);
  };

  const handleRemoveMarkSheetFile = (index: number) => {
    const newFiles = [...markSheetFiles];
    newFiles.splice(index, 1);
    setMarkSheetFiles(newFiles);
  };

  const handleRemoveCertificateFile = (index: number) => {
    const newFiles = [...certificateFiles];
    newFiles.splice(index, 1);
    setCertificateFiles(newFiles);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Documents</h2>
          <p className="text-sm text-gray-500">
            Upload your important documents. These will be used for verification
            and job applications.
          </p>
        </div>

        <div className="w-full space-y-6">
          {/* Resume Upload */}
          <Card>
            <CardContent className="p-6">
              <FormLabel className="block mb-3">Resume/CV</FormLabel>
              <FileUpload
                label="Upload your resume (PDF, DOC, DOCX)"
                accept=".pdf,.doc,.docx"
                onFileSelect={(file) => setResumeFile(file)}
                onRemove={() => setResumeFile(null)}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                previewUrl={initialData?.resume}
                error={uploadError}
              />
              <FormDescription className="mt-2">
                Upload your resume in PDF or Word format.
              </FormDescription>
            </CardContent>
          </Card>

          {/* Mark Sheets Upload */}
          <Card>
            <CardContent className="p-6">
              <FormLabel className="block mb-3">Mark Sheets</FormLabel>
              <MultiFileUpload
                label="Upload Mark Sheets"
                accept=".pdf,.jpg,.jpeg,.png"
                onFilesSelect={handleMarkSheetFilesSelect}
                onRemove={handleRemoveMarkSheetFile}
                maxFiles={5}
                existingFiles={initialData?.markSheets || []}
              />
              <FormDescription className="mt-2">
                Upload up to 5 mark sheets in PDF or image format.
              </FormDescription>
            </CardContent>
          </Card>

          {/* Certificates Upload */}
          <Card>
            <CardContent className="p-6">
              <FormLabel className="block mb-3">Certificates</FormLabel>
              <MultiFileUpload
                label="Upload Certificates"
                accept=".pdf,.jpg,.jpeg,.png"
                onFilesSelect={handleCertificateFilesSelect}
                onRemove={handleRemoveCertificateFile}
                maxFiles={5}
                existingFiles={initialData?.certificates || []}
              />
              <FormDescription className="mt-2">
                Upload up to 5 certificates in PDF or image format.
              </FormDescription>
            </CardContent>
          </Card>

          {/* Bonafide Certificate Upload */}
          <Card>
            <CardContent className="p-6">
              <FormLabel className="block mb-3">
                Bonafide Certificate (Optional)
              </FormLabel>
              <FileUpload
                label="Upload your bonafide certificate"
                accept=".pdf,.jpg,.jpeg,.png"
                onFileSelect={(file) => setBonafideFile(file)}
                onRemove={() => setBonafideFile(null)}
                isUploading={isUploading}
                uploadProgress={uploadProgress}
                previewUrl={initialData?.bonafideCertificate}
              />
              <FormDescription className="mt-2">
                Upload your bonafide certificate if available.
              </FormDescription>
            </CardContent>
          </Card>
        </div>

        <Button
          type="submit"
          className="w-full bg-[#219CAE]"
          disabled={isLoading || isUploading}
        >
          {isLoading || isUploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isUploading ? "Uploading..." : "Saving..."}
            </>
          ) : (
            "Save & Continue"
          )}
        </Button>
      </form>
    </Form>
  );
}
