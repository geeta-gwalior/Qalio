"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Code,
  FileText,
  Trash2,
  HelpCircle,
  Plus,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/progress-bar";
import { useAssessmentForm } from "@/hooks/use-assessment-form";
import { toast } from "sonner";
import axios from "axios";
import { useSelectedDataStore } from "@/stores/use-topic-store";
import type { FormTestTopic, SelectedQuestion } from "@/types/assessment";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/pagination";
import { BackHeader } from "@/components/backHeader";
import { getCookie } from "@/utils/getCookie";
// Define the steps for the progress bar
const formSteps = [
  { id: 1, name: "Name Assessment" },
  { id: 2, name: "Select Topics" },
  { id: 3, name: "Review & Submit" },
];
type Option = {
  text: string;
  isCorrect: boolean;
  _id: string;
};

type MCQQuestion = {
  _id: string;
  topic: string;
  title: string;
  duration?: number;
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
  duration?: number;
  questionLevel: string;
  questionType: "mcqmulti";
  totalMarks: number;
  options: Option[];
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
  //timeLimit: string;

  questionType: "findAnswer";
  questionLevel: string;
  totalMarks: number;
  duration: number;
};

type CodeQuestion = {
  _id: string;
  topic: string;
  title: string;
  duration: number;
  questionLevel: string;
  questionType: "coding"; //coding if not working
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

// Define types for topics received from API
interface Topic {
  _id: string;
  heading: string;
  description: string;
  totalQuestions?: number;
  questionType?: string;
  questions?: string[];
  createdByCompany?: boolean;
  createdByUniversity?: boolean;
  createdByCollege?: boolean;
  createdByAdmin?: boolean;
  status?: string;
  tags?: string[];
  difficultyLevel?: string;
  visibility?: string;
  linkedAssessments?: any[];
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
  icon?: string;
  iconElement?: React.ReactNode;
  subtitle?: string;
  duration?: string;
  type?: string; // Added type field
}

export default function SelectTests() {
  const router = useRouter();
  const { formData, updateFormData, isLoading } = useAssessmentForm();
  const [selectedSections, setSelectedSections] = useState<FormTestTopic[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [testTopics, setTestTopics] = useState<Topic[]>([]);
  const [totalSelectedQuestions, setTotalSelectedQuestions] = useState(0);
  const [maxQuestionsAllowed, setMaxQuestionsAllowed] = useState(10); // Default value
  const [activeFilter, setActiveFilter] = useState("all");
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const itemsPerPage = 8;
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingTopics, setIsLoadingTopics] = useState(true);
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<Topic | null>(null);
  const [questionsToSelect, setQuestionsToSelect] = useState(1);
  const [maxQuestionsInTopic, setMaxQuestionsInTopic] = useState(1);
  const [randomizedQuestions, setRandomizedQuestions] = useState();
  const { addOrUpdateQuestions, addOrUpdateTopic } = useSelectedDataStore();
  const token = getCookie("jwt");
  const fetchTopics = async () => {
    setIsLoadingTopics(true);
    try {
      const res = await axios.get("/api/topics", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const topicsWithIcons = res.data.data.topics.map((topic: Topic) => {
        // Determine icon based on topic type
        let icon = "file-text";
        let topicQuestions;
        let iconElement = (
          <FileText key={topic._id} className="h-5 w-5 text-gray-600" />
        );
        if (topic.type === "coding" || topic.questionType === "coding") {
          //
          icon = "code";
          iconElement = (
            <Code key={topic._id} className="h-5 w-5 text-gray-600" />
          );
        } else if (
          topic.type === "mcqmulti" ||
          topic.questionType === "mcqmulti"
        ) {
          icon = "file-text";
          iconElement = (
            <FileText key={topic._id} className="h-5 w-5 text-gray-600" />
          );
        } else if (
          topic.type === "findAnswer" ||
          topic.questionType === "findAnswer"
        ) {
          icon = "file-text";
          iconElement = (
            <FileText key={topic._id} className="h-5 w-5 text-gray-600" />
          );
        } else if (topic.type === "prompt" || topic.questionType === "prompt") {
          icon = "sparkles";
          iconElement = (
            <Sparkles key={topic._id} className="h-5 w-5 text-purple-600" />
          );
        }

        return {
          ...topic,
          icon,
          iconElement,
          subtitle: topic.description || "No description",
          duration: "10 mins",
          // Set a default difficulty level if not provided
          difficultyLevel: topic.difficultyLevel || "Medium",
        };
      });

      setTestTopics(topicsWithIcons);
    } catch (err) {
      console.error("Failed to fetch topics:", err);
      toast.error("Failed to load topics. Please try again.");
    } finally {
      setIsLoadingTopics(false);
    }
  };

  useEffect(() => {
    fetchTopics();
    const selectedFromStore = useSelectedDataStore.getState().selectedTopics;
    setSelectedSections(selectedFromStore);

    // Calculate total selected questions
    let totalQuestions = 0;
    selectedFromStore.forEach((topic) => {
      const topicQuestions = useSelectedDataStore
        .getState()
        .getQuestionsForTopic(topic._id, topic.questionType || "");
      totalQuestions += topicQuestions.length || topic.questionCount || 0;
    });
    setTotalSelectedQuestions(totalQuestions);

    // Get max questions allowed from form data
    // if (formData && formData.questions) {
    //   console.log("Entered max ques part ", formData.questions)
    //   setMaxQuestionsAllowed(Number(formData.questions));
    // }

    updateFormData({
      topics: selectedFromStore,
    });
  }, []);

  useEffect(() => {
    if (formData?.questions) {
      setMaxQuestionsAllowed(Number(formData.questions));
    }
  }, [formData?.questions]);

  useEffect(() => {
    const { selectedTopics, getQuestionsForTopic } =
      useSelectedDataStore.getState();

    // Recalculate total questions whenever selected topics change
    let totalQuestions = 0;
    selectedTopics.forEach((topic) => {
      const topicQuestions = getQuestionsForTopic(
        topic._id,
        topic.questionType || ""
      );
      totalQuestions += topicQuestions.length || topic.questionCount || 0;
    });
    setTotalSelectedQuestions(totalQuestions);
  }, [selectedSections]);

  const handleSearch = () => {
    setSearchTerm(searchQuery);
    setActivePage(1); // Reset to first page when searching
  };

  // Add a function to clear the search
  const clearSearch = () => {
    setSearchQuery("");
    setSearchTerm("");
    setActivePage(1); // Reset to first page
  };

  // Filter topics based on search and active filter
  const filteredTopics = testTopics.filter((topic) => {
    const matchesSearch =
      searchTerm === "" ||
      topic.heading.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (topic.description &&
        topic.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter =
      activeFilter === "all" ||
      (activeFilter === "mcq" &&
        (topic.type === "mcq" || topic.questionType === "mcq")) ||
      (activeFilter === "coding" &&
        (topic.type === "coding" || topic.questionType === "coding")) ||
      (activeFilter === "mcqmulti" &&
        (topic.type === "mcqmulti" || topic.questionType === "mcqmulti")) ||
      (activeFilter === "findAnswer" &&
        (topic.type === "findAnswer" || topic.questionType === "findAnswer")) ||
      (activeFilter === "prompt" &&
        (topic.type === "prompt" || topic.questionType === "prompt"));
    return matchesSearch && matchesFilter;
  });

  // Handle opening the add modal
  const handleOpenAddModal = (topic: Topic) => {
    setCurrentTopic(topic);
    setMaxQuestionsInTopic(topic.questions?.length || 10);
    setQuestionsToSelect(topic.totalQuestions || 5); // Default to all available questions
    setIsAddModalOpen(true);
  };
  const fetchedTopicQuestions = async () => {
    try {
      if (!currentTopic) return;
      const response = await axios.get(`/api/topics/${currentTopic._id}`);
      const allQuestions = response.data.data.topic.questions || [];
      return allQuestions;
    } catch (err) {
      console.log("Error in fetching the specific topic", err);
    }
  };
  // Handle adding a section with all questions
  const handleAddSection = async () => {
    if (!currentTopic) return;

    // Check if this topic with the same question type already exists
    const topicType = currentTopic.type || currentTopic.questionType || "mcq";
    const existingTopicIndex = selectedSections.findIndex(
      (section) =>
        section._id === currentTopic._id && section.questionType === topicType
    );

    if (existingTopicIndex >= 0) {
      toast.error(`This topic is already added`);
      setIsAddModalOpen(false);
      return;
    }

    // Check if adding would exceed the limit
    if (totalSelectedQuestions + questionsToSelect > maxQuestionsAllowed) {
      toast.error(
        `Adding ${questionsToSelect} questions would exceed the limit of ${maxQuestionsAllowed}`
      );
      setIsAddModalOpen(false);
      return;
    }

    // Function to get random questions
    const getRandomQuestions = (questions: any, count: number) => {
      // Make a copy of the array to avoid mutating the original
      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      // Return the first 'count' elements
      return shuffled.slice(0, count);
    };
    const allQuestions = await fetchedTopicQuestions();
    // or whatever number you want
    const randomizedQues = getRandomQuestions(allQuestions, questionsToSelect);
    //  setRandomizedQuestions(randomizedQues)

    // Now you can use randomizedQues
    if (!randomizedQues) return;

    // Create a FormTestTopic compatible object

    const formattedQuestions = randomizedQues.map((question: Question) => {
      const baseQuestion: SelectedQuestion = {
        questionId: question._id,
        title: question.title,
        questionType: question.questionType,
        totalMarks: question.totalMarks,
        _id: question._id,
        options: [], // Initialize with empty array
        duration: question.duration,
      };

      // Add options for MCQ questions
      if (question.questionType === "mcq") {
        const mcqQuestion = question as MCQQuestion;
        baseQuestion.options = mcqQuestion.options as any;
      } else if (question.questionType === "mcqmulti") {
        const multiMCQQuestion = question as MultiMCQQuestion;
        baseQuestion.options = multiMCQQuestion.options as any;
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
    });
    addOrUpdateQuestions(formattedQuestions, currentTopic._id, topicType);

    const newTopic: FormTestTopic = {
      _id: currentTopic._id,
      heading: currentTopic.heading,
      description: currentTopic.description || "No description",
      icon: currentTopic.icon || "file-text",
      type: topicType,
      questionCount: questionsToSelect,
      duration: currentTopic.duration || "10 mins",
      questionType: topicType,
      questions: formattedQuestions,
    };

    const newSelectedSections = [...selectedSections, newTopic];
    setSelectedSections(newSelectedSections);

    // Update Zustand store

    addOrUpdateTopic(newTopic);
    if (!currentTopic.questionType) {
      toast.error("Question type is required");
    }

    toast.success(
      `Added ${questionsToSelect} questions from "${currentTopic.heading}"`
    );
    setIsAddModalOpen(false);
  };

  // Handle adding a section directly (opens modal)
  const handleAddSectionDirect = (topic: Topic) => {
    // Check if this topic with the same question type already exists
    const topicType = topic.type || topic.questionType || "mcq";
    const existingTopicIndex = selectedSections.findIndex(
      (section) =>
        section._id === topic._id && section.questionType === topicType
    );

    if (existingTopicIndex >= 0) {
      toast.error(`This topic is already added`);
      return;
    }

    // Open the modal to select number of questions
    setCurrentTopic(topic);
    setMaxQuestionsInTopic(topic.questions?.length || 10);
    setQuestionsToSelect(1); // Default to 5 questions
    setIsAddModalOpen(true);
  };

  // Handle removing a section
  const removeSection = (topicId: string, questionType: string) => {
    // Call Zustand store to remove topic and associated questions
    useSelectedDataStore.getState().removeTopic(topicId, questionType);

    // Get updated list of topics from Zustand
    const updatedTopics = useSelectedDataStore.getState().selectedTopics;
    setSelectedSections(updatedTopics);

    // Update form state
    updateFormData({
      topics: updatedTopics,
    });

    toast.info("Topic removed");
  };

  // Handle next button click
  const handleNext = () => {
    // Check if we have enough questions selected
    if (totalSelectedQuestions < maxQuestionsAllowed) {
      toast.error(
        `You need to select exactly ${maxQuestionsAllowed} questions. Currently selected: ${totalSelectedQuestions}`
      );
      return;
    }

    if (totalSelectedQuestions > maxQuestionsAllowed) {
      toast.error(
        `You have selected too many questions (${totalSelectedQuestions}). Please remove some to match the required ${maxQuestionsAllowed} questions.`
      );
      return;
    }

    updateFormData({
      topics: selectedSections,
    });

    router.push("review-submit/questions");
  };

  // Handle back button click
  // const handleBack = () => {
  //   updateFormData({
  //     topics: selectedSections,
  //   });
  //   router.push("/college/assessments/create-assessment/");
  // };

  // Handle creating a new topic
  const handleCreateNewTopic = () => {
    router.push("select-tests/create-topic");
  };

  // Get the appropriate icon for a topic type
  const getTopicIcon = (type: string) => {
    switch (type) {
      case "coding":
        return <Code className="h-5 w-5" />;
      case "text":
        return <FileText className="h-5 w-5" />;
      case "mcqmulti":
        return <FileText className="h-5 w-5" />;
      case "findAnswer":
        return <FileText className="h-5 w-5" />;
      case "prompt":
        return <Sparkles className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  // Get the display name for a topic type
  const getTopicTypeName = (type: string) => {
    switch (type) {
      case "coding":
        return "Coding";
      case "mcqmulti":
        return "Multi-MCQ";
      case "findAnswer":
        return "Find Answer";
      case "prompt":
        return "Prompt";
      default:
        return "MCQ";
    }
  };

  // Get difficulty badge color
  // const getDifficultyColor = (difficulty: string) => {
  //   switch (difficulty.toLowerCase()) {
  //     case "easy":
  //       return "bg-green-100 text-green-800";
  //     case "medium":
  //       return "bg-yellow-100 text-yellow-800";
  //     case "hard":
  //       return "bg-red-100 text-red-800";
  //     default:
  //       return "bg-gray-100 text-gray-800";
  //   }
  // };

  // Check if a topic is already selected
  const isTopicSelected = (topicId: string, type: string) => {
    return selectedSections.some(
      (section) => section._id === topicId && section.questionType === type
    );
  };

  //Pagination Part
  const paginatedActive = filteredTopics
    .slice()
    .reverse()
    .slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }
  if (isLoadingTopics) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#219CAE]"></div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4 py-6">
      {/* Header with back button and title */}
      <div className="flex items-center justify-between mb-6">
        <BackHeader
          title="Select Topics for Assessment"
          defaultRoute="/company/assessments/create-assessment"
        />
        <Button
          className="bg-[#219CAE] hover:bg-[#1a7d8b] text-white px-6"
          onClick={handleNext}
          disabled={totalSelectedQuestions !== maxQuestionsAllowed}
        >
          Next
        </Button>
      </div>

      {/* Progress bar component */}
      <div className="mb-8">
        <ProgressBar currentStep={2} steps={formSteps} />
      </div>

      <div className="bg-white rounded-lg border p-6 mb-6">
        {/* Question count indicator */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold">Question Count</h2>
            <p className="text-gray-600">
              Selected {totalSelectedQuestions} questions from{" "}
              {selectedSections.length} topics
              {totalSelectedQuestions < maxQuestionsAllowed && (
                <span className="ml-2 text-red-500 text-sm font-medium px-2 py-0.5 rounded-full bg-red-50">
                  Select at least 1 topic
                </span>
              )}
            </p>
          </div>
          <div className="text-xl font-bold">
            {totalSelectedQuestions}/{maxQuestionsAllowed}
          </div>
        </div>

        {/* Selected Topics */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Selected Topics</h2>

          {selectedSections.length === 0 ? (
            <div className="bg-gray-50 border border-dashed rounded-lg p-8 text-center">
              <p className="text-gray-500 font-medium mb-1">
                No topics selected yet
              </p>
              <p className="text-gray-400 text-sm">
                Browse and select topics from the library below
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedSections.map((section) => (
                <div
                  key={`${section._id}-${section.questionType}`}
                  className="border rounded-lg p-4 relative hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center mb-2">
                    <div className="bg-gray-100 p-1 rounded-md mr-2">
                      {getTopicIcon(
                        section.questionType || section.type || "mcq"
                      )}
                    </div>
                    <span className="font-medium">
                      {getTopicTypeName(
                        section.questionType || section.type || "mcq"
                      )}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">
                    {section.heading}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {section.description}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">
                      {section.questions?.length || 0} questions
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-0 h-auto"
                      onClick={() =>
                        removeSection(section._id, section.questionType || "")
                      }
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Topic Library */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <h2 className="text-lg font-semibold">Topic Library</h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-auto ml-2"
                      onClick={() => setShowHelpGuide(true)}
                    >
                      <HelpCircle className="h-5 w-5 text-gray-400" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Need help? Click for guidance</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Button
              onClick={handleCreateNewTopic}
              className="bg-[#219CAE] hover:bg-[#1a7d8b] text-white"
            >
              <Plus className="h-4 w-4 mr-1" /> Add New Topic
            </Button>
          </div>

          {/* Search and filter */}
          <div className="flex flex-col flex-wrap md:flex-row gap-4 mb-6">
            <div className="flex-grow flex relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />

              {/* Input container with relative positioning */}
              <div className="relative w-64">
                <Input
                  placeholder="Search topics..."
                  className="pl-10 pr-8 w-full rounded-r-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={clearSearch}
                    aria-label="Clear search"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>

              <Button
                type="button"
                className="rounded-l-none bg-[#219CAE] hover:bg-[#1a7d8b] text-white"
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("all")}
                className={`min-w-[80px] text-white ${
                  activeFilter === "all"
                    ? "bg-gray-300 hover:bg-gray-400 text-black"
                    : "bg-[#219CAE] hover:bg-[#1a7d8b]"
                }`}
              >
                All
              </Button>
              <Button
                variant={activeFilter === "mcq" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("mcq")}
                className={`min-w-[80px] text-white ${
                  activeFilter === "mcq"
                    ? "bg-gray-300 hover:bg-gray-400 text-black"
                    : "bg-[#219CAE] hover:bg-[#1a7d8b]"
                }`}
              >
                <FileText className="h-4 w-4 mr-1" /> MCQ
              </Button>
              <Button
                variant={activeFilter === "coding" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("coding")}
                className={`min-w-[80px] text-white ${
                  activeFilter === "coding"
                    ? "bg-gray-300 hover:bg-gray-400 text-black"
                    : "bg-[#219CAE] hover:bg-[#1a7d8b]"
                }`}
              >
                <Code className="h-4 w-4 mr-1" /> Coding
              </Button>
              <Button
                variant={activeFilter === "mcqmulti" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("mcqmulti")}
                className={`min-w-[80px] text-white ${
                  activeFilter === "mcqmulti"
                    ? "bg-gray-300 hover:bg-gray-400 text-black"
                    : "bg-[#219CAE] hover:bg-[#1a7d8b]"
                }`}
              >
                <FileText className="h-4 w-4 mr-1" /> Multi-MCQ
              </Button>
              <Button
                variant={activeFilter === "findAnswer" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("findAnswer")}
                className={`min-w-[80px] text-white ${
                  activeFilter === "findAnswer"
                    ? "bg-gray-300 hover:bg-gray-400 text-black"
                    : "bg-[#219CAE] hover:bg-[#1a7d8b]"
                }`}
              >
                <FileText className="h-4 w-4 mr-1" /> Find Answer
              </Button>
              <Button
                variant={activeFilter === "prompt" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter("prompt")}
                className={`min-w-[80px] text-white ${
                  activeFilter === "prompt"
                    ? "bg-gray-300 hover:bg-gray-400 text-black"
                    : "bg-[#219CAE] hover:bg-[#1a7d8b]"
                }`}
              >
                <Sparkles className="h-4 w-4 mr-1" /> Prompt
              </Button>
              {/* <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 bg-transparent"
              >
                <Filter className="h-4 w-4" /> Filters
              </Button> */}
            </div>
          </div>

          {/* Topic grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {paginatedActive.map((topic) => {
              const topicType = topic.type || topic.questionType || "mcq";
              const isSelected = isTopicSelected(topic._id, topicType);

              return (
                <Card
                  key={topic._id}
                  className={`border ${
                    isSelected ? "border-2 border-[#219CAE]" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center mb-2">
                      <div className="bg-gray-100 p-1 rounded-md mr-2">
                        {getTopicIcon(topicType)}
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full`}
                      ></span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">
                      {topic.heading}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {topic.description}
                    </p>
                    <p className="text-gray-700 text-sm mb-2">
                      {topic.questions?.length || 0} Question(s)
                    </p>
                  </CardContent>
                  <CardFooter className="px-4 py-3 border-t flex justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(
                          `topic-details/${topic._id}?type=${topicType}`
                        )
                      }
                    >
                      View Details
                    </Button>
                    {isSelected ? (
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-black text-white"
                        disabled
                      >
                        Added
                      </Button>
                    ) : topic.questions?.length === 0 ? (
                      <span
                        onClick={() =>
                          toast.error("This topic has no questions")
                        }
                        className="inline-block"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          className="pointer-events-none opacity-50"
                        >
                          Add
                        </Button>
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSectionDirect(topic)}
                      >
                        Add
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
          <div>
            <Pagination
              currentPage={activePage}
              totalItems={filteredTopics.length}
              itemsPerPage={itemsPerPage}
              onPageChange={setActivePage}
              className="mt-6"
            />
          </div>
        </div>
      </div>

      {/* Help Guide Dialog */}
      <Dialog open={showHelpGuide} onOpenChange={setShowHelpGuide}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>How to Create Your Assessment</DialogTitle>
            <DialogDescription>
              Follow these steps to create your assessment quickly and easily.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-[#219CAE] text-white flex items-center justify-center mr-3 flex-shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Browse Topics</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Use the filters to find topics by question type (MCQ,
                    Coding, Text) or use the search bar to find specific topics.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-[#219CAE] text-white flex items-center justify-center mr-3 flex-shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Add Topics</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Click the &quot;Add&quot; button on any topic card to add
                    all questions from that topic to your assessment.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-[#219CAE] text-white flex items-center justify-center mr-3 flex-shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Meet the Question Requirement</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    You need to select exactly {maxQuestionsAllowed} questions
                    total. The counter at the top shows how many you&apos;ve
                    selected.
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-[#219CAE] text-white flex items-center justify-center mr-3 flex-shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-medium">Review and Continue</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Once you&apos;ve selected exactly {maxQuestionsAllowed}{" "}
                    questions, click &quot;Next&quot; to review your assessment.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setShowHelpGuide(false)}
              className="bg-[#219CAE] hover:bg-[#1a7d8b] text-white"
            >
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Questions Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Add Questions from {currentTopic?.heading}
            </DialogTitle>
            <DialogDescription>
              Select how many random questions you want to include from this
              topic.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="questionCount" className="text-sm font-medium">
                  Number of Random Questions
                </Label>
                <div className="flex items-center mt-2">
                  <Input
                    id="questionCount"
                    type="number"
                    min="1"
                    max={maxQuestionsInTopic}
                    value={questionsToSelect === 0 ? "" : questionsToSelect}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Allow empty string for better UX when user is typing
                      if (value === "") {
                        setQuestionsToSelect(0); // Use 0 to represent empty state
                        return;
                      }

                      // Parse the number and update if valid
                      const numValue = Number.parseInt(value, 10);
                      if (!isNaN(numValue) && numValue >= 0) {
                        // Don't enforce max limit during typing, just store the value
                        setQuestionsToSelect(numValue);
                      }
                    }}
                    onBlur={() => {
                      // When input loses focus, ensure valid value within bounds
                      if (questionsToSelect === 0 || questionsToSelect < 1) {
                        setQuestionsToSelect(1);
                      } else if (questionsToSelect > maxQuestionsInTopic) {
                        setQuestionsToSelect(maxQuestionsInTopic);
                      }
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="w-full"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum available: {maxQuestionsInTopic} questions
                </p>
              </div>

              {totalSelectedQuestions + (questionsToSelect || 1) >
                maxQuestionsAllowed && (
                <div className="p-3 bg-red-50 text-orange-500 rounded-md flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      Question limit exceeded
                    </p>
                    <p className="text-xs mt-1">
                      Adding {questionsToSelect || 1} questions would exceed
                      your limit of {maxQuestionsAllowed}. You can add up to{" "}
                      {maxQuestionsAllowed - totalSelectedQuestions} questions
                      only.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSection}
              className="bg-[#219CAE] hover:bg-[#1a7d8b] text-white"
              disabled={
                totalSelectedQuestions + (questionsToSelect || 1) >
                  maxQuestionsAllowed || questionsToSelect === 0
              }
            >
              Add Questions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
