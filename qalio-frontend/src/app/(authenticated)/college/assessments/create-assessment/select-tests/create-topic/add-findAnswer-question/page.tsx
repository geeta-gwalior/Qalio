"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Editor } from "primereact/editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axios from "axios";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import { useAssessmentForm } from "@/hooks/use-assessment-form";
import { toast } from "sonner";

// Define types for our form data
type PassageOption = {
  text: string;
  isCorrect: boolean;
};

type PassageQuestion = {
  id: string;
  questionText: string;
  options: PassageOption[];
  // explanation: string;
};

type PassageQuestionForm = {
  id: string;
  number: number;
  title: string;
  questionTopic: "Find Answer";
  passage: string;
  questions: PassageQuestion[];
  timeLimit: string;
  questionType: "findAnswer";
  questionLevel: string;
  totalMarks: number;
};

export default function AddPassageQuestion() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { formData } = useAssessmentForm();
  const level = formData.level;

  const [currentQuestion, setCurrentQuestion] = useState<PassageQuestionForm>({
    id: `passage-question-${Date.now()}`,
    number: 1,
    title: "",
    passage: "",
    questionTopic: "Find Answer",
    questions: [
      {
        id: `question-${Date.now()}`,
        questionText: "",
        options: [
          { text: "", isCorrect: true },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
        //  explanation: "",
      },
    ],
    timeLimit: "2",
    questionType: "findAnswer",
    questionLevel: "beginner",
    totalMarks: 10,
  });

  // Session storage key for tracking questions created in current session
  const SESSION_QUESTIONS_KEY = "currentSessionQuestions";

  // Load topic data from localStorage
  useEffect(() => {
    const savedTopic = localStorage.getItem("currentTopic");
    if (!savedTopic) {
      router.push("/create-topic");
    }

    // Check if we're editing an existing question
    const editQuestion = localStorage.getItem("currentEditQuestion");
    if (editQuestion) {
      try {
        const parsedQuestion = JSON.parse(editQuestion);
        setCurrentQuestion(parsedQuestion);
        // Clear the edit question from localStorage
        localStorage.removeItem("currentEditQuestion");
      } catch (error) {
        console.error("Error parsing edit question:", error);
      }
    }
  }, [router]);

  const handleTitleChange = (value: string) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      title: value,
    }));
  };

  const handlePassageChange = (content: string) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      passage: content,
    }));
  };

  const handleQuestionTextChange = (questionIndex: number, value: string) => {
    setCurrentQuestion((prev) => {
      const newQuestions = [...prev.questions];
      newQuestions[questionIndex] = {
        ...newQuestions[questionIndex],
        questionText: value,
      };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    setCurrentQuestion((prev) => {
      const newQuestions = [...prev.questions];
      const newOptions = [...newQuestions[questionIndex].options];
      newOptions[optionIndex] = { ...newOptions[optionIndex], text: value };
      newQuestions[questionIndex] = {
        ...newQuestions[questionIndex],
        options: newOptions,
      };
      return { ...prev, questions: newQuestions };
    });
  };

  const handleCorrectOptionChange = (
    questionIndex: number,
    optionIndex: number
  ) => {
    setCurrentQuestion((prev) => {
      const newQuestions = [...prev.questions];
      const newOptions = newQuestions[questionIndex].options.map((opt, i) => ({
        ...opt,
        isCorrect: i === optionIndex,
      }));
      newQuestions[questionIndex] = {
        ...newQuestions[questionIndex],
        options: newOptions,
      };
      return { ...prev, questions: newQuestions };
    });
  };

  // const handleExplanationChange = (questionIndex: number, value: string) => {
  //   setCurrentQuestion((prev) => {
  //     const newQuestions = [...prev.questions];
  //     newQuestions[questionIndex] = {
  //       ...newQuestions[questionIndex],
  //       explanation: value,
  //     };
  //     return { ...prev, questions: newQuestions };
  //   });
  // };

  const handleTimeLimitChange = (value: string) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      timeLimit: value,
    }));
  };

  const handleQuestionLevelChange = (value: string) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      questionLevel: value,
    }));
  };

  const handleTotalMarksChange = (value: string) => {
    const marks = Number.parseInt(value);
    if (!isNaN(marks) && marks > 0) {
      setCurrentQuestion((prev) => ({
        ...prev,
        totalMarks: marks,
      }));
    }
  };

  const addNewQuestion = () => {
    const newQuestion: PassageQuestion = {
      id: `question-${Date.now()}`,
      questionText: "",
      options: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ],
      // explanation: "",
    };

    setCurrentQuestion((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const removeQuestion = (questionIndex: number) => {
    if (currentQuestion.questions.length > 1) {
      setCurrentQuestion((prev) => ({
        ...prev,
        questions: prev.questions.filter((_, index) => index !== questionIndex),
      }));
    } else {
      toast.error("At least one question is required");
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const getUserFromCookie = () => {
    try {
      const raw = document.cookie
        .split("; ")
        .find((c) => c.startsWith("userDetails="))
        ?.split("=")[1];

      if (!raw) return null;

      const decoded = decodeURIComponent(decodeURIComponent(raw));
      return JSON.parse(decoded);
    } catch (err) {
      console.error("Failed to parse userDetails from cookie", err);
      return null;
    }
  };

  // Get topic ID from localStorage
  const getTopicId = (): string | null => {
    try {
      const currentTopicDetails = localStorage.getItem("currentTopicDetails");
      if (currentTopicDetails) {
        const topicData = JSON.parse(currentTopicDetails);
        return topicData.data?.topic?._id || null;
      }
    } catch (error) {
      console.error("Error getting topic ID:", error);
    }
    return null;
  };

  // Add question to session storage
  const addQuestionToSession = (question: PassageQuestionForm) => {
    try {
      // Get existing session questions
      const savedSessionQuestions = sessionStorage.getItem(
        SESSION_QUESTIONS_KEY
      );
      const sessionQuestions = savedSessionQuestions
        ? JSON.parse(savedSessionQuestions)
        : [];

      // Check if we're editing an existing question
      const existingIndex = sessionQuestions.findIndex(
        (q: PassageQuestionForm) => q.id === question.id
      );

      if (existingIndex >= 0) {
        // Update existing question
        sessionQuestions[existingIndex] = question;
      } else {
        // Add new question
        sessionQuestions.push(question);
      }

      // Save updated questions
      sessionStorage.setItem(
        SESSION_QUESTIONS_KEY,
        JSON.stringify(sessionQuestions)
      );
    } catch (error) {
      console.error("Error saving question to session:", error);
    }
  };

  const validateQuestion = () => {
    if (!currentQuestion.title.trim()) {
      toast.error("Please enter a title");
      return false;
    }

    if (!currentQuestion.passage.trim()) {
      toast.error("Please enter the passage content");
      return false;
    }

    for (let i = 0; i < currentQuestion.questions.length; i++) {
      const question = currentQuestion.questions[i];

      if (!question.questionText.trim()) {
        toast.error(`Please enter text for question ${i + 1}`);
        return false;
      }

      if (question.options.some((option) => !option.text.trim())) {
        toast.error(`Please fill in all options for question ${i + 1}`);
        return false;
      }

      if (!question.options.some((option) => option.isCorrect)) {
        toast.error(
          `Please mark at least one option as correct for question ${i + 1}`
        );
        return false;
      }

      // if (!question.explanation.trim()) {
      //   toast.error(`Please provide an explanation for question ${i + 1}`);
      //   return false;
      // }
    }

    return true;
  };

  const handleSaveQuestion = async () => {
    if (!validateQuestion()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Get existing questions from localStorage
      const savedQuestions = localStorage.getItem("topicQuestions");
      const questions = savedQuestions ? JSON.parse(savedQuestions) : [];

      // Add to questions array
      questions.push(currentQuestion);

      // Save to localStorage
      localStorage.setItem("topicQuestions", JSON.stringify(questions));

      // Add to session storage
      addQuestionToSession(currentQuestion);

      // Get topic ID
      const topicId = getTopicId();
      if (!topicId) {
        throw new Error("No topic ID found");
      }

      // Save to API
      const user = getUserFromCookie();
      const payload = {
        topicId,
        topic: topicId,
        questionTopic: "Find Answer",
        title: currentQuestion.title,
        passage: currentQuestion.passage,
        duration: currentQuestion.timeLimit,
        questionLevel: level || currentQuestion.questionLevel,
        totalMarks: currentQuestion.totalMarks,
        createdBy: user._id,
        questionType: "findAnswer",
        questions: currentQuestion.questions.map((q) => ({
          questionText: q.questionText,
          options: q.options,
          // explanation: q.explanation,
        })),
      };

      await axios.post("/api/questions", payload);
      toast.success("Passage question saved successfully");

      // Navigate back to questions list
      router.back();
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Failed to save question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNextQuestion = async () => {
    if (!validateQuestion()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Get existing questions from localStorage
      const savedQuestions = localStorage.getItem("topicQuestions");
      const questions = savedQuestions ? JSON.parse(savedQuestions) : [];

      // Add to questions array
      questions.push(currentQuestion);

      // Save to localStorage
      localStorage.setItem("topicQuestions", JSON.stringify(questions));

      // Add to session storage
      addQuestionToSession(currentQuestion);

      // Get topic ID
      const topicId = getTopicId();
      if (!topicId) {
        throw new Error("No topic ID found");
      }

      // Save to API
      const user = getUserFromCookie();
      const payload = {
        topicId,
        topic: topicId,
        questionTopic: "Find Answer",
        title: currentQuestion.title,
        passage: currentQuestion.passage,
        duration: currentQuestion.timeLimit,
        questionLevel: level || currentQuestion.questionLevel,
        totalMarks: currentQuestion.totalMarks,
        createdBy: user._id,
        questionType: "findAnswer",
        questions: currentQuestion.questions.map((q) => ({
          questionText: q.questionText,
          options: q.options,
          // explanation: q.explanation,
        })),
      };

      await axios.post("/api/questions", payload);

      // Get existing session questions to determine next number
      const savedSessionQuestions = sessionStorage.getItem(
        SESSION_QUESTIONS_KEY
      );
      const sessionQuestions = savedSessionQuestions
        ? JSON.parse(savedSessionQuestions)
        : [];
      const nextNumber = sessionQuestions.length + 1;

      toast.success("Passage question added successfully");

      // Create next question with incremented number
      setCurrentQuestion({
        id: `passage-question-${Date.now()}`,
        number: nextNumber,
        title: "",
        passage: "",
        questions: [
          {
            id: `question-${Date.now()}`,
            questionText: "",
            options: [
              { text: "", isCorrect: true },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
              { text: "", isCorrect: false },
            ],
            //     explanation: "",
          },
        ],
        timeLimit: currentQuestion.timeLimit,
        questionType: "findAnswer",
        questionTopic: "Find Answer",
        questionLevel: currentQuestion.questionLevel,
        totalMarks: currentQuestion.totalMarks,
      });
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Failed to save question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Editor header template for toolbar customization
  const editorHeader = (
    <span className="ql-formats">
      <select className="ql-header" defaultValue="0">
        <option value="1">Heading</option>
        <option value="2">Subheading</option>
        <option value="0">Normal</option>
      </select>
      <button className="ql-bold" aria-label="Bold"></button>
      <button className="ql-italic" aria-label="Italic"></button>
      <button className="ql-underline" aria-label="Underline"></button>
      <button
        className="ql-list"
        value="ordered"
        aria-label="Ordered List"
      ></button>
      <button
        className="ql-list"
        value="bullet"
        aria-label="Bullet List"
      ></button>
      <button className="ql-link" aria-label="Insert Link"></button>
    </span>
  );

  return (
    <div className="w-full bg-none py-2">
      <div className="w-full">
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center">
            <Button onClick={handleCancel} variant="ghost" className="p-2 mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold">
              Passage Question No: {currentQuestion.number}
            </h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-2">
                    <HelpCircle className="h-4 w-4 text-gray-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create questions based on a reading passage</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-6 py-2 text-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuestion}
              className="px-6 py-2 bg-[#219CAE] hover:bg-[#1a7d8b] text-white transition-colors shadow-sm"
              disabled={isSubmitting}
            >
              Save
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-8 bg-white rounded-lg shadow-sm">
          {/* Basic Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="timeLimit" className="text-sm mb-1 block">
                Time Limit
              </Label>
              <Select
                value={currentQuestion.timeLimit}
                onValueChange={handleTimeLimitChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Time limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 minutes</SelectItem>
                  <SelectItem value="3">3 minutes</SelectItem>
                  <SelectItem value="5">5 minutes</SelectItem>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="questionLevel" className="text-sm mb-1 block">
                Difficulty Level
              </Label>
              <div
                onClick={() => {
                  if (!!level) {
                    toast(`Difficulty is locked to "${level}".`);
                  }
                }}
              >
                <Select
                  value={level ?? currentQuestion.questionLevel}
                  onValueChange={handleQuestionLevelChange}
                  disabled={!!level}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="totalMarks" className="text-sm mb-1 block">
                Total Marks
              </Label>
              <Input
                id="totalMarks"
                type="number"
                min="1"
                value={currentQuestion.totalMarks}
                onChange={(e) => handleTotalMarksChange(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="text-sm mb-1 block">
              Passage Title
            </Label>
            <Input
              id="title"
              value={currentQuestion.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter passage title"
              className="w-full"
            />
          </div>

          {/* Passage Content */}
          <div>
            <Label htmlFor="passage" className="text-sm mb-1 block">
              Passage Content
            </Label>
            <div className="border rounded-md">
              {typeof window !== "undefined" && (
                <Editor
                  value={currentQuestion.passage}
                  onTextChange={(e) => handlePassageChange(e.htmlValue || "")}
                  style={{ height: "200px" }}
                  headerTemplate={editorHeader}
                />
              )}
            </div>
          </div>

          {/* Questions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-[#219CAE]">Questions</h3>
              <Button
                onClick={addNewQuestion}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Question
              </Button>
            </div>

            <div className="space-y-6">
              {currentQuestion.questions.map((question, questionIndex) => {
                const correctOptionIndex = question.options.findIndex(
                  (opt) => opt.isCorrect
                );

                return (
                  <Card key={question.id} className="border border-gray-200">
                    <CardHeader className="bg-gray-50 border-b">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          Question {questionIndex + 1}
                        </CardTitle>
                        {currentQuestion.questions.length > 1 && (
                          <Button
                            onClick={() => removeQuestion(questionIndex)}
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      {/* Question Text */}
                      <div>
                        <Label className="text-sm mb-1 block">
                          Question Text
                        </Label>
                        <Textarea
                          value={question.questionText}
                          onChange={(e) =>
                            handleQuestionTextChange(
                              questionIndex,
                              e.target.value
                            )
                          }
                          placeholder="Enter your question here"
                          className="w-full min-h-[80px]"
                        />
                      </div>

                      {/* Options */}
                      <div>
                        <Label className="text-sm mb-2 block">Options</Label>
                        <RadioGroup
                          value={`${
                            correctOptionIndex !== -1 ? correctOptionIndex : 0
                          }`}
                          onValueChange={(value) =>
                            handleCorrectOptionChange(
                              questionIndex,
                              Number(value)
                            )
                          }
                          className="space-y-3"
                        >
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                                optionIndex === correctOptionIndex
                                  ? "bg-[#219CAE]/10 border border-[#219CAE]"
                                  : "border hover:bg-gray-50"
                              }`}
                            >
                              <RadioGroupItem
                                id={`question-${questionIndex}-option-${optionIndex}`}
                                value={`${optionIndex}`}
                                className={`h-5 w-5 ${
                                  optionIndex === correctOptionIndex
                                    ? "text-[#219CAE] border-[#219CAE]"
                                    : ""
                                }`}
                              />
                              <Input
                                value={option.text}
                                onChange={(e) =>
                                  handleOptionChange(
                                    questionIndex,
                                    optionIndex,
                                    e.target.value
                                  )
                                }
                                placeholder={`Option ${optionIndex + 1}`}
                                className={`flex-1 border-0 shadow-none focus-visible:ring-0 ${
                                  optionIndex === correctOptionIndex
                                    ? "placeholder:text-[#219CAE]/70"
                                    : ""
                                }`}
                              />
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {/* Explanation */}
                      {/* <div>
                        <Label className="text-sm mb-1 block">
                          Explanation
                        </Label>
                        <Textarea
                          value={question.explanation}
                          onChange={(e) =>
                            handleExplanationChange(
                              questionIndex,
                              e.target.value
                            )
                          }
                          placeholder="Provide an explanation for the correct answer"
                          className="w-full min-h-[60px]"
                        />
                      </div> */}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            <Button
              onClick={handleAddNextQuestion}
              className="flex items-center gap-2 bg-[#219CAE] hover:bg-[#1a7d8b] text-white transition-colors shadow-sm"
              disabled={isSubmitting}
            >
              Add Next Question
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
