"use client";

import { useEffect, useState } from "react";
import { useSelectedDataStore } from "@/stores/use-topic-store";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Code, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ProgressBar } from "@/components/progress-bar";
import { useAssessmentForm } from "@/hooks/use-assessment-form";
import { Badge } from "@/components/ui/badge";

const formSteps = [
  { id: 1, name: "Name Assessment" },
  { id: 2, name: "Select Tests" },
  { id: 3, name: "Review & Submit" },
];

type Option = {
  text: string;
  isCorrect: boolean;
  _id?: string;
};

type MCQQuestion = {
  _id: string;
  topic: string;
  title: string;
  duration: string;
  questionLevel: string;
  questionType: "mcq";
  totalMarks: number;
  options: Option[];
};

type MultiMCQQuestion = {
  _id: string;
  topic: string;
  title: string;
  duration: string;
  questionLevel: string;
  questionType: "mcqmulti";
  totalMarks: number;
  options: Option[];
};

type TestCase = {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
};

type CodeQuestion = {
  _id: string;
  topic: string;
  title: string;
  duration: string;
  questionLevel: string;
  questionType: "coding";
  totalMarks: number;
  codeQuestion: string;
  parameters: string[];
  returnType: string;
  code: {
    [language: string]: {
      defaultCode: string;
      solutionCode: string;
    };
  };
  testcase: TestCase[];
};

type PromptQuestion = {
  _id: string;
  topic: string;
  title: string;
  duration: string;
  questionLevel: string;
  questionType: "prompt";
  totalMarks: number;
  expectedOutputDescription: string;
};

type PassageOption = {
  text: string;
  isCorrect: boolean;
  _id?: string;
};

type PassageQuestion = {
  id: string;
  questionText: string;
  options: PassageOption[];
  explanation: string;
};

type PassageQuestionForm = {
  _id: string;
  number: number;
  title: string;
  passage: string;
  questions: PassageQuestion[];
  timeLimit: string;
  questionType: "findAnswer";
  questionLevel: string;
  totalMarks: number;
  duration: string;
};

type Question =
  | MCQQuestion
  | CodeQuestion
  | MultiMCQQuestion
  | PassageQuestionForm
  | PromptQuestion;

