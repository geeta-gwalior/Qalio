"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Editor } from "primereact/editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
// Import PrimeReact CSS
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import { useAssessmentForm } from "@/hooks/use-assessment-form";
import { toast } from "sonner";

// Define types for our form data
type MCQQuestion = {
  id: string;
  number: number;
  title: string;
  options: {
    text: string;
    isCorrect: boolean;
  }[];
  timeLimit: string;
  questionType: "mcqmulti";
  questionLevel: string;
  totalMarks: number;
  questionTopic: string;
};

export default function AddMCQQuestion() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<MCQQuestion>({
    id: `question-${Date.now()}`,
    number: 1,
    title: "",
    options: [
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ],
    timeLimit: "1",
    questionType: "mcqmulti",
    questionLevel: "beginner",
    totalMarks: 1,
    questionTopic: "",
  });
  const { formData } = useAssessmentForm();

  // Session storage key for tracking questions created in current session
  const SESSION_QUESTIONS_KEY = "currentSessionQuestions";
  const level = formData.level;

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

  const handleQuestionTitleChange = (content: string) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      title: content,
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setCurrentQuestion((prev) => {
      const newOptions = [...prev.options];
      newOptions[index] = { ...newOptions[index], text: value };
      return { ...prev, options: newOptions };
    });
  };

  const handleCorrectOptionChange = (index: number) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => ({
        ...opt,
        isCorrect: i === index ? !opt.isCorrect : opt.isCorrect,
      })),
    }));
  };

  const handleTimeLimitChange = (value: string) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      timeLimit: value,
    }));
  };

  const handleQuestionLevelChange = () => {
    setCurrentQuestion((prev) => ({
      ...prev,
      questionLevel: level,
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

  const handleQuestionTopicChange = (value: string) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      questionTopic: value,
    }));
  };

  const handleCancel = () => {
    // router.push(
    //   "/college/assessments/create-assessment/select-tests/create-topic/add-questions"
    // );
    router.back();
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
  const addQuestionToSession = (question: MCQQuestion) => {
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
        (q: MCQQuestion) => q.id === question.id
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
  const handleSaveQuestion = async () => {
    // Validate question
    if (!currentQuestion.title.trim()) {
      toast("Please enter a question");
      return;
    }
    if (!currentQuestion.questionTopic.trim()) {
      toast("Please enter a question topic");
      return;
    }

    if (currentQuestion.options.some((option) => !option.text.trim())) {
      toast("Please fill in all options");
      return;
    }

    // Make sure at least one option is marked as correct
    if (!currentQuestion.options.some((option) => option.isCorrect)) {
      toast("Please mark at least one option as correct");
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
      await axios.post("/api/questions", {
        topicId,
        topic: topicId,
        createdBy: user._id,
        title: currentQuestion.title,
        duration: currentQuestion.timeLimit,
        questionLevel: level,
        options: currentQuestion.options,
        questionType: "mcqmulti",
        totalMarks: currentQuestion.totalMarks,
        questionTopic: currentQuestion.questionTopic,
      });
      toast.success("Question saved successfully");
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
    // Validate question
    if (!currentQuestion.title.trim()) {
      toast("Please enter a question");
      return;
    }
    if (!currentQuestion.questionTopic.trim()) {
      toast("Please enter a question topic");
      return;
    }

    if (currentQuestion.options.some((option) => !option.text.trim())) {
      toast("Please fill in all options");
      return;
    }

    // Make sure at least one option is marked as correct
    if (!currentQuestion.options.some((option) => option.isCorrect)) {
      toast("Please mark at least one option as correct");
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
      const user = getUserFromCookie();
      // Save to API
      await axios.post("/api/questions", {
        topicId,
        topic: topicId,
        createdBy: user._id,
        title: currentQuestion.title,
        duration: currentQuestion.timeLimit,
        questionLevel: currentQuestion.questionLevel,
        options: currentQuestion.options,
        questionType: "mcqmulti",
        totalMarks: currentQuestion.totalMarks,
        questionTopic: currentQuestion.questionTopic,
      });
      // Get existing session questions to determine next number
      const savedSessionQuestions = sessionStorage.getItem(
        SESSION_QUESTIONS_KEY
      );
      const sessionQuestions = savedSessionQuestions
        ? JSON.parse(savedSessionQuestions)
        : [];
      const nextNumber = sessionQuestions.length + 1;
      toast.success("Question Added successfully");
      // Create next question with incremented number
      setCurrentQuestion({
        id: `question-${Date.now()}`,
        number: nextNumber,
        title: "",
        options: [
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ],
        timeLimit: currentQuestion.timeLimit,
        questionType: "mcqmulti",
        questionLevel: currentQuestion.questionLevel,
        totalMarks: currentQuestion.totalMarks,
        questionTopic: "",
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
      <div className="w-full   ">
        <div className="flex justify-between items-center p-4 ">
          <div className="flex items-center">
            <Button onClick={handleCancel} variant="ghost" className="p-2 mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h2 className="text-xl font-semibold">
              Question No: {currentQuestion.number}
            </h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="px-6 py-2 text-gray-600 bg-transparent"
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

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-lg shadow-sm">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-[#219CAE]">
                Question
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="timeLimit" className="text-sm mb-1 block">
                    Time Limit
                  </Label>
                  <Select
                    value={String(currentQuestion.timeLimit)}
                    onValueChange={handleTimeLimitChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Time limit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minute</SelectItem>
                      <SelectItem value="2">2 minutes</SelectItem>
                      <SelectItem value="3">3 minutes</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
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
                        <SelectItem value="intermediate">
                          Intermediate
                        </SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="mb-4">
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
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Label htmlFor="questionTopic" className="text-sm">
                    Topic
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Topic examples: Binary search, DSA, Computer Networks
                          etc
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="questionTopic"
                  type="text"
                  value={currentQuestion.questionTopic}
                  onChange={(e) => handleQuestionTopicChange(e.target.value)}
                  placeholder="Enter question topic"
                  className="w-full"
                />
              </div>
              <div className="border rounded-md">
                {typeof window !== "undefined" && (
                  <Editor
                    value={currentQuestion.title}
                    onTextChange={(e) =>
                      handleQuestionTitleChange(e.htmlValue || "")
                    }
                    style={{ height: "200px" }}
                    headerTemplate={editorHeader}
                  />
                )}
              </div>
            </div>

            <Button
              onClick={handleAddNextQuestion}
              className="flex items-center gap-2 bg-[#219CAE] hover:bg-[#1a7d8b] text-white transition-colors shadow-sm"
              disabled={isSubmitting}
            >
              Add Next Question
            </Button>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4 text-[#219CAE]">Options</h3>
            <div className="space-y-4">
              {currentQuestion.options.map((option, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                    option.isCorrect
                      ? "bg-[#219CAE]/10 border border-[#219CAE]"
                      : "border hover:bg-gray-50"
                  }`}
                >
                  <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      id={`option-${index}`}
                      checked={option.isCorrect}
                      onChange={() => handleCorrectOptionChange(index)}
                      className="peer hidden"
                    />
                    <div
                      className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors
      ${
        option.isCorrect
          ? "bg-[#219CAE] border-[#219CAE]"
          : "border-gray-300 bg-white"
      }`}
                    >
                      {/* Check icon (optional) */}
                      {option.isCorrect && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </label>

                  <Input
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className={`flex-1 border-0 shadow-none focus-visible:ring-0 ${
                      option.isCorrect
                        ? "text-[#219CAE] placeholder:text-[#219CAE]"
                        : ""
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
