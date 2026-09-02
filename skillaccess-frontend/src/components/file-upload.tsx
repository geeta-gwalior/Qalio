"use client";

import { useState, useRef, type ChangeEvent } from "react";
import { Upload, X, FileText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onRemove?: () => void;
  accept?: string;
  label: string;
  isUploading?: boolean;
  uploadProgress?: number;
  uploadComplete?: boolean;
  previewUrl?: string;
  error?: string;
}

export function FileUpload({
  onFileSelect,
  onRemove,
  accept = "application/pdf",
  label,
  isUploading = false,
  uploadProgress = 0,
  uploadComplete = false,
  previewUrl,
  error,
}: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      onFileSelect(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onRemove) onRemove();
  };

  const getFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
      />

      {!selectedFile && !previewUrl ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors ${
            error ? "border-red-300" : "border-gray-300"
          }`}
          onClick={handleButtonClick}
        >
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <p className="mt-2 text-sm font-medium">{label}</p>
          <p className="mt-1 text-xs text-gray-500">
            Click to browse or drag and drop
          </p>
          {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-50 p-2 rounded-md">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {selectedFile?.name || previewUrl?.split("/").pop() || "File"}
                </p>
                {selectedFile && (
                  <p className="text-xs text-gray-500">
                    {getFileSize(selectedFile.size)}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {uploadComplete ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : null}
              {!isUploading && !uploadComplete && (
                <button
                  onClick={handleRemove}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {isUploading && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span>Uploading...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-1" />
            </div>
          )}

          {previewUrl && !isUploading && (
            <div className="mt-3">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-500 hover:underline flex items-center"
              >
                <FileText className="h-3 w-3 mr-1" />
                View file
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MultiFileUpload({
  onFilesSelect,
  onRemove,
  accept = "application/pdf",
  label,
  maxFiles = 5,
  existingFiles = [],
}: {
  onFilesSelect: (files: File[]) => void;
  onRemove?: (index: number) => void;
  accept?: string;
  label: string;
  maxFiles?: number;
  existingFiles?: string[];
}) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const totalFiles =
        selectedFiles.length + existingFiles.length + newFiles.length;

      if (totalFiles > maxFiles) {
        alert(`You can only upload up to ${maxFiles} files in total.`);
        return;
      }

      setSelectedFiles([...selectedFiles, ...newFiles]);
      onFilesSelect([...selectedFiles, ...newFiles]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    if (onRemove) onRemove(index);
  };

  const handleRemoveExistingFile = (index: number) => {
    if (onRemove) onRemove(index + selectedFiles.length);
  };

  const getFileSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalFiles = selectedFiles.length + existingFiles.length;

  return (
    <div className="w-full space-y-3">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        multiple
      />

      {totalFiles < maxFiles && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleButtonClick}
        >
          <Upload className="mr-2 h-4 w-4" />
          {label}
        </Button>
      )}

      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Existing Files</p>
          {existingFiles.map((url, index) => (
            <div
              key={`existing-${index}`}
              className="border rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 p-2 rounded-md">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {url.split("/").pop() || `File ${index + 1}`}
                  </p>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-500 hover:underline"
                  >
                    View file
                  </a>
                </div>
              </div>
              <button
                onClick={() => handleRemoveExistingFile(index)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected Files</p>
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="border rounded-lg p-3 flex items-center justify-between"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 p-2 rounded-md">
                  <FileText className="h-4 w-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {getFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleRemoveFile(index)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {totalFiles > 0 && (
        <p className="text-xs text-gray-500">
          {totalFiles} of {maxFiles} files selected
        </p>
      )}
    </div>
  );
}