"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, Flag, Circle } from "lucide-react";

interface Question {
  _id: string;
  questionType: string;
  questionText: string;
  totalMarks: number;
  timeLimit?: number; // Add this for question timer mode
  options?: Array<{ text: string; _id: string }>; // For MCQ questions
  passage?: string; // For findAnswer questions
  questions?: Array<any>; // For findAnswer sub-questions
  codeQuestion?: string; // For coding questions
  testcase?: Array<any>; // For coding questions
  code?: Record<string, any>; // For coding questions
}

interface NavigationPanelProps {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, any>;
  flaggedQuestions: Set<number>;
  onSelectQuestion: (index: number) => void;
  isNavigationRestricted?: boolean;
}

export function NavigationPanel({
  questions,
  currentIndex,
  answers,
  flaggedQuestions,
  onSelectQuestion,
  isNavigationRestricted = false,
}: NavigationPanelProps) {
  const getQuestionStatus = (index: number) => {
    const questionId = questions[index]._id;
    const isAnswered =
      answers[questionId] !== undefined && answers[questionId] !== "";
    const isFlagged = flaggedQuestions.has(index);
    const isCurrent = index === currentIndex;

    if (isCurrent) return "current";
    if (isAnswered) return "answered";
    if (isFlagged) return "flagged";
    return "unanswered";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "answered":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "flagged":
        return <Flag className="h-4 w-4 text-yellow-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "current":
        return "bg-blue-600 text-white border-blue-600";
      case "answered":
        return "bg-green-50 text-green-800 border-green-200";
      case "flagged":
        return "bg-yellow-50 text-yellow-800 border-yellow-200";
      default:
        return "bg-white text-gray-700 border-gray-200 hover:bg-gray-50";
    }
  };

  const answeredCount = Object.keys(answers).filter(
    (questionId) =>
      answers[questionId] !== undefined && answers[questionId] !== ""
  ).length;

  return (
    <div className="space-y-4">
      {/* Add navigation mode indicator */}
      {isNavigationRestricted && (
        <div className="p-2 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-xs text-amber-800">
            Sequential mode: Direct navigation disabled
          </p>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-medium text-sm">Progress Overview</h3>
        <div className="text-xs text-muted-foreground">
          {answeredCount} of {questions.length} answered
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span>Answered</span>
          </div>
          <div className="flex items-center gap-1">
            <Flag className="h-3 w-3 text-yellow-600" />
            <span>Flagged</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-sm">Questions</h3>
        <div className="grid grid-cols-4 gap-2">
          {questions.map((question, index) => {
            const status = getQuestionStatus(index);
            return (
              <Button
                key={question._id}
                variant="outline"
                size="sm"
                onClick={() => onSelectQuestion(index)}
                disabled={isNavigationRestricted && index !== currentIndex}
                className={cn(
                  "h-10 w-full p-0 text-xs font-medium transition-colors",
                  getStatusColor(status),
                  isNavigationRestricted &&
                    index !== currentIndex &&
                    "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex flex-col items-center gap-1">
                  <span>{index + 1}</span>
                  {getStatusIcon(status)}
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium text-sm">Question Types</h3>
        <div className="space-y-1">
          {Array.from(new Set(questions.map((q) => q.questionType))).map(
            (type) => {
              const count = questions.filter(
                (q) => q.questionType === type
              ).length;
              return (
                <div
                  key={type}
                  className="flex items-center justify-between text-xs"
                >
                  <Badge variant="outline" className="text-xs">
                    {type.toUpperCase()}
                  </Badge>
                  <span className="text-muted-foreground">{count}</span>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
