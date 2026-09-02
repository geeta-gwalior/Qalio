"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Plus,
  Download,
  Upload,
  Code,
  FileText,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { useSelectedDataStore } from "@/stores/use-topic-store";
import type { SelectedQuestion } from "@/types/assessment";
import { useAssessmentForm } from "@/hooks/use-assessment-form";
import { toast } from "sonner";
import UploadQuestionsDialog from "@/components/upload-questions-dialog";
import AIUploadDialog from "@/components/ai-upload-dialog";

// Define option type to match what's used in questions
type Option = {
  text: string;
  isCorrect: boolean;
  _id: string;
};

type MCQQuestion = {
  _id: string;
  topic: string;
  title: string;
  duration: number;
  questionLevel: string;
  questionType: "mcq";
  totalMarks: number;
  options: Option[];
  createdAt: string;
  updatedAt: string;
};

type MultiMCQQuestion = {
  _id: string;
  topic: string;
  title: string;
  duration: number;
  questionLevel: string;
  questionType: "mcqmulti";
  totalMarks: number;
  options: Option[];
  createdAt: string;
  updatedAt: string;
};

type CodeQuestion = {
  _id: string;
  topic: string;
  title: string;
  duration: number;
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
  testcase: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
};

type PromptQuestion = {
  _id: string;
  topic: string;
  title: string;
  duration: number;
  questionLevel: string;
  questionType: "prompt";
  totalMarks: number;
  expectedOutputDescription: string;
  createdAt: string;
  updatedAt: string;
};

type PassageOption = {
  text: string;
  isCorrect: boolean;
  _id?: string;
};

type PassageQuestion = {
  _id: string;
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
  duration: number;
};

type Question =
  | MCQQuestion
  | CodeQuestion
  | MultiMCQQuestion
  | PassageQuestionForm
  | PromptQuestion;

type TopicDetails = {
  _id: string;
  heading: string;
  description: string;
};

