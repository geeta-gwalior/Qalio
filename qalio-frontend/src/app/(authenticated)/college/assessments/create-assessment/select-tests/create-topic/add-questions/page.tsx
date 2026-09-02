"use client";
import type React from "react";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Video, Search, Code, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

type QuestionType = {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
};

type Question = {
  id: string;
  number: number;
  title: string;
  questionType: string;
  timeLimit?: string;
  questionLevel?: string;
  totalMarks?: number;
  [key: string]: any;
};

export default function AddQuestions() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTopicCreation, setPendingTopicCreation] = useState(false);
  // State declarations
  const [selectedType, setSelectedType] = useState<string>("mcq");
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [topicData, setTopicData] = useState<{
    name: string;
    description: string;
  } | null>(null);
  const [lockedQuestionType, setLockedQuestionType] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [topicName, setTopicName] = useState("");
  const [shouldTrackTypeSelection, setShouldTrackTypeSelection] =
    useState(false);
  // Get URL parameters
  const id = searchParams.get("id");
  const type = searchParams.get("type");
  const SESSION_QUESTIONS_KEY = "currentSessionQuestions";

  // Update topic type function
  const updateTopicType = async (topicId: string, questionType: string) => {
    try {
      const response = await axios.put(`/api/topics/${topicId}`, {
        questionType: questionType,
      });

      if (response) {
        localStorage.setItem("topicTypeUpdated", "true");
      }
    } catch (error) {
      console.error("Error updating topic type:", error);
      toast.error("Failed to update topic type");
    }
  };
  useEffect(() => {
    // Set shouldTrackTypeSelection to true if there are no questions
    if (sessionQuestions.length === 0) {
      setShouldTrackTypeSelection(true);
    }
  }, [sessionQuestions]);

  // Update the useEffect hook to better handle question type locking
  // Replace the existing useEffect with this improved version
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);

      try {
        // 1. Handle topic data loading
        let currentTopic = null;
        let currentTopicDetails = null;

        // Try to fetch from API if ID is provided
        if (id) {
          try {
            const response = await axios.get(`/api/topics/${id}`);
            setTopicName(response.data.data.topic.heading);
            currentTopic = {
              name: response.data.data.topic.heading,
              description: response.data.data.topic.description,
            };
            currentTopicDetails = response.data;

            // Store in localStorage
            localStorage.setItem("currentTopic", JSON.stringify(currentTopic));
            localStorage.setItem(
              "currentTopicDetails",
              JSON.stringify(currentTopicDetails)
            );

            // If type is provided in URL, use it
            if (type) {
              setLockedQuestionType(type);
              setSelectedType(type);
            }
          } catch (err) {
            console.error("Error fetching topic:", err);
            // Fall through to localStorage check
          }
        }

        // Check localStorage if API failed or no ID provided
        if (!currentTopic) {
          const savedTopic = localStorage.getItem("currentTopic");
          if (savedTopic) {
            currentTopic = JSON.parse(savedTopic);
          }
          const savedDetails = localStorage.getItem("currentTopicDetails");
          if (savedDetails) {
            currentTopicDetails = JSON.parse(savedDetails);
          }
        }

        // Set topic data in state
        if (currentTopic) {
          setTopicData(currentTopic);
        } else {
          router.push(
            "/college/assessments/create-assessment/select-tests/create-topic"
          );
          return;
        }

        // 2. Handle session questions
        const savedSessionQuestions = sessionStorage.getItem(
          SESSION_QUESTIONS_KEY
        );
        if (savedSessionQuestions) {
          try {
            const parsedQuestions = JSON.parse(savedSessionQuestions);
            setSessionQuestions(parsedQuestions);

            if (parsedQuestions.length > 0) {
              // Determine the question type from the first question
              const firstQuestionType = parsedQuestions[0].questionType;

              // Set the locked question type based on the first question
              setLockedQuestionType(firstQuestionType);
              setSelectedType(firstQuestionType);

              // Update topic type if needed
              const topicTypeUpdated = localStorage.getItem("topicTypeUpdated");
              const topicId = currentTopicDetails?.data?.topic?._id;
              if (topicTypeUpdated !== "true" && topicId) {
                await updateTopicType(topicId, firstQuestionType);
              }
            }
          } catch (error) {
            console.error("Error parsing session questions:", error);
          }
        } else if (type) {
          // If no session questions but type is provided in URL
          setSelectedType(type);
          // Don't lock the type yet until a question is created
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load topic data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, type, router]);

  const questionTypes: QuestionType[] = [
    {
      id: "mcq",
      title: "MCQ",
      icon: <FileText className="h-6 w-6 text-[#219CAE]" />,
      description: "One Correct Answer",
    },
    {
      id: "mcqmulti",
      title: "Multi Option MCQ",
      icon: <FileText className="h-6 w-6 text-[#219CAE]" />,
      description: "Multiple Correct Answers",
    },
    {
      id: "coding",
      title: "Coding",
      icon: <Code className="h-6 w-6 text-[#219CAE]" />,
      description: "Programming Questions",
    },
    {
      id: "findAnswer",
      title: "Find Answer",
      icon: <Search className="h-6 w-6 text-[#219CAE]" />,
      description: "Read Phrase and Answer them",
    },
    {
      id: "prompt",
      title: "Prompt Question",
      icon: <FileText className="h-6 w-6 text-[#219CAE]" />,
      description: "One Correct Answer",
    },
  ];

  // Update the handleAddNewQuestion function to properly handle mcqmulti
  // Replace the existing handleAddNewQuestion function with this improved version
  const handleAddNewQuestion = () => {
    setShouldTrackTypeSelection(false);
    // If a question type is locked but user selected a different type, show toast
    if (lockedQuestionType && selectedType !== lockedQuestionType) {
      toast.error(
        <div className="flex flex-col gap-2">
          <span>
            This topic already has{" "}
            <strong>
              {lockedQuestionType === "mcq"
                ? "MCQ"
                : lockedQuestionType === "mcqmulti"
                ? "Multi MCQ"
                : "Coding"}
            </strong>{" "}
            questions. Please create a new topic for{" "}
            <strong>
              {selectedType === "mcq"
                ? "MCQ"
                : selectedType === "mcqmulti"
                ? "Multi MCQ"
                : "Coding"}
            </strong>{" "}
            questions.
          </span>
          <button
            onClick={() => {
              setShowConfirmModal(true);
              setPendingTopicCreation(true);
            }}
            className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
          >
            Create New Topic
          </button>
        </div>,
        {
          duration: 8000,
        }
      );
      return;
    }

    // Lock the question type if this is the first question
    if (!lockedQuestionType) {
      setLockedQuestionType(selectedType);
    }

    // Navigate to the appropriate question creation page
    if (selectedType === "mcq") {
      router.push(
        "/college/assessments/create-assessment/select-tests/create-topic/add-mcq-question/"
      );
    } else if (selectedType === "coding") {
      router.push("add-code-question");
    } else if (selectedType === "mcqmulti") {
      router.push("add-multimcq-question");
    } else if (selectedType === "findAnswer") {
      router.push("add-findAnswer-question");
    } else if (selectedType === "prompt") {
      router.push("add-prompt-question");
    } else {
      toast.error(
        "Only Multiple Choice, Multi MCQ, and Code Questions are supported at the moment."
      );
    }
  };

  const handleEditQuestion = (question: Question) => {
    if (question.questionType === "mcq") {
      localStorage.setItem("currentEditQuestion", JSON.stringify(question));
      router.push("add-mcq-question");
    } else if (question.questionType === "coding") {
      localStorage.setItem("currentEditQuestion", JSON.stringify(question));
      router.push("add-code-question");
    } else if (question.questionType === "mcqmulti") {
      localStorage.setItem("currentEditQuestion", JSON.stringify(question));
      router.push("add-multimcq-question");
    } else if (question.questionType === "findAnswer") {
      localStorage.setItem("currentEditQuestion", JSON.stringify(question));
      router.push("add-findAnswer-question");
    } else if (question.questionType === "prompt") {
      localStorage.setItem("currentEditQuestion", JSON.stringify(question));
      router.push("add-prompt-question");
    }
  };

  const handleNext = async () => {
    if (sessionQuestions.length === 0 && shouldTrackTypeSelection) {
      try {
        // Get topic ID from URL or from localStorage
        const topicIdToUpdate =
          id ||
          JSON.parse(localStorage.getItem("currentTopicDetails") || "{}")?.data
            ?.topic?._id;

        if (topicIdToUpdate) {
          await axios.put(`/api/topics/${topicIdToUpdate}`, {
            questionType: selectedType,
          });
        }
      } catch (error) {
        console.error("Error tracking question type selection:", error);
      }
    }

    // Get topic name from state or localStorage as fallback
    const displayTopicName =
      topicName ||
      JSON.parse(localStorage.getItem("currentTopic") || "{}").name ||
      "the topic";

    if (id) {
      toast.success(
        `Successfully added ${sessionQuestions.length} question to ${displayTopicName}`
      );
    } else {
      toast.success(
        `Successfully created and added ${sessionQuestions.length} question(s) to ${displayTopicName}`
      );
    }

    // Clear session questions when navigating away
    sessionStorage.removeItem(SESSION_QUESTIONS_KEY);
    localStorage.removeItem("topicTypeUpdated");
    localStorage.removeItem("currentTopic");
    localStorage.removeItem("currentTopicDetails");

    // Navigate to the next page
    setTimeout(() => {
      router.push("/college/assessments/create-assessment/select-tests");
    }, 777);
  };

  // Update the getQuestionIcon function to better handle mcqmulti
  // Replace the existing getQuestionIcon function with this improved version
  const getQuestionIcon = (questionType: string) => {
    switch (questionType) {
      case "mcq":
        return <FileText className="h-5 w-5 text-[#219CAE]" />;
      case "coding":
        return <Code className="h-5 w-5 text-blue-600" />;
      case "mcqmulti":
        return <FileText className="h-5 w-5 text-green-600" />;
      case "video":
        return <Video className="h-5 w-5 text-red-600" />;
      case "findAnswer":
        return <Search className="h-5 w-5 text-[#219CAE]" />;
      case "prompt":
        return <FileText className="h-5 w-5 text-yellow-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  if (isLoading || !topicData) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <>
      <div className="w-full mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add Questions</h2>
          <Button
            onClick={handleNext}
            className="bg-[#219CAE] hover:bg-[#1a7d8b] text-white"
          >
            Next
          </Button>
        </div>

        {/* Update the RadioGroup to disable options when a type is locked */}
        {/* Replace the existing RadioGroup with this updated version */}
        <RadioGroup
          value={selectedType}
          onValueChange={(value) => {
            if (lockedQuestionType && lockedQuestionType !== value) {
              toast(
                `${
                  lockedQuestionType === "mcq" ? "MCQ" : "Coding"
                } questions only...`
              );
              return;
            }
            setSelectedType(value);
            setShouldTrackTypeSelection(true); // Set flag when type changes
          }}
          className="space-y-4"
        >
          {questionTypes.map((type) => {
            const isDisabled =
              lockedQuestionType && lockedQuestionType !== type.id;

            return (
              <div
                key={type.id}
                className={`flex items-center border rounded-lg p-4 ${
                  isDisabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer"
                } ${
                  selectedType === type.id
                    ? "border-[#219CAE] bg-[#F5FBFC]"
                    : "border-gray-200"
                }`}
                onClick={() => {
                  if (isDisabled) {
                    // sessionStorage.removeItem(SESSION_QUESTIONS_KEY);
                    toast(
                      `${
                        lockedQuestionType === "mcq" ? "MCQ" : "Coding"
                      } questions only...`,
                      {
                        action: {
                          label: "+ Create New Topic",
                          onClick: () => {
                            setShowConfirmModal(true);
                            setPendingTopicCreation(true);
                          },
                        },
                      }
                    );
                    return;
                  }
                  setSelectedType(type.id);
                }}
              >
                <RadioGroupItem
                  value={type.id}
                  id={type.id}
                  className="mr-4"
                  disabled={
                    !!(lockedQuestionType && lockedQuestionType !== type.id)
                  }
                  onClick={(e) => isDisabled && e.preventDefault()}
                />
                <div className="flex items-center flex-1">
                  <div className="mr-3">{type.icon}</div>
                  <Label
                    htmlFor={type.id}
                    className={`font-medium text-lg ${
                      isDisabled ? "cursor-not-allowed" : "cursor-pointer"
                    }`}
                  >
                    {type.title}
                  </Label>
                </div>
                <div className="text-gray-600">{type.description}</div>
              </div>
            );
          })}
        </RadioGroup>
        <div className="flex justify-end mt-8">
          <Button
            onClick={handleAddNewQuestion}
            className="border border-[#219CAE] text-[#219CAE] bg-white hover:bg-[#F5FBFC]"
          >
            New Question
          </Button>
        </div>
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Created Questions</h3>

          {sessionQuestions.length > 0 ? (
            <div className="space-y-3">
              {sessionQuestions.map((question, index) => (
                <Card
                  key={question.id}
                  className="hover:shadow-md transition-shadow"
                  onClick={() => {
                    //handleEditQuestion(question)
                    // toast.success("Editing question is not implemented yet.")
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center 
                        ${
                          question.questionType === "mcq"
                            ? "bg-[#219CAE]/10"
                            : "bg-blue-100"
                        }`}
                        >
                          {getQuestionIcon(question.questionType)}
                        </div>
                        <h4 className="font-medium">Question {index + 1}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {question.questionLevel && (
                          <Badge variant="outline" className="capitalize">
                            {question.questionLevel}
                          </Badge>
                        )}
                        {question.totalMarks && (
                          <Badge variant="outline">
                            {question.totalMarks} mark
                            {question.totalMarks !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div
                      className="mt-2 line-clamp-2"
                      dangerouslySetInnerHTML={{ __html: question.title }}
                    />
                    {/* Update the question type display in the created questions list */}
                    {/* Find and replace the div that shows the question type text */}
                    {/* Look for this code: */}
                    {/* <div className="mt-2 text-sm text-gray-500">
                      {question.questionType === "mcq"
                        ? "Multiple Choice Question"
                        : question.questionType === "coding"
                        ? "Coding Question"
                        : "Other Question Type"}
                    </div> */}

                    {/* And replace it with: */}
                    <div className="mt-2 text-sm text-gray-500">
                      {question.questionType === "mcq"
                        ? "Multiple Choice Question"
                        : question.questionType === "coding"
                        ? "Coding Question"
                        : question.questionType === "mcqmulti"
                        ? "Multiple Choice Question (Multiple Answers)"
                        : question.questionType === "findAnswer"
                        ? "Find Answer Question"
                        : question.questionType === "prompt"
                        ? "Prompt Engineering Question"
                        : "Other Question Type"}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-lg bg-gray-50">
              <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-600 text-center">
                No questions created in this session.
              </p>
              <p className="text-gray-500 text-sm text-center mt-1">
                Click &quot;New Question&quot; to add your first question
              </p>
            </div>
          )}
        </div>
      </div>
      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center  bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <p className="text-lg text-[#219CAE] font-semibold mb-4">
              Are you sure you want to create a new topic?
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingTopicCreation(false);
                }}
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  sessionStorage.removeItem(SESSION_QUESTIONS_KEY);
                  router.push(
                    "/college/assessments/create-assessment/select-tests/create-topic"
                  );
                }}
                className="px-4 py-2 rounded bg-[#219CAE] text-white hover:bg-[#1b8a98]"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
