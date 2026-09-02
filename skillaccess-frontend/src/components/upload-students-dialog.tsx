"use client";
import type React from "react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Progress } from "@/components/ui/progress";
import { getCookie } from "@/utils/getCookie";
import * as XLSX from "xlsx";
import { toast } from "sonner";

// File size formatter function
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
}

interface Student {
  firstName: string;
  lastName: string;
  email: string;
  batch: string;
  approved: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function UploadStudentsDialog({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State to control dialog open/close

  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
    "application/vnd.ms-excel.sheet.macroEnabled.12",
    "application/vnd.ms-excel.template.macroEnabled.12",
    "application/vnd.ms-excel.addin.macroEnabled.12",
    "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    setError(null);
    setValidationErrors([]);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!acceptedTypes.includes(selectedFile.type)) {
      const errorMsg = "Invalid file type. Please upload an Excel file.";
      setError(errorMsg);
      toast.error("Invalid File", {
        description: errorMsg,
      });
      setFile(null);
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      const errorMsg = `File size exceeds the limit of ${
        MAX_FILE_SIZE / (1024 * 1024)
      }MB.`;
      setError(errorMsg);
      toast.error("File Too Large", {
        description: errorMsg,
      });
      setFile(null);
      return;
    }

    setFile(selectedFile);
    processExcelFile(selectedFile);
  };

