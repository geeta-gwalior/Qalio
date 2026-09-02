"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getCookie } from "@/utils/getCookie";
import { toast } from "sonner";
import { useAssessmentForm } from "@/hooks/use-assessment-form";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface AIUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  questionType: string;
  topicId: string;
  topicName: string;
  onSuccess: () => void;
}

export default function AIUploadDialog({
  isOpen,
  onClose,
  questionType,
  topicId,
  topicName,
  onSuccess,
}: AIUploadDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    count: 1,
    totalMarks: 10,
    duration: 15,
    words: 125,
    subquestions: 5,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { formData: assessmentFormData } = useAssessmentForm();
  const level = assessmentFormData.level || "intermediate";

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

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.subject.trim()) {
      newErrors.subject = "Subject is required";
    }

    if (formData.count < 1 || formData.count > 50) {
      newErrors.count = "Count must be between 1 and 50";
    }

    if (formData.totalMarks < 1 || formData.totalMarks > 100) {
      newErrors.totalMarks = "Total marks must be between 1 and 100";
    }

    if (formData.duration < 1 || formData.duration > 180) {
      newErrors.duration = "Duration must be between 1 and 180 minutes";
    }

    if (questionType === "findAnswer") {
      if (formData.words < 50 || formData.words > 1000) {
        newErrors.words = "Words must be between 50 and 1000";
      }

      if (formData.subquestions < 1 || formData.subquestions > 20) {
        newErrors.subquestions = "Sub-questions must be between 1 and 20";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Better number input handler
  const handleNumberInputChange = (field: string, value: string) => {
    // Allow empty string for better UX when user is typing
    if (value === "") {
      setFormData((prev) => ({
        ...prev,
        [field]: "" as any, // Temporarily allow empty string
      }));
      return;
    }

    // Parse the number and update if valid
    const numValue = Number.parseInt(value, 10);
    if (!isNaN(numValue)) {
      setFormData((prev) => ({
        ...prev,
        [field]: numValue,
      }));
    }

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Handle blur to ensure we have valid numbers
  const handleNumberInputBlur = (
    field: string,
    min: number,
    defaultValue: number
  ) => {
    const currentValue = formData[field as keyof typeof formData];

    // If empty or invalid, set to default
    if (
      currentValue === "" ||
      currentValue === null ||
      currentValue === undefined ||
      isNaN(Number(currentValue))
    ) {
      setFormData((prev) => ({
        ...prev,
        [field]: defaultValue,
      }));
    } else if (Number(currentValue) < min) {
      // If below minimum, set to minimum
      setFormData((prev) => ({
        ...prev,
        [field]: min,
      }));
    }
  };

  const handleSubmit = async () => {
    // Ensure all number fields have valid values before validation
    const updatedFormData = {
      ...formData,
      count: formData.count ?? 1,
      totalMarks: formData.totalMarks ?? 10,
      duration: formData.duration ?? 15,
      words: formData.words ?? 125,
      subquestions: formData.subquestions ?? 5,
    };

    setFormData(updatedFormData);

    if (!validateForm()) {
      toast.error("Validation Error", {
        description: "Please fill the details properly before submitting",
        //  position: "top-center",
      });
      return;
    }

    setIsGenerating(true);

    const token = getCookie("jwt");
    if (!token) {
      toast.error("Authentication Error", {
        description: "Authentication token not found",
        position: "top-center",
      });
      setIsGenerating(false);
      return;
    }

    const requestData = {
      topic: topicId,
      topicId: topicId,
      subject: updatedFormData.subject.trim(),
      level: level,
      type: questionType,
      count: updatedFormData.count,
      totalMarks: updatedFormData.totalMarks,
      duration: updatedFormData.duration,
      ...(questionType === "findAnswer" && {
        words: updatedFormData.words,
        subquestions: updatedFormData.subquestions,
      }),
    };

    try {
      await toast.promise(
        fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/ai/upload-ai`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(requestData),
          }
        ).then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.message ||
                "Failed to generate questions. Try again later."
            );
          }
          return response.json();
        }),
        {
          loading: (
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 animate-spin text-[#219CAE]" />
              <span className="font-medium">
                Generating {updatedFormData.count}{" "}
                {getQuestionTypeDisplay(questionType).toLowerCase()}...
              </span>
            </div>
          ),
          success: (data: any) => {
            // Handle success actions here
            setFormData({
              subject: "",
              count: 1,
              totalMarks: 10,
              duration: 15,
              words: 125,
              subquestions: 5,
            });

            onSuccess();
            onClose();

            return (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="font-medium">
                    Questions Generated Successfully!
                  </span>
                </div>
                <div className="text-sm">
                  {data.length || updatedFormData.count}{" "}
                  {getQuestionTypeDisplay(questionType).toLowerCase()} generated
                  for {level} level and added to {topicName}.
                </div>
              </div>
            );
          },
          error: (error: Error) => (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="font-medium">Generation Failed</span>
              </div>
              <div className="text-sm">
                {error.message ||
                  "Failed to generate questions. Please try again."}
              </div>
            </div>
          ),
          duration: 5000,
        }
      );
    } catch (error) {
      console.error("AI generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    if (!isGenerating) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl font-semibold">
              Generate Questions with AI
            </DialogTitle>
            <Badge
              variant={getBadgeVariant(questionType) as any}
              className="text-xs"
            >
              {getQuestionTypeDisplay(questionType)}
            </Badge>
          </div>
          <DialogDescription>
            Use AI to generate{" "}
            {getQuestionTypeDisplay(questionType).toLowerCase()} for {topicName}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 relative">
          {/* Subject Field */}
          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">
              Subject <span className="text-red-500">*</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle></HelpCircle>
                </TooltipTrigger>
                <TooltipContent
                  className="bg-[#219CAE]  max-w-[300px] p-3"
                  side="right"
                  align="start"
                  sideOffset={5}
                  avoidCollisions={true}
                  collisionPadding={10}
                >
                  <p className="text-white overflow-x-auto text-wrap">
                    Subject can be used to specify what kind of question you
                    want as a prompt to our AI. For example: Questions on AI and
                    its advantages in modern world.{" "}
                  </p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="subject"
              placeholder="e.g., Trigonometry, Data Structures, etc."
              value={formData.subject}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              className={errors.subject ? "border-red-500" : ""}
              disabled={isGenerating}
            />
            {errors.subject && (
              <div className="flex items-center gap-1 text-red-500 text-xs">
                <AlertTriangle className="h-3 w-3" />
                {errors.subject}
              </div>
            )}
          </div>

          {/* Level Field (Locked) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Difficulty Level</Label>
            <div className="flex items-center gap-2">
              <Input value={level} disabled className="bg-gray-50" />
              <Badge variant="outline" className="text-xs">
                Locked
              </Badge>
            </div>
            <p className="text-xs text-gray-500">
              Level is automatically set based on your assessment configuration.
            </p>
          </div>

          {/* Type Field (Locked) */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Question Type</Label>
            <div className="flex items-center gap-2">
              <Input
                value={getQuestionTypeDisplay(questionType)}
                disabled
                className="bg-gray-50"
              />
              <Badge variant="outline" className="text-xs">
                Locked
              </Badge>
            </div>
          </div>

          {/* Count Field */}
          <div className="space-y-2">
            <Label htmlFor="count" className="text-sm font-medium">
              Number of Questions <span className="text-red-500">*</span>
            </Label>
            <Input
              id="count"
              type="number"
              min="1"
              max="50"
              value={formData.count}
              onChange={(e) => handleNumberInputChange("count", e.target.value)}
              onBlur={() => handleNumberInputBlur("count", 1, 1)}
              className={errors.count ? "border-red-500" : ""}
              disabled={isGenerating}
              onWheel={(e) => e.currentTarget.blur()}
            />
            {errors.count && (
              <div className="flex items-center gap-1 text-red-500 text-xs">
                <AlertTriangle className="h-3 w-3" />
                {errors.count}
              </div>
            )}
          </div>

          {/* Total Marks Field */}
          <div className="space-y-2">
            <Label htmlFor="totalMarks" className="text-sm font-medium">
              Total Marks per Question <span className="text-red-500">*</span>
            </Label>
            <Input
              id="totalMarks"
              type="number"
              min="1"
              max="100"
              value={formData.totalMarks}
              onChange={(e) =>
                handleNumberInputChange("totalMarks", e.target.value)
              }
              onBlur={() => handleNumberInputBlur("totalMarks", 1, 10)}
              className={errors.totalMarks ? "border-red-500" : ""}
              disabled={isGenerating}
              onWheel={(e) => e.currentTarget.blur()}
            />
            {errors.totalMarks && (
              <div className="flex items-center gap-1 text-red-500 text-xs">
                <AlertTriangle className="h-3 w-3" />
                {errors.totalMarks}
              </div>
            )}
          </div>

          {/* Duration Field */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="text-sm font-medium">
              Duration (minutes) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="duration"
              type="number"
              min="1"
              max="180"
              value={formData.duration}
              onChange={(e) =>
                handleNumberInputChange("duration", e.target.value)
              }
              onBlur={() => handleNumberInputBlur("duration", 1, 15)}
              className={errors.duration ? "border-red-500" : ""}
              disabled={isGenerating}
              onWheel={(e) => e.currentTarget.blur()}
            />
            {errors.duration && (
              <div className="flex items-center gap-1 text-red-500 text-xs">
                <AlertTriangle className="h-3 w-3" />
                {errors.duration}
              </div>
            )}
          </div>

          {/* Additional Fields for findAnswer type */}
          {questionType === "findAnswer" && (
            <>
              {/* Words Field */}
              <div className="space-y-2">
                <Label htmlFor="words" className="text-sm font-medium">
                  Passage Length (words) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="words"
                  type="number"
                  min="50"
                  max="1000"
                  value={formData.words}
                  onChange={(e) =>
                    handleNumberInputChange("words", e.target.value)
                  }
                  onBlur={() => handleNumberInputBlur("words", 50, 125)}
                  className={errors.words ? "border-red-500" : ""}
                  disabled={isGenerating}
                  onWheel={(e) => e.currentTarget.blur()}
                />
                {errors.words && (
                  <div className="flex items-center gap-1 text-red-500 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.words}
                  </div>
                )}
              </div>

              {/* Sub-questions Field */}
              <div className="space-y-2">
                <Label htmlFor="subquestions" className="text-sm font-medium">
                  Sub-questions per Passage{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subquestions"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.subquestions}
                  onChange={(e) =>
                    handleNumberInputChange("subquestions", e.target.value)
                  }
                  onBlur={() => handleNumberInputBlur("subquestions", 1, 5)}
                  className={errors.subquestions ? "border-red-500" : ""}
                  disabled={isGenerating}
                  onWheel={(e) => e.currentTarget.blur()}
                />
                {errors.subquestions && (
                  <div className="flex items-center gap-1 text-red-500 text-xs">
                    <AlertTriangle className="h-3 w-3" />
                    {errors.subquestions}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                AI Generation Info
              </span>
            </div>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>
                • Questions will be generated based on the specified subject and
                level
              </li>
              <li>
                • Generation may take a few moments depending on the number of
                questions
              </li>
              <li>
                • All generated questions will be automatically added to this
                topic
              </li>
              {questionType === "findAnswer" && (
                <li>
                  • Each passage will contain the specified number of
                  sub-questions
                </li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isGenerating}
            className="bg-gradient-to-r from-[#219CAE] to-[#1a7d8b] hover:from-[#1a7d8b] hover:to-[#156b75] text-white"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Questions
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