export default function ReviewQuestions() {
  const router = useRouter();
  const { updateFormData, formData, isLoading } = useAssessmentForm();
  const [openQuestions, setOpenQuestions] = useState<string[]>([]);
  const selectedQuestions = useSelectedDataStore((state) => state.questions);
  const [questionDetails, setQuestionDetails] = useState<Record<string, any>>(
    {}
  );
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);

  const toggleQuestion = (id: string) => {
    setOpenQuestions((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const handleBack = () => {
    router.push("/company/assessments/create-assessment/select-tests");
  };

  const handleNext = () => {
    router.push("summary");
  };
  useEffect(() => {
    if (isLoading || formData.totalDuration) return;

    const total = selectedQuestions
      .map((q) => Number(q.duration) || 0)
      .reduce((acc, duration) => acc + duration, 0);

    // Only update if the total is different
    if (formData.totalDuration !== total) {
      updateFormData({ totalDuration: total });
    }
  }, [selectedQuestions, formData.totalDuration, updateFormData, isLoading]);

  const isCodeQuestion = (question: any): boolean =>
    question.questionType === "coding";

  const isMCQQuestion = (question: any): boolean =>
    question.questionType === "mcq";

  const isMultiMCQQuestion = (question: any): boolean =>
    question.questionType === "mcqmulti";

  const isPassageQuestion = (question: any): boolean =>
    question.questionType === "findAnswer";

  const isPromptQuestion = (question: any): boolean =>
    question.questionType === "prompt";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Button
          onClick={handleBack}
          variant="outline"
          size="icon"
          className="rounded-lg shadow-sm hover:shadow-md transition-shadow"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create Assessment
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Review your selected questions before proceeding
          </p>
        </div>
      </div>

      <ProgressBar currentStep={3} steps={formSteps} />

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-700">
            Review Questions
          </h2>
          <div className="text-sm text-gray-500">
            Total: {selectedQuestions.length} questions
          </div>
        </div>

        {isLoadingQuestions ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#219CAE]"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedQuestions.map((question: any) => {
              // Get the detailed question data if available
              const questionDetail =
                questionDetails[question.questionId] || question;

              return (
                <Collapsible
                  key={question._id}
                  open={openQuestions.includes(question.questionId)}
                  onOpenChange={() => toggleQuestion(question.questionId)}
                  className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <CollapsibleTrigger className="w-full">
                    <div className="flex items-center p-6 bg-white hover:bg-gray-50/50 transition-colors">
                      <div
                        className={`flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center font-medium mr-5 shadow-sm
                        ${
                          isMCQQuestion(question) ||
                          isMultiMCQQuestion(question)
                            ? "bg-gradient-to-br from-[#219CAE] to-[#1a7d8b] text-white"
                            : isPassageQuestion(question)
                            ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white"
                            : isPromptQuestion(question)
                            ? "bg-[#219CAE] text-white"
                            : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                        }`}
                      >
                        {isMCQQuestion(question) ||
                        isMultiMCQQuestion(question) ||
                        isPassageQuestion(question) ? (
                          <FileText className="h-6 w-6" />
                        ) : isPromptQuestion(question) ? (
                          <Sparkles className="h-6 w-6" />
                        ) : (
                          <Code className="h-6 w-6" />
                        )}
                      </div>
                      <div className="flex-grow text-left">
                        <div
                          className="font-medium"
                          dangerouslySetInnerHTML={{ __html: question.title }}
                        />
                        <div className="flex gap-2 mt-1">
                          {question.questionLevel && (
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {question.questionLevel}
                            </Badge>
                          )}
                          {question.duration && (
                            <Badge variant="outline" className="text-xs">
                              {question.duration} Minutes
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {question.totalMarks} mark
                            {question.totalMarks !== 1 ? "s" : ""}
                          </Badge>
                          <Badge
                            variant={
                              isMCQQuestion(question) ||
                              isMultiMCQQuestion(question) ||
                              isPassageQuestion(question) ||
                              isPromptQuestion(question)
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {isMCQQuestion(question)
                              ? "MCQ"
                              : isMultiMCQQuestion(question)
                              ? "Multi-MCQ"
                              : isPassageQuestion(question)
                              ? "Passage"
                              : isPromptQuestion(question)
                              ? "Prompt"
                              : "Coding"}
                          </Badge>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-500 transition-transform ${
                          openQuestions.includes(question.questionId)
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-50/50 border-t border-gray-100">
                      {questionDetail ? (
                        isMCQQuestion(questionDetail) ? (
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm text-gray-700">
                              Options:
                            </h4>
                            <ul className="space-y-2 pl-5">
                              {questionDetail.options?.map(
                                (option: Option, i: number) => (
                                  <li
                                    key={i}
                                    className={
                                      option.isCorrect
                                        ? "font-medium text-[#219CAE]"
                                        : ""
                                    }
                                  >
                                    {option.text}{" "}
                                    {option.isCorrect && "(Correct Answer)"}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        ) : isMultiMCQQuestion(questionDetail) ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium text-sm text-gray-700">
                                Options:
                              </h4>
                              <Badge variant="secondary" className="text-xs">
                                Multiple Correct Answers
                              </Badge>
                            </div>
                            <ul className="space-y-2 pl-5">
                              {questionDetail.options?.map(
                                (option: Option, i: number) => (
                                  <li
                                    key={i}
                                    className={`flex items-center gap-2 ${
                                      option.isCorrect
                                        ? "font-medium text-[#219CAE]"
                                        : ""
                                    }`}
                                  >
                                    <div
                                      className={`w-3 h-3 border rounded ${
                                        option.isCorrect
                                          ? "bg-[#219CAE] border-[#219CAE]"
                                          : "border-gray-300"
                                      }`}
                                    >
                                      {option.isCorrect && (
                                        <div className="w-1.5 h-1.5 bg-white rounded-sm m-0.5"></div>
                                      )}
                                    </div>
                                    {option.text}
                                    {option.isCorrect && (
                                      <span className="text-xs text-[#219CAE]">
                                        (Correct)
                                      </span>
                                    )}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        ) : isPromptQuestion(questionDetail) ? (
                          <div className="space-y-4">
                            <div className="bg-white p-4 rounded-lg border border-[#219CAE]">
                              <h4 className="font-medium text-sm text-[#219CAE] mb-3 flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                AI-Evaluated Question:
                                <Badge variant="outline" className="text-xs">
                                  {questionDetail.duration} minutes
                                </Badge>
                              </h4>
                              <div className="bg-white p-4 rounded-md border border-[#219CAE]">
                                <h5 className="font-medium text-sm text-[#219CAE] mb-2">
                                  Expected Output Description:
                                </h5>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {questionDetail.expectedOutputDescription}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs text-[#219CAE] bg-white p-3 rounded-md border border-[#219CAE]">
                              <span>
                                Total Marks: {questionDetail.totalMarks}
                              </span>
                              <span>
                                Duration: {questionDetail.duration} minutes
                              </span>
                              <span>Level: {questionDetail.questionLevel}</span>
                            </div>
                          </div>
                        ) : isPassageQuestion(questionDetail) ? (
                          <div className="space-y-4">
                            <div className="bg-gradient-to-r from-orange-50 to-orange-50/50 p-4 rounded-lg border border-orange-200">
                              <h4 className="font-medium text-sm text-orange-800 mb-3 flex items-center gap-2">
                                📖 Passage:
                                <Badge variant="outline" className="text-xs">
                                  {questionDetail.timeLimit}
                                </Badge>
                              </h4>
                              <div
                                className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-md"
                                dangerouslySetInnerHTML={{
                                  __html: questionDetail.passage,
                                }}
                              />
                            </div>

                            <div className="space-y-3">
                              <h4 className="font-medium text-sm text-gray-700">
                                Questions (
                                {questionDetail.questions?.length || 0}):
                              </h4>

                              {questionDetail.questions?.map(
                                (subQuestion: any, idx: number) => (
                                  <div
                                    key={subQuestion._id}
                                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                                  >
                                    <div className="font-medium text-sm text-gray-800 mb-3">
                                      {idx + 1}. {subQuestion.questionText}
                                    </div>

                                    <div className="space-y-2 ml-4">
                                      {subQuestion.options?.map(
                                        (option: any, optIdx: number) => (
                                          <div
                                            key={optIdx}
                                            className="flex items-center gap-2 text-sm"
                                          >
                                            <div
                                              className={`w-3 h-3 rounded-full border ${
                                                option.isCorrect
                                                  ? "border-green-500 bg-green-100"
                                                  : "border-gray-300"
                                              }`}
                                            >
                                              {option.isCorrect && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500 m-0.5"></div>
                                              )}
                                            </div>
                                            <span
                                              className={
                                                option.isCorrect
                                                  ? "text-green-700 font-medium"
                                                  : "text-gray-600"
                                              }
                                            >
                                              {option.text}
                                            </span>
                                            {option.isCorrect && (
                                              <Badge
                                                variant="secondary"
                                                className="text-xs ml-2"
                                              >
                                                Correct
                                              </Badge>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>

                                    {subQuestion.explanation && (
                                      <div className="mt-3 p-3 bg-gray-50 rounded-md border-l-4 border-blue-400">
                                        <span className="text-xs font-medium text-gray-600">
                                          💡 Explanation:
                                        </span>
                                        <p className="text-sm text-gray-700 mt-1">
                                          {subQuestion.explanation}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        ) : isCodeQuestion(questionDetail) ? (
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-2">
                                Question Description:
                              </h4>
                              <div
                                className="text-sm text-gray-600 bg-white p-3 rounded-md"
                                dangerouslySetInnerHTML={{
                                  __html: questionDetail.codeQuestion,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            <p>
                              Question details not available or question type
                              not recognized.
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="text-sm text-gray-600">
                          <p>Loading question details...</p>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}

        <div className="flex justify-between items-center pt-8 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleBack}
            className="px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </Button>
          <Button
            className="bg-gradient-to-r from-[#219CAE] to-[#1a7d8b] hover:from-[#1a7d8b] hover:to-[#156b75] text-white px-6 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
            onClick={handleNext}
          >
            Continue to Summary
          </Button>
        </div>
      </div>
    </div>
  );
}
