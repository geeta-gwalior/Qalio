"use client";

import type React from "react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { getCookie } from "@/utils/getCookie";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useAssessmentForm } from "@/hooks/use-assessment-form";

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

interface BaseQuestion {
  title: string;
  duration: number;
  questionLevel: string;
  totalMarks: number;
  questionTopic?: string; // Optional field for topic name
}

interface MCQQuestion extends BaseQuestion {
  questionType: "mcq" | "mcqmulti";
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctOptions: string;
}

interface CodingQuestion extends BaseQuestion {
  questionType: "coding";
  codeQuestion: string;
  parameters: string;
  returnType: string;
  testCases: string;
}

interface PromptQuestion extends BaseQuestion {
  questionType: "prompt";
  expectedOutputDescription: string;
}

interface PassageQuestion extends BaseQuestion {
  questionType: "findAnswer";
  passage: string;
  // For Excel, we'll store questions as a JSON string
  questionsData: string;
}

type Question = MCQQuestion | CodingQuestion | PromptQuestion | PassageQuestion;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface UploadQuestionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  questionType: string;
  topicId: string;
  topicName: string;
  onSuccess: () => void;
}

export default function UploadQuestionsDialog({
  isOpen,
  onClose,
  questionType,
  topicId,
  topicName,
  onSuccess,
}: UploadQuestionsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { formData } = useAssessmentForm();
  const level = formData.level;

  const acceptedTypes = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
    "application/vnd.ms-excel.sheet.macroEnabled.12",
    "application/vnd.ms-excel.template.macroEnabled.12",
    "application/vnd.ms-excel.addin.macroEnabled.12",
    "application/vnd.ms-excel.sheet.binary.macroEnabled.12",
  ];

  const getQuestionTypeDisplay = (type: string) => {
    switch (type) {
      case "mcq":
        return "MCQ Questions";
      case "mcqmulti":
        return "Multi-MCQ Questions";
      case "findAnswer":
        return "Passage Questions";
      case "coding":
        return "Coding Questions";
      case "prompt":
        return "AI Prompt Questions";
      default:
        return "Questions";
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "mcq":
        return "default";
      case "mcqmulti":
        return "outline";
      case "coding":
        return "secondary";
      case "findAnswer":
        return "destructive";
      case "prompt":
        return "secondary";
      default:
        return "default";
    }
  };

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

      const errors: string[] = [];
      const formattedQuestions = jsonData.map((row: any, index: number) => {
        const title =
          row.title ||
          row.Title ||
          row.TITLE ||
          row.question ||
          row.Question ||
          "";
        const duration = Number(
          row.duration || row.Duration || row.DURATION || 10
        );
        const questionLevel = (
          row.questionLevel ||
          row.QuestionLevel ||
          row.level ||
          row.Level ||
          "beginner"
        ).toLowerCase();
        const totalMarks = Number(
          row.totalMarks || row.TotalMarks || row.marks || row.Marks || 1
        );
        const questionTopic =
          row.questionTopic || row.QuestionTopic;
          // Use provided topic name if available
        if (!questionTopic) {
          errors.push(`Row ${index + 1}: Missing question topic`);
        }

        // Basic validation
        if (!title) {
          errors.push(`Row ${index + 1}: Missing question title`);
        }

        if (isNaN(duration) || duration <= 0) {
          errors.push(`Row ${index + 1}: Invalid duration`);
        }

        if (!["beginner", "intermediate", "advanced"].includes(questionLevel)) {
          errors.push(
            `Row ${
              index + 1
            }: Invalid question level (must be beginner, intermediate, or advanced)`
          );
        }

        // Level validation - check if question level matches the required level
        if (level && questionLevel !== level.toLowerCase()) {
          errors.push(
            `Row ${
              index + 1
            }: Question level "${questionLevel}" does not match required level "${level}". Please change to "${level}" in Excel file.`
          );
        }

        if (isNaN(totalMarks) || totalMarks <= 0) {
          errors.push(`Row ${index + 1}: Invalid total marks`);
        }

        // Rest of the type-specific processing remains the same...
        if (questionType === "mcq" || questionType === "mcqmulti") {
          const option1 =
            row.option1 || row.Option1 || row.optionA || row.OptionA || "";
          const option2 =
            row.option2 || row.Option2 || row.optionB || row.OptionB || "";
          const option3 =
            row.option3 || row.Option3 || row.optionC || row.OptionC || "";
          const option4 =
            row.option4 || row.Option4 || row.optionD || row.OptionD || "";
          const correctOptions =
            row.correctOptions ||
            row.CorrectOptions ||
            row.correct ||
            row.Correct ||
            "";

          if (!option1 || !option2) {
            errors.push(`Row ${index + 1}: Missing required options`);
          }

          if (!correctOptions) {
            errors.push(`Row ${index + 1}: Missing correct options`);
          }

          return {
            title,
            duration,
            questionTopic,
            questionLevel: level || questionLevel, // Use the required level if available
            totalMarks,
            questionType,
            option1,
            option2,
            option3,
            option4,
            correctOptions,
          } as MCQQuestion;
        } else if (questionType === "coding") {
          const codeQuestion =
            row.codeQuestion ||
            row.CodeQuestion ||
            row.description ||
            row.Description ||
            "";
          const parameters =
            row.parameters || row.Parameters || row.params || row.Params || "";
          const returnType =
            row.returnType || row.ReturnType || row.return || row.Return || "";
          const testCases =
            row.testCases || row.TestCases || row.tests || row.Tests || "";

          if (!codeQuestion) {
            errors.push(`Row ${index + 1}: Missing code question description`);
          }

          if (!returnType) {
            errors.push(`Row ${index + 1}: Missing return type`);
          }

          return {
            title,
            duration,
            questionLevel: level || questionLevel, // Use the required level if available
            totalMarks,
            questionType,
            codeQuestion,
            parameters,
            returnType,
            testCases,
          } as CodingQuestion;
        } else if (questionType === "prompt") {
          const expectedOutputDescription =
            row.expectedOutputDescription ||
            row.ExpectedOutputDescription ||
            row.expectedOutput ||
            row.ExpectedOutput ||
            "";

          if (!expectedOutputDescription) {
            errors.push(
              `Row ${index + 1}: Missing expected output description`
            );
          }

          return {
            title,
            duration,
            questionTopic,
            questionLevel: level || questionLevel, // Use the required level if available
            totalMarks,
            questionType,
            expectedOutputDescription,
          } as PromptQuestion;
        } else if (questionType === "findAnswer") {
          const passage = row.passage || row.Passage || row.PASSAGE || "";
          const questionsData =
            row.questionsData ||
            row.QuestionsData ||
            row.questions ||
            row.Questions ||
            "";

          if (!passage) {
            errors.push(`Row ${index + 1}: Missing passage`);
          }

          if (!questionsData) {
            errors.push(`Row ${index + 1}: Missing questions data`);
          }

          return {
            title,
            questionTopic,
            duration,
            questionLevel: level || questionLevel, // Use the required level if available
            totalMarks,
            questionType,
            passage,
            questionsData,
          } as PassageQuestion;
        }

        return {
          title,
          duration,
          questionTopic, // Use provided topic name
          questionLevel: level || questionLevel, // Use the required level if available
          totalMarks,
          questionType,
        } as BaseQuestion;
      });

      if (errors.length > 0) {
        const displayErrors = errors.slice(0, 5);
        if (errors.length > 5) {
          displayErrors.push(`...and ${errors.length - 5} more errors`);
        }

        setValidationErrors(displayErrors);
        const errorMsg = level
          ? `Some questions don't match the required "${level}" difficulty level or have other validation errors.`
          : "Some entries are missing required fields or have invalid data.";
        setError(errorMsg);
        toast.error("Validation Failed", {
          description: errorMsg,
        });
        return;
      }

      const typedQuestions: Question[] = formattedQuestions as Question[];
      setQuestions(typedQuestions);
      toast.success("File Processed", {
        description: `Successfully processed ${
          typedQuestions.length
        } question records${level ? ` for ${level} level` : ""}.`,
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
    if (!file || questions.length === 0) return;

    setIsUploading(true);
    setUploadProgress(10);

    try {
      const token = getCookie("jwt");

      if (!token) {
        throw new Error("Authentication token not found");
      }

      setUploadProgress(30);

      // Format questions to match backend expectations
      const formattedQuestions = questions.map((question) => {
        const baseQuestion = {
          title: question.title,
          duration: question.duration,
          questionLevel: question.questionLevel,
          totalMarks: question.totalMarks,
          questionType: question.questionType,
          questionTopic: question.questionTopic, // Use provided topic name
        };

        // Add type-specific fields
        if (
          question.questionType === "mcq" ||
          question.questionType === "mcqmulti"
        ) {
          const mcqQuestion = question as MCQQuestion;
          let correctOptions: string[] = [];

          if (Array.isArray(mcqQuestion.correctOptions)) {
            correctOptions = mcqQuestion.correctOptions.map(String);
          } else if (typeof mcqQuestion.correctOptions === "string") {
            correctOptions = mcqQuestion.correctOptions
              .split(",")
              .map((v) => v.trim())
              .filter(Boolean);
          } else if (
            typeof mcqQuestion.correctOptions === "number" ||
            !isNaN(Number(mcqQuestion.correctOptions))
          ) {
            correctOptions = [String(mcqQuestion.correctOptions)];
          }

          return {
            ...baseQuestion,
            options: [
              {
                text: mcqQuestion.option1,
                isCorrect: correctOptions.includes("1"),
              },
              {
                text: mcqQuestion.option2,
                isCorrect: correctOptions.includes("2"),
              },
              {
                text: mcqQuestion.option3,
                isCorrect: correctOptions.includes("3"),
              },
              {
                text: mcqQuestion.option4,
                isCorrect: correctOptions.includes("4"),
              },
            ].filter((option) => option.text),
          };
        } else if (question.questionType === "coding") {
          const codingQuestion = question as CodingQuestion;

          // Parse test cases properly
          const testCases = codingQuestion.testCases
            .split(";")
            .map((tc) => {
              const [input, expectedOutput] = tc
                .split("->")
                .map((s) => s.trim());
              return {
                input: input || "",
                expectedOutput: expectedOutput || "",
                isHidden: false,
              };
            })
            .filter((tc) => tc.input && tc.expectedOutput);

          return {
            ...baseQuestion,
            // title is already in baseQuestion - this is the main question title
            codeQuestion: codingQuestion.codeQuestion, // This is the description/problem statement
            parameters: codingQuestion.parameters
              .split(",")
              .map((p) => p.trim())
              .filter((p) => p), // Remove empty parameters
            returnType: codingQuestion.returnType,
            testcase: testCases,
            totalTestCases: testCases.length,
            generatedDriverCode: false,
            code: {
              // Add default code templates for the supported languages
              Cpp: {
                defaultCode:
                  "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Insert your C++ solution code here\n    return 0;\n}",
                solutionCode:
                  "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Solution code here\n    return 0;\n}",
              },
            }, // Default code structure - backend can populate this
          };
        } else if (question.questionType === "prompt") {
          const promptQuestion = question as PromptQuestion;
          return {
            ...baseQuestion,
            expectedOutputDescription: promptQuestion.expectedOutputDescription,
          };
        } else if (question.questionType === "findAnswer") {
          const passageQuestion = question as PassageQuestion;

          // Parse questions data - expecting JSON string format
          let parsedQuestions = [];
          try {
            parsedQuestions = JSON.parse(passageQuestion.questionsData);
          } catch (e) {
            // If not JSON, try to parse as simple format
            parsedQuestions = passageQuestion.questionsData
              .split(";")
              .map((q, index) => ({
                questionText: q.trim(),
                options: [
                  { text: "Option A", isCorrect: false },
                  { text: "Option B", isCorrect: true },
                  { text: "Option C", isCorrect: false },
                ], // Default options - should be provided in Excel
              }))
              .filter((q) => q.questionText);
          }

          return {
            ...baseQuestion,
            passage: passageQuestion.passage,
            questions: parsedQuestions,
          };
        }

        return baseQuestion;
      });

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/question/upload`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questions: formattedQuestions,
            topicId,
          }),
        }
      );

      setUploadProgress(90);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to upload questions");
      }

      const data = await res.json();
      setUploadProgress(100);

      toast.success("Upload Successful", {
        description: `Successfully uploaded ${questions.length} questions to ${topicName}.`,
      });

      setTimeout(() => {
        setIsUploading(false);
        setFile(null);
        setQuestions([]);
        setUploadProgress(0);
        setValidationErrors([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        onSuccess();
        onClose();
      }, 500);
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMsg =
        error.message || "Failed to upload questions. Please try again.";
      setError(errorMsg);
      toast.error("Upload Failed", {
        description: errorMsg,
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setQuestions([]);
    setError(null);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDownloadTemplate = () => {
    sessionStorage.setItem("skipLeaveCheck", "true");

    let template: any[] = [];
    const exampleLevel = level || "beginner"; // Use the required level or default to beginner

    if (questionType === "mcq" || questionType === "mcqmulti") {
      template = [
        {
          Title: "What is the capital of France?",
          questionTopic: "Geography",
          Duration: 5,
          QuestionLevel: exampleLevel,
          TotalMarks: 1,
          Option1: "London",
          Option2: "Berlin",
          Option3: "Paris",
          Option4: "Madrid",
          CorrectOptions: questionType === "mcq" ? "3" : "1,3",
        },
        {
          Title: "Which programming languages are used for web development?",
          questionTopic: "Programming",
          Duration: 3,
          QuestionLevel: exampleLevel,
          TotalMarks: 2,
          Option1: "Python",
          Option2: "JavaScript",
          Option3: "C++",
          Option4: "HTML/CSS",
          CorrectOptions: questionType === "mcq" ? "2" : "2,4",
        },
      ];
    } else if (questionType === "coding") {
      template = [
        {
          Title: "Two Sum Problem",
          questionTopic: "Arrays",
          Duration: 30,
          QuestionLevel: exampleLevel,
          TotalMarks: 10,
          CodeQuestion:
            "Given an array of integers and a target sum, return indices of two numbers that add up to the target.",
          Parameters: "nums, target",
          ReturnType: "int[]",
          TestCases:
            "[2,7,11,15], target=9 -> [0,1]; [3,2,4], target=6 -> [1,2]",
        },
        {
          Title: "Reverse String",
          questionTopic: "Strings",
          Duration: 15,
          QuestionLevel: exampleLevel,
          TotalMarks: 5,
          CodeQuestion: "Write a function that reverses a string.",
          Parameters: "s",
          ReturnType: "string",
          TestCases: "hello -> olleh; world -> dlrow",
        },
      ];
    } else if (questionType === "prompt") {
      template = [
        {
          Title: "Explain the water cycle",
          questionTopic: "Prompt",
          Duration: 20,
          QuestionLevel: exampleLevel,
          TotalMarks: 15,
          ExpectedOutputDescription:
            "Should cover evaporation, condensation, precipitation, and collection. Must explain the role of the sun as the energy source and describe how water moves through different states.",
        },
        {
          Title: "Describe photosynthesis",
          questionTopic: "Prompt",
          Duration: 25,
          QuestionLevel: exampleLevel,
          TotalMarks: 20,
          ExpectedOutputDescription:
            "Should explain the process of photosynthesis, including light and dark reactions, chlorophyll's role, and the chemical equation. Must mention glucose production and oxygen release.",
        },
      ];
    } else if (questionType === "findAnswer") {
      template = [
        {
          Title: "Reading Comprehension - Climate Change",
          questionTopic: "Find Answer",
          Duration: 15,
          QuestionLevel: exampleLevel,
          TotalMarks: 10,
          Passage:
            "Climate change refers to long-term shifts in global temperatures and weather patterns. While climate variations are natural, scientific evidence shows that human activities have been the main driver since the 1800s.",
          QuestionsData: JSON.stringify([
            {
              questionText: "What is climate change?",
              options: [
                { text: "A short-term weather pattern", isCorrect: false },
                {
                  text: "A long-term shift in climate patterns",
                  isCorrect: true,
                },
                { text: "A new government policy", isCorrect: false },
              ],
            },
            {
              questionText: "What are the main causes?",
              options: [
                { text: "Natural volcanic eruptions only", isCorrect: false },
                {
                  text: "Human activities like burning fossil fuels",
                  isCorrect: true,
                },
                { text: "Solar flares", isCorrect: false },
              ],
            },
          ]),
        },
      ];
    }

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");

    // Generate and download the file
    XLSX.writeFile(
      wb,
      `${questionType}-questions-${exampleLevel}-template.xlsx`
    );
    setTimeout(() => {
      sessionStorage.removeItem("skipLeaveCheck");
    }, 100); // 100ms is enough to let the guard skip once
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <DialogTitle>Upload Questions via Excel</DialogTitle>
              <Badge
                variant={getBadgeVariant(questionType) as any}
                className="text-xs"
              >
                {getQuestionTypeDisplay(questionType)}
              </Badge>
            </div>
            <DialogDescription>
              Upload an Excel file containing{" "}
              {getQuestionTypeDisplay(questionType).toLowerCase()} for{" "}
              {topicName}.
              {level && (
                <span className="block mt-1 text-sm font-medium text-[#219CAE]">
                  Required difficulty level: {level}
                </span>
              )}
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
                    className="text-[#219CAE] flex items-center gap-1"
                  >
                    <Download className="h-3 w-3" />
                    Download Template
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Accepts Excel files up to {formatFileSize(MAX_FILE_SIZE)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Required fields: Title, Duration, Question Level
                  {level ? ` (must be "${level}")` : ""}, Total Marks
                </p>
                <p className="mt-1 text-xs text-red-500">
                  Note: Duration is in minutes.
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
                        {formatFileSize(file.size)} • {questions.length}{" "}
                        questions
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
            <Button variant="outline" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={() => setShowConfirmDialog(true)}
              disabled={!file || isUploading || questions.length === 0}
              className="bg-[#219CAE] hover:bg-[#1a7d8b]"
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
              Are you sure you want to upload {questions.length}{" "}
              {getQuestionTypeDisplay(questionType).toLowerCase()} to &quot;
              {topicName}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmDialog(false);
                handleUpload();
              }}
              className="bg-[#219CAE] hover:bg-[#1a7d8b]"
            >
              Upload
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