  const processExcelFile = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        const errorMsg = "The Excel file is empty or has no valid data.";
        setError(errorMsg);
        toast.error("Empty File", {
          description: errorMsg,
        });
        setFile(null);
        return;
      }
      console.log("First row data:", jsonData[0]);

      const errors: string[] = [];
      const formattedStudents: Student[] = jsonData.map(
        (row: any, index: number) => {
          const firstName =
            row.firstName ||
            row.FirstName ||
            row["First Name"] ||
            row["first name"] ||
            row["FIRSTNAME"] ||
            "";
          const lastName =
            row.lastName ||
            row.LastName ||
            row["Last Name"] ||
            row["last name"] ||
            row["LASTNAME"] ||
            "";
          const email = row.email || row.Email || row.EMAIL || "";
          const batch = row.batch || row.Batch || row.BATCH || "";
          const phone =
            row.phone ||
            row.Phone ||
            row.PHONE ||
            row["Phone Number"] ||
            row["phone number"] ||
            "";
          const major =
            row.major ||
            row.Major ||
            row["Major Subject"] ||
            row["major subject"] ||
            "";
          const approved =
            row.approved === true ||
            row.approved === "true" ||
            row.approved === "TRUE" ||
            row.approved === "approved" ||
            row.Approved === true ||
            row.Approved === "true" ||
            row.Approved === "TRUE" ||
            row.Approved === "approved" ||
            false;

          // Validation
          if (!firstName) {
            errors.push(`Row ${index + 1}: Missing First Name`);
          }
          if (!email) {
            errors.push(`Row ${index + 1}: Missing Email`);
          } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              errors.push(`Row ${index + 1}: Invalid email format - ${email}`);
            }
          }
          if (!batch) {
            errors.push(`Row ${index + 1}: Missing Batch`);
          }

          return {
            firstName,
            lastName,
            email,
            batch,
            phone,
            major,
            approved,
          };
        }
      );

      if (errors.length > 0) {
        const displayErrors = errors.slice(0, 5);
        if (errors.length > 5) {
          displayErrors.push(`...and ${errors.length - 5} more errors`);
        }
        setValidationErrors(displayErrors);
        const errorMsg =
          "Some entries are missing required fields or have invalid email formats.";
        setError(errorMsg);
        toast.error("Invalid Data", {
          description: errorMsg,
        });
        return;
      }

      setStudents(formattedStudents);
      toast.success("File Processed", {
        description: `Successfully processed ${formattedStudents.length} student records.`,
      });
    } catch (error) {
      console.error("Error processing Excel file:", error);
      const errorMsg =
        "Failed to process the Excel file. Please check the format.";
      setError(errorMsg);
      toast.error("Processing Error", {
        description: errorMsg,
      });
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file || students.length === 0) return;
    setIsUploading(true);
    setUploadProgress(10);

    try {
      const token = getCookie("jwt");
      if (!token) {
        throw new Error("Authentication token not found");
      }
      setUploadProgress(30);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/upload-students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            students: students,
          }),
        }
      );
      setUploadProgress(90);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to upload students");
      }

      const data = await res.json();
      setUploadProgress(100);

      // Handle duplicate emails
      if (data.allDuplicateEmails && data.allDuplicateEmails.length > 0) {
        const duplicateCount = data.allDuplicateEmails.length;
        const successCount = students.length - duplicateCount;
        if (successCount > 0) {
          toast.success("Partial Upload Success", {
            description: `Successfully uploaded ${successCount} students. ${duplicateCount} students were already registered.`,
          });
        } else {
          toast.error("Upload Failed", {
            description: `All ${duplicateCount} students were already registered.`,
          });
        }
      } else {
        toast.success("Upload Successful", {
          description: `Successfully uploaded and invited ${students.length} students.`,
        });
      }

      setTimeout(() => {
        setIsUploading(false);
        setFile(null);
        setStudents([]);
        setUploadProgress(0);
        setValidationErrors([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onSuccess();
        setIsDialogOpen(false); // Close the dialog after successful upload
      }, 500);
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMsg =
        error.message || "Failed to upload students. Please try again.";
      setError(errorMsg);
      toast.error("Upload Failed", {
        description: errorMsg,
      });
      setIsUploading(false);
      setUploadProgress(0);
    } finally {
      // This block is currently empty.
    }
  };

  const resetUpload = () => {
    setFile(null);
    setStudents([]);
    setError(null);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    // Create a simple Excel template
    const template = [
      {
        FirstName: "Alice",
        LastName: "Smith",
        Email: "alice33.smith@yopmail.com",
        Batch: "2023",
        Approved: "FALSE",
        Phone: "1234567890",
        Major: "B.Tech",
      },
      {
        FirstName: "Bob",
        LastName: "Johnson",
        Email: "bob33.johnson@yopmail.com",
        Batch: "2023",
        Approved: "FALSE",
        Phone: "0987654321",
        Major: "M.Tech",
      },
      {
        FirstName: "Carol",
        LastName: "Lee",
        Email: "carol33.lee@yopmail.com",
        Batch: "2023",
        Approved: "FALSE",
        Phone: "1122334455",
        Major: "M.Tech",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");

    // Generate and download the file
    XLSX.writeFile(wb, "student-upload-template.xlsx");
  };

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button
            className="bg-[#219CAE] hover:bg-[#1b89a4]"
            onClick={() => setIsDialogOpen(true)} // Open the dialog when button is clicked
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Students
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Students</DialogTitle>
            <DialogDescription>
              Upload an Excel file containing student information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!file ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".xls,.xlsx,.xlsm,.xltx,.xltm"
                />
                <FileText className="h-10 w-10 text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 mb-2">
                  Drag and drop or click to upload
                </p>
                <div className="flex flex-col gap-2 items-center">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select File
                  </Button>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="text-[#219CAE]"
                  >
                    Download Template
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Accepts Excel files up to {formatFileSize(MAX_FILE_SIZE)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Required fields: First Name, Email, Batch
                </p>
                {error && (
                  <div className="mt-4 flex flex-col text-red-500 text-sm">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                    {validationErrors.length > 0 && (
                      <div className="mt-2 ml-5 text-xs">
                        <ul className="list-disc pl-4 space-y-1">
                          {validationErrors.map((err, index) => (
                            <li key={index}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {students.length} students
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetUpload}
                    disabled={isUploading}
                  >
                    Remove
                  </Button>
                </div>
                {isUploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-gray-500 text-center">
                      Uploading... {uploadProgress}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={resetUpload}
              disabled={!file || isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!file || isUploading || students.length === 0}
              className="bg-[#219CAE] hover:bg-[#1b89a4]"
            >
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Upload</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to upload {students.length} students? This
              will send invitation emails to all new students. Students who are
              already registered will be skipped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmDialog(false);
                handleUpload();
              }}
              className="bg-[#219CAE] hover:bg-[#1b89a4]"
            >
              Upload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