export default function TopicDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const questionType = searchParams.get("type") || "Not Specified";

  const [topic, setTopic] = useState<TopicDetails | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isExcelUploadOpen, setIsExcelUploadOpen] = useState(false);
  const [isAIUploadOpen, setIsAIUploadOpen] = useState(false);
  const { addOrUpdateQuestions, addOrUpdateTopic } = useSelectedDataStore();
  // Properly unwrap the params promise
  const { id } = use(params);
  const { formData } = useAssessmentForm();
  const level = formData.level;

  const fetchTopicDetails = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/topics/${id}`);
      setTopic(response.data.data.topic);
      // Filter questions based on the selected question type
      const allQuestions = response.data.data.topic.questions || [];
      let typeFiltered;

      if (questionType === "mcq") {
        // Include both regular MCQ and multi-select MCQ
        typeFiltered = allQuestions.filter(
          (q: Question) =>
            q.questionType === "mcq" || q.questionType === "mcqmulti"
        );
      } else if (questionType === "findAnswer") {
        typeFiltered = allQuestions.filter(
          (q: Question) => q.questionType === "findAnswer"
        );
      } else if (questionType === "prompt") {
        typeFiltered = allQuestions.filter(
          (q: Question) => q.questionType === "prompt"
        );
      } else {
        typeFiltered = allQuestions.filter(
          (q: Question) => q.questionType === questionType
        );
      }

      // Store all type-filtered questions
      setQuestions(typeFiltered);

      // Apply level filter if level is available
      if (level) {
        const levelFiltered = typeFiltered.filter(
          (q: Question) => q.questionLevel.toLowerCase() === level.toLowerCase()
        );
        setFilteredQuestions(levelFiltered);
      } else {
        // If no level is selected, show all questions of the selected type
        setFilteredQuestions(typeFiltered);
      }

      // Reset selected questions when question type changes
      setSelectedQuestionIds([]);
    } catch (error) {
      console.error("Error fetching topic details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTopicDetails();
    }
    localStorage.removeItem("currenTopicDetails");
    localStorage.removeItem("topicTypeUpdated");
  }, [id, questionType]);

  // Separate useEffect to handle level changes
  useEffect(() => {
    if (questions.length > 0 && level) {
      const levelFiltered = questions.filter(
        (q: Question) => q.questionLevel.toLowerCase() === level.toLowerCase()
      );
      setFilteredQuestions(levelFiltered);
      // Reset selected questions when level changes
      setSelectedQuestionIds([]);
    } else if (questions.length > 0) {
      // If no level is selected, show all questions of the selected type
      setFilteredQuestions(questions);
    }
  }, [level, questions]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestionIds(filteredQuestions.map((q) => q._id));
    } else {
      setSelectedQuestionIds([]);
    }
  };

  const handleSelectQuestion = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestionIds((prev) => [...prev, questionId]);
    } else {
      setSelectedQuestionIds((prev) => prev.filter((id) => id !== questionId));
    }
  };

  const handleAddSelectedQuestions = () => {
    if (selectedQuestionIds.length === 0) {
      toast.error("Please select at least one question");
      return;
    }

    const selectedQuestionsData: SelectedQuestion[] = selectedQuestionIds.map(
      (id) => {
        const question = filteredQuestions.find((q) => q._id === id);
        if (!question) throw new Error(`Question with ID ${id} not found`);

        const baseQuestion: SelectedQuestion = {
          questionId: question._id,
          title: question.title,
          questionType: question.questionType,
          totalMarks: question.totalMarks,
          _id: id,
          duration: question.duration || 0,
        };

        if (question.questionType === "mcq") {
          const mcqQuestion = question as MCQQuestion;
          baseQuestion.options = mcqQuestion.options.map((option) => ({
            text: option.text,
            isCorrect: option.isCorrect,
            _id: option._id,
          }));
        } else if (question.questionType === "mcqmulti") {
          const multiMCQQuestion = question as MultiMCQQuestion;
          baseQuestion.options = multiMCQQuestion.options.map((option) => ({
            text: option.text,
            isCorrect: option.isCorrect,
            _id: option._id,
          }));
        } else if (question.questionType === "findAnswer") {
          const passageQuestion = question as PassageQuestionForm;
          baseQuestion.passage = passageQuestion.passage;
          baseQuestion.questions = passageQuestion.questions.map((q) => ({
            _id: q._id,
            questionText: q.questionText,
            options: q.options.map((option) => ({
              text: option.text,
              isCorrect: option.isCorrect,
              _id: option._id || "",
            })),
          }));
        } else if (question.questionType === "coding") {
          const codeQuestion = question as CodeQuestion;
          baseQuestion.codeQuestion = codeQuestion.codeQuestion;
        } else if (question.questionType === "prompt") {
          const promptQuestion = question as PromptQuestion;
          baseQuestion.expectedOutputDescription =
            promptQuestion.expectedOutputDescription;
        }

        return baseQuestion;
      }
    );

    addOrUpdateQuestions(selectedQuestionsData, id, questionType);

    if (topic) {
      const newTopicEntry = {
        _id: id,
        heading: topic.heading,
        description: topic.description || "No description",
        icon: "file-text",
        type: questionType,
        questionCount: selectedQuestionsData.length,
        duration: "10 mins",
        questionType,
        questions: selectedQuestionsData,
      };

      addOrUpdateTopic(newTopicEntry);
    }

    toast.success("Questions added successfully");
    router.back();
  };

  const calculateTotalDuration = () => {
    let totalMinutes = 0;

    filteredQuestions.forEach((q) => {
      const durationMatch = q.duration;

      if (durationMatch) {
        totalMinutes += Number(durationMatch);
      } else {
        // If duration is just a number (minutes)
        const numericDuration = Number(q.duration);
        if (!isNaN(numericDuration)) {
          totalMinutes += numericDuration;
        }
      }
    });
    return totalMinutes;
  };

  const isCodeQuestion = (question: Question): question is CodeQuestion => {
    return question.questionType === "coding";
  };

  const isMCQQuestion = (question: Question): question is MCQQuestion => {
    return question.questionType === "mcq";
  };

  const isMultiMCQQuestion = (
    question: Question
  ): question is MultiMCQQuestion => {
    return question.questionType === "mcqmulti";
  };

  const isFindAnswerQuestion = (
    question: Question
  ): question is PassageQuestionForm => {
    return question.questionType === "findAnswer";
  };

  const isPromptQuestion = (question: Question): question is PromptQuestion => {
    return question.questionType === "prompt";
  };

  type BadgeVariant = "default" | "outline" | "secondary" | "destructive";

  const getBadgeProps = (
    type: string
  ): { label: string; variant: BadgeVariant } => {
    switch (type) {
      case "mcq":
        return { label: "MCQ Questions", variant: "default" };
      case "mcqmulti":
        return { label: "Multi-MCQ Questions", variant: "outline" };
      case "coding":
        return { label: "Coding Questions", variant: "secondary" };
      case "findAnswer":
        return { label: "Find Answer Questions", variant: "destructive" };
      case "prompt":
        return { label: "AI Prompt Questions", variant: "secondary" };
      default:
        return { label: "Questions", variant: "default" };
    }
  };

  const { label, variant } = getBadgeProps(questionType);

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

  const handleUploadViaExcel = () => {
    if (questionType === "coding") {
      toast.info(
        "Excel upload is not available for coding questions at the moment."
      );
      setIsUploadModalOpen(false);
      return;
    }
    setIsUploadModalOpen(false);
    setIsExcelUploadOpen(true);
  };

  const handleUploadViaAI = () => {
    setIsUploadModalOpen(false);
    setIsAIUploadOpen(true);
  };

  const handleUploadSuccess = () => {
    // Refresh the questions list after successful upload
    fetchTopicDetails();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="icon"
            className="rounded-md"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {topic?.heading || "Topic Details"}
          </h1>
          <Badge variant={variant} className="capitalize">
            {getQuestionTypeDisplay(questionType)}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() =>
              router.push(
                `/company/assessments/create-assessment/select-tests/create-topic/add-questions?id=${id}&type=${questionType}`
              )
            }
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add
          </Button>
          {questionType != "coding" && (
            <Button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-[#219CAE] hover:bg-[#1a7d8b] text-white flex items-center gap-2"
            >
              <Upload className="h-4 w-4" /> Upload Questions
            </Button>
          )}
        </div>
      </div>

      <Card className="p-6">
        {filteredQuestions.length > 0 ? (
          <>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold capitalize">
                  {getQuestionTypeDisplay(questionType)}
                </h2>
                <div className="flex items-center text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{calculateTotalDuration()} mins</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div className="flex items-center">
                  <Checkbox
                    id="select-all"
                    checked={
                      selectedQuestionIds.length === filteredQuestions.length &&
                      filteredQuestions.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                    className="mr-2 border-[#4AA3B1] data-[state=checked]:bg-[#4AA3B1]"
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Select All ({selectedQuestionIds.length}/
                    {filteredQuestions.length})
                  </label>
                </div>

                <Button
                  onClick={handleAddSelectedQuestions}
                  disabled={selectedQuestionIds.length === 0}
                  className="bg-[#4AA3B1] hover:bg-[#3A8A98] text-white flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add Selected Questions
                </Button>
              </div>

              <div className="space-y-8">
                {filteredQuestions.map((question, index) => (
                  <div key={question._id} className="border-b pb-6">
                    <div className="flex items-start gap-3 mb-4">
                      <Checkbox
                        id={`question-${question._id}`}
                        checked={selectedQuestionIds.includes(question._id)}
                        onCheckedChange={(checked) =>
                          handleSelectQuestion(question._id, checked === true)
                        }
                        className="mt-1 border-[#4AA3B1] data-[state=checked]:bg-[#4AA3B1]"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{index + 1}.</span>
                          <div
                            dangerouslySetInnerHTML={{ __html: question.title }}
                          />
                          <Badge className="ml-auto bg-gradient-to-r from-[#4AA3B1] to-[#4AA3B1]/80 hover:from-[#4AA3B1]/90 hover:to-[#4AA3B1]/70 text-white px-3 py-1 rounded-full">
                            Level:{" "}
                            <span className="ml-1 font-semibold">
                              {question.questionLevel}
                            </span>
                          </Badge>
                        </div>

                        {isMCQQuestion(question) && (
                          <div className="ml-6 space-y-3 mt-4">
                            {question.options.map((option) => (
                              <div
                                key={option._id}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className={`w-4 h-4 rounded-full border ${
                                    option.isCorrect
                                      ? "border-[#4AA3B1] bg-[#4AA3B1]/20"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {option.isCorrect && (
                                    <div className="w-2 h-2 rounded-full bg-[#4AA3B1] m-[3px]"></div>
                                  )}
                                </div>
                                <span>{option.text}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {isMultiMCQQuestion(question) && (
                          <div className="ml-6 space-y-3 mt-4">
                            <div className="text-sm text-gray-600 mb-2 font-medium">
                              Multiple correct answers allowed
                            </div>
                            {question.options.map((option) => (
                              <div
                                key={option._id}
                                className="flex items-center gap-2"
                              >
                                <div
                                  className={`w-4 h-4 rounded border ${
                                    option.isCorrect
                                      ? "border-[#4AA3B1] bg-[#4AA3B1]/20"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {option.isCorrect && (
                                    <div className="w-2 h-2 bg-[#4AA3B1] m-[3px]"></div>
                                  )}
                                </div>
                                <span>{option.text}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {isCodeQuestion(question) && (
                          <div className="ml-6 mt-4 space-y-3">
                            <div className="text-sm text-gray-700">
                              <p
                                dangerouslySetInnerHTML={{
                                  __html: question.codeQuestion,
                                }}
                              />
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {Object.keys(question.code).map((language) => (
                                <span
                                  key={language}
                                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {language}
                                </span>
                              ))}
                            </div>
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Parameters:</span>{" "}
                                {question.parameters.join(", ")}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">
                                  Return type:
                                </span>{" "}
                                {question.returnType}
                              </p>
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Test cases:</span>{" "}
                                {question.testcase.length}
                              </p>
                            </div>
                          </div>
                        )}

                        {isPromptQuestion(question) && (
                          <div className="ml-6 mt-4 space-y-4">
                            <div className="bg-white border border-[#219CAE] rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="h-4 w-4 text-[#219CAE]" />
                                <span className="text-sm font-medium text-[#219CAE]">
                                  AI-Evaluated Question
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {question.duration} mins
                                </Badge>
                              </div>

                              <div className="space-y-3">
                                <div>
                                  <h4 className="text-sm font-medium text-[#219CAE] mb-2">
                                    Expected Output Description:
                                  </h4>
                                  <div className="bg-white border border-[#219CAE] rounded-md p-3">
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      {question.expectedOutputDescription}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between text-xs text-black">
                                  <span>
                                    Total Marks: {question.totalMarks}
                                  </span>
                                  <span>
                                    Duration: {question.duration} minutes
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-gray-50 border rounded-lg p-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-3 w-3 text-gray-500" />
                                <span className="text-xs font-medium text-gray-600">
                                  AI Evaluation Features
                                </span>
                              </div>
                              <ul className="text-xs text-gray-600 space-y-1">
                                <li>• Automated content analysis</li>
                                <li>• Criteria-based scoring</li>
                                <li>• Detailed feedback generation</li>
                              </ul>
                            </div>
                          </div>
                        )}

                        {isFindAnswerQuestion(question) && (
                          <div className="ml-6 mt-4 space-y-4">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <h4 className="font-medium text-sm text-blue-800 mb-2">
                                Passage:
                              </h4>
                              <div
                                className="text-sm text-gray-700 leading-relaxed"
                                dangerouslySetInnerHTML={{
                                  __html: question.passage,
                                }}
                              />
                            </div>

                            <div className="space-y-3">
                              <h4 className="font-medium text-sm text-gray-700 flex items-center gap-2">
                                Questions ({question.questions.length}):
                                <Badge variant="outline" className="text-xs">
                                  {question.timeLimit}
                                </Badge>
                              </h4>

                              {question.questions.map((subQuestion, idx) => (
                                <div
                                  key={subQuestion._id}
                                  className="bg-white border border-gray-200 rounded-lg p-4"
                                >
                                  <div className="font-medium text-sm text-gray-800 mb-3">
                                    {idx + 1}. {subQuestion.questionText}
                                  </div>

                                  <div className="space-y-2 ml-4">
                                    {subQuestion.options.map(
                                      (option, optIdx) => (
                                        <div
                                          key={optIdx}
                                          className="flex items-center gap-2 text-sm"
                                        >
                                          <div
                                            className={`w-3 h-3 rounded-full border ${
                                              option.isCorrect
                                                ? "border-[#219CAE] bg-[#219CAE]"
                                                : "border-gray-300"
                                            }`}
                                          >
                                            {option.isCorrect && (
                                              <div className="w-1.5 h-1.5 rounded-full bg-[#219CAE] m-0.5"></div>
                                            )}
                                          </div>
                                          <span
                                            className={
                                              option.isCorrect
                                                ? "text-[#219CAE] font-medium"
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
                                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                      <span className="text-xs font-medium text-gray-600">
                                        Explanation:
                                      </span>
                                      <p className="text-sm text-gray-700 mt-1">
                                        {subQuestion.explanation}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {question.questionType === "mcq" ? (
                          <div className="w-10 h-10 rounded-full bg-[#4AA3B1]/10 flex items-center justify-center text-[#4AA3B1] font-medium">
                            <FileText className="h-5 w-5" />
                          </div>
                        ) : question.questionType === "mcqmulti" ? (
                          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#219CAE] font-medium">
                            <FileText className="h-5 w-5" />
                          </div>
                        ) : question.questionType === "findAnswer" ? (
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-800 font-medium">
                            <FileText className="h-5 w-5" />
                          </div>
                        ) : question.questionType === "prompt" ? (
                          <div className="w-10 h-10 rounded-full bg-[#219CAE] flex items-center justify-center text-white font-medium">
                            <Sparkles className="h-5 w-5" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium">
                            <Code className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              {level
                ? `No ${level} ${getQuestionTypeDisplay(questionType)} Found`
                : `No ${getQuestionTypeDisplay(questionType)} Found`}
            </h3>
            <p className="text-gray-500 mb-6 text-center">
              {level
                ? `This topic doesn't have any ${level} ${getQuestionTypeDisplay(
                    questionType
                  ).toLowerCase()} yet.`
                : `This topic doesn't have any ${getQuestionTypeDisplay(
                    questionType
                  ).toLowerCase()} yet.`}
            </p>
            <Button
              className="bg-[#4AA3B1] hover:bg-[#3A8A98] text-white"
              onClick={() =>
                router.push(
                  `/company/assessments/create-assessment/select-tests/create-topic/add-questions?id=${id}&type=${questionType}`
                )
              }
            >
              <Plus className="h-4 w-4 mr-2" /> Add{" "}
              {getQuestionTypeDisplay(questionType)}
            </Button>
          </div>
        )}
      </Card>

      {/* Upload Questions Modal */}
      {questionType !== "coding" && (
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DialogTitle className="text-xl font-semibold">
                    Upload Questions
                  </DialogTitle>
                  <Badge variant={variant} className="text-xs">
                    {getQuestionTypeDisplay(questionType)}
                  </Badge>
                </div>
              </div>
              <DialogDescription className="text-gray-600">
                Choose your preferred method to upload{" "}
                {getQuestionTypeDisplay(questionType).toLowerCase()} to this
                topic.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 gap-4 py-6">
              {/* Upload via Excel Button - Hide for coding questions */}
              {questionType !== "coding" && (
                <Button
                  onClick={handleUploadViaExcel}
                  className="h-20 bg-gradient-to-r from-[#219CAE] to-[#1a7d8b] hover:from-[#1a7d8b] hover:to-[#156b75] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-lg">
                        Upload via Excel
                      </div>
                      <div className="text-sm opacity-90">
                        Import questions from Excel file
                      </div>
                    </div>
                  </div>
                </Button>
              )}

              {/* Upload via AI Button */}
              <Button
                onClick={handleUploadViaAI}
                className="h-20 bg-gradient-to-r from-[#219CAE] to-[#1a7d8b] hover:from-[#1a7d8b] hover:to-[#156b75] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-lg">Upload via AI</div>
                    <div className="text-sm opacity-90">
                      Generate questions using AI
                    </div>
                  </div>
                </div>
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500 border-t pt-4">
              Questions will be added to:{" "}
              <span className="font-medium">{topic?.heading}</span>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Excel Upload Dialog */}
      <UploadQuestionsDialog
        isOpen={isExcelUploadOpen}
        onClose={() => setIsExcelUploadOpen(false)}
        questionType={questionType}
        topicId={id}
        topicName={topic?.heading || ""}
        onSuccess={handleUploadSuccess}
      />

      {/* AI Upload Dialog */}
      <AIUploadDialog
        isOpen={isAIUploadOpen}
        onClose={() => setIsAIUploadOpen(false)}
        questionType={questionType}
        topicId={id}
        topicName={topic?.heading || ""}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
