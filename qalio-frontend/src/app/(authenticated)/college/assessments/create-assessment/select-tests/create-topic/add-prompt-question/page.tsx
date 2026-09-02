"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Editor } from "primereact/editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
// Import PrimeReact CSS
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import { useAssessmentForm } from "@/hooks/use-assessment-form";
import { toast } from "sonner";

// Define types for our form data
type PromptQuestion = {
  id: string;
  number: number;
  title: string;
  expectedOutputDescription: string;
  timeLimit: string;
  questionType: "prompt";
  questionLevel: string;
  totalMarks: number;
};

export default function AddPromptQuestion() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<PromptQuestion>({
    id: `question-${Date.now()}`,
    number: 1,
    title: "",
    expectedOutputDescription: "",
    timeLimit: "20",
    questionType: "prompt",
    questionLevel: "beginner",
    totalMarks: 10,
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

  const handleExpectedOutputChange = (value: string) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      expectedOutputDescription: value,
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

  const handleCancel = () => {
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
  const addQuestionToSession = (question: PromptQuestion) => {
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
        (q: PromptQuestion) => q.id === question.id
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

    if (!currentQuestion.expectedOutputDescription.trim()) {
      toast("Please provide expected output description");
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
        questionType: "prompt",
        questionTopic: "prompt",
        topicId,
        topic: topicId,
        expectedOutputDescription: currentQuestion.expectedOutputDescription,
        title: currentQuestion.title,
        createdBy: user._id,
        totalMarks: currentQuestion.totalMarks,
        duration: currentQuestion.timeLimit,
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

    if (!currentQuestion.expectedOutputDescription.trim()) {
      toast("Please provide expected output description");
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
        questionType: "prompt",
        topicId,
        questionTopic: "prompt",
        topic: topicId,
        expectedOutputDescription: currentQuestion.expectedOutputDescription,
        title: currentQuestion.title,
        createdBy: user._id,
        totalMarks: currentQuestion.totalMarks,
        duration: currentQuestion.timeLimit,
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
        expectedOutputDescription: "",
        timeLimit: currentQuestion.timeLimit,
        questionType: "prompt",
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
          <div className="flex items-center gap-3">
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

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-lg shadow-sm">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2 text-[#219CAE]">
                Question
              </h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="timeLimit" className="text-sm mb-1 block">
                    Time Limit (minutes)
                  </Label>
                  <Select
                    value={String(currentQuestion.timeLimit)}
                    onValueChange={handleTimeLimitChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Time limit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="20">20 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
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
              <div className="border rounded-md">
                {typeof window !== "undefined" && (
                  <Editor
                    value={currentQuestion.title}
                    onTextChange={(e) =>
                      handleQuestionTitleChange(e.htmlValue || "")
                    }
                    style={{ height: "200px" }}
                    headerTemplate={editorHeader}
                    placeholder="Enter your question prompt here..."
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

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4 text-[#219CAE]">
                Expected Output Description
              </h3>
              <div className="space-y-4">
                <div className="bg-white border border-[#219CAE] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-[#219CAE]" />
                    <span className="text-sm font-medium text-[#219CAE]">
                      AI Evaluation Criteria
                    </span>
                  </div>
                  <p className="text-sm text-[#219CAE]">
                    Describe what a good answer should include. This helps AI
                    evaluate student responses accurately.
                  </p>
                </div>

                <div>
                  <Label
                    htmlFor="expectedOutput"
                    className="text-sm mb-2 block"
                  >
                    Expected Output Description
                  </Label>
                  <Textarea
                    id="expectedOutput"
                    value={currentQuestion.expectedOutputDescription}
                    onChange={(e) => handleExpectedOutputChange(e.target.value)}
                    placeholder="e.g., Should cover evaporation, condensation, precipitation, and collection. Must explain the role of the sun as the energy source and describe how water moves through different states."
                    className="min-h-[120px] resize-none"
                  />
                </div>

                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="text-sm font-medium mb-2 text-gray-700">
                    Tips for better AI evaluation:
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li>• List key concepts that must be covered</li>
                    <li>• Specify the depth of explanation required</li>
                    <li>• Mention any specific examples or processes</li>
                    <li>• Include formatting requirements if any</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
