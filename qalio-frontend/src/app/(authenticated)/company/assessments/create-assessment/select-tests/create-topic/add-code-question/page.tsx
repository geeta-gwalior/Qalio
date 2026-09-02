"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  ChevronUp,
  ChevronDown,
  Info,
  HelpCircle,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Editor } from "primereact/editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Editor as CodeEditor } from "@monaco-editor/react";
import { getCookie } from "@/utils/getCookie";
import axios from "axios";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { CodeQuestion, SavedTestCaseLanguage } from "@/types/assessment";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import { useAssessmentForm } from "@/hooks/use-assessment-form";
const defaultCodeTemplates: {
  [key: string]: {
    defaultCode: string;
    solutionCode: string;
  };
} = {
  java: {
    defaultCode:
      "import java.io.*;\n\npublic class Main {\n    public static void main(String[] args {\n        // Insert your Java solution code here\n    }\n}",
    solutionCode:
      "import java.io.*;\n\npublic class Main {\n    public static void main(String[] args {\n        // Solution code here\n    }\n}",
  },
  python: {
    defaultCode:
      "def solution():\n    # Insert your Python solution code here\n    pass",
    solutionCode: "def solution():\n    # Solution code here\n    pass",
  },
  c: {
    defaultCode:
      "#include <stdio.h>\n\nint main() {\n    // Insert your C solution code here\n    return 0;\n}",
    solutionCode:
      "#include <stdio.h>\n\nint main() {\n    // Solution code here\n    return 0;\n}",
  },
  cpp: {
    defaultCode:
      "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Insert your C++ solution code here\n    return 0;\n}",
    solutionCode:
      "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Solution code here\n    return 0;\n}",
  },
};

// 1. Add a constant for the localStorage key at the top of the file, after the defaultCodeTemplates
const LOCAL_STORAGE_CURRENT_CODE_QUESTION_KEY = "currentCodeQuestion";

export default function AddCodeQuestion() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("initial-code");
  const [isHintOpen, setIsHintOpen] = useState(false);
  const [isShowingTestCases, setIsShowingTestCases] = useState(false);
  const [isTestCaseSuccessful, setIsTestCaseSuccessful] = useState(false);
  const [savedTestCases, setSavedTestCases] = useState<SavedTestCaseLanguage[]>(
    []
  );
  const [isSavedTestCasesOpen, setIsSavedTestCasesOpen] = useState(false);
  const [currentTestCaseInput, setCurrentTestCaseInput] = useState("");
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const { formData } = useAssessmentForm();
  // Track which languages have validated test cases
  const [validatedLanguages, setValidatedLanguages] = useState<Set<string>>(
    new Set()
  );
  const [currentQuestion, setCurrentQuestion] = useState<CodeQuestion>({
    id: `question-${Date.now()}`,
    number: 1,
    title: "",
    language: "java",
    timeLimit: "30",
    questionLevel: "beginner",
    questionTopic: "",
    totalMarks: 10,
    codeQuestion: "",
    parameters: [""],
    returnType: "integer",
    code: {
      Java: {
        defaultCode: defaultCodeTemplates.java.defaultCode,
        solutionCode: defaultCodeTemplates.java.solutionCode,
      },
    },
    testcase: [
      {
        input: "",
        expectedOutput: "",
        isHidden: false,
      },
    ],
    totalTestCases: 1,
    questionType: "coding",
    generatedDriverCode: false,
  });

  // Session storage key for tracking questions created in current session
  const SESSION_QUESTIONS_KEY = "currentSessionQuestions";

  // Let's also add a state variable to track compilation status and a mock function to simulate running code
  // Add this after the other state variables:
  const [compilerResponse, setCompilerResponse] = useState("");
  const [compilationStatus, setCompilationStatus] = useState<
    "success" | "warning" | "error" | null
  >(null);
  const [compilationMessage, setCompilationMessage] = useState<string>("");
  const [isCurrentTestCaseHidden, setIsCurrentTestCaseHidden] = useState(false);
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(true);
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

        // If editing, set validated languages based on existing test cases
        if (parsedQuestion.testcase && parsedQuestion.testcase.length > 0) {
          setValidatedLanguages(new Set([parsedQuestion.language]));
        }

        // Clear the edit question from localStorage
        localStorage.removeItem("currentEditQuestion");
      } catch (error) {
        toast.error("Failed to load question data. Please try again.");
      }
    }

    // Check if first time guide has been shown before
    const hasSeenGuide = localStorage.getItem("hasSeenCodeQuestionGuide");
    if (hasSeenGuide) {
      setShowFirstTimeGuide(false);
    }
  }, [router]);

  // 2. Add useEffect to load data from localStorage on component mount, after the existing useEffect
  useEffect(() => {
    // Load saved question data from localStorage
    const savedQuestionData = localStorage.getItem(
      LOCAL_STORAGE_CURRENT_CODE_QUESTION_KEY
    );
    if (savedQuestionData) {
      try {
        const parsedData = JSON.parse(savedQuestionData);
        setCurrentQuestion(parsedData);

        // If there are saved test cases, load them too
        if (parsedData.savedTestCases && parsedData.savedTestCases.length > 0) {
          setSavedTestCases(parsedData.savedTestCases);

          // Set validated languages based on saved test cases
          const languages = new Set<string>();
          parsedData.savedTestCases.forEach((testCase: any) => {
            if (testCase.language) {
              languages.add(testCase.language);
            }
          });
          setValidatedLanguages(languages);
        }
      } catch (error) {
        console.error("Error parsing saved question data:", error);
      }
    }
  }, []);

  // 3. Add useEffect to save data to localStorage whenever it changes
  useEffect(() => {
    // Don't save if it's the initial empty state
    if (
      currentQuestion.title ||
      currentQuestion.codeQuestion ||
      savedTestCases.length > 0
    ) {
      // Save the current question data including test cases
      const dataToSave = {
        ...currentQuestion,
        savedTestCases: savedTestCases,
      };
      localStorage.setItem(
        LOCAL_STORAGE_CURRENT_CODE_QUESTION_KEY,
        JSON.stringify(dataToSave)
      );
    }
  }, [currentQuestion, savedTestCases]);

  const handleCodeQuestionChange = (content: string) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      codeQuestion: content,
    }));
  };

  const handleLanguageChange = (value: string) => {
    const languageName = value.charAt(0).toUpperCase() + value.slice(1);

    setCurrentQuestion((prev) => {
      // Create a new code object with the selected language
      const newCode = { ...prev.code };

      // If this language doesn't exist yet, add it
      if (!newCode[languageName]) {
        // Type assertion to tell TypeScript this is a valid key
        const templateKey = value as keyof typeof defaultCodeTemplates;
        newCode[languageName] = {
          defaultCode: defaultCodeTemplates[templateKey].defaultCode,
          solutionCode: defaultCodeTemplates[templateKey].solutionCode,
        };
      }

      return {
        ...prev,
        language: value,
        code: newCode,
      };
    });

    // Reset test case state when language changes
    setIsTestCaseSuccessful(false);
    setCompilerResponse("");
    setCompilationStatus(null);
    setCompilationMessage("");

    // Switch to solution code tab when language changes
    setActiveTab("solution-code");
    setIsShowingTestCases(true);
  };

  const handleTimeLimitChange = (value: string) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      timeLimit: value,
    }));
  };

  const handleQuestionLevelChange = (
    value: "beginner" | "intermediate" | "advanced"
  ) => {
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

  const handleQuestionTopicChange = (value: string) => {
    setCurrentQuestion((prev) => ({
      ...prev,
      questionTopic: value,
    }));
  };

  const handleDefaultCodeChange = (value: string | undefined) => {
    if (value === undefined) return;

    const languageName =
      currentQuestion.language.charAt(0).toUpperCase() +
      currentQuestion.language.slice(1);

    setCurrentQuestion((prev) => {
      const newCode = { ...prev.code };
      if (newCode[languageName]) {
        newCode[languageName] = {
          ...newCode[languageName],
          defaultCode: value,
        };
      }
      return { ...prev, code: newCode };
    });
  };

  const handleSolutionCodeChange = (value: string | undefined) => {
    if (value === undefined) return;

    const languageName =
      currentQuestion.language.charAt(0).toUpperCase() +
      currentQuestion.language.slice(1);

    setCurrentQuestion((prev) => {
      const newCode = { ...prev.code };
      if (newCode[languageName]) {
        newCode[languageName] = {
          ...newCode[languageName],
          solutionCode: value,
        };
      }
      return { ...prev, code: newCode };
    });
  };

  const handleTestCaseInputChange = (value: string) => {
    setCurrentTestCaseInput(value);
    // Reset the success state when input changes
    setIsTestCaseSuccessful(false);
  };

  const handleTestCaseHiddenChange = (checked: boolean) => {
    setIsCurrentTestCaseHidden(checked);
  };

  const handleSavedTestCaseHiddenChange = (id: string, checked: boolean) => {
    setSavedTestCases(
      savedTestCases.map((tc) =>
        tc.id === id ? { ...tc, isHidden: checked } : tc
      )
    );
  };

  // Replace the handleAddTestCase function with this improved version
  const handleAddTestCase = () => {
    if (!isTestCaseSuccessful) {
      toast.error(
        "Please run the code first and ensure it executes successfully"
      );
      return;
    }

    // Add the current language to validated languages
    const updatedValidatedLanguages = new Set(validatedLanguages);
    updatedValidatedLanguages.add(currentQuestion.language);
    setValidatedLanguages(updatedValidatedLanguages);

    // Add the current test case to the saved test cases
    const newSavedTestCase: SavedTestCaseLanguage = {
      id: `test-case-${Date.now()}`,
      input: currentTestCaseInput,
      output: compilerResponse,
      isHidden: isCurrentTestCaseHidden,
      language: currentQuestion.language, // Store the language with the test case
    };

    setSavedTestCases([...savedTestCases, newSavedTestCase]);

    // Add to the question's test cases
    setCurrentQuestion((prev) => {
      const newTestCases = [...prev.testcase];
      newTestCases[0] = {
        input: currentTestCaseInput,
        expectedOutput: compilerResponse,
        isHidden: isCurrentTestCaseHidden,
      };
      return {
        ...prev,
        testcase: newTestCases,
        totalTestCases: newTestCases.length,
      };
    });

    // Reset the current test case input and compiler response
    setCurrentTestCaseInput("");
    setCompilerResponse("");
    setCompilationStatus(null);
    setCompilationMessage("");
    setIsTestCaseSuccessful(false);
    setIsCurrentTestCaseHidden(false);

    // Open the saved test cases dropdown if it's the first test case
    if (savedTestCases.length === 0) {
      setIsSavedTestCasesOpen(true);
    }

    toast.success(
      `Test case added successfully for ${currentQuestion.language}`
    );
  };

  const handleCancel = () => {
    // router.push("/college/assessments/create-assessment/select-tests/create-topic/add-questions")
    router.back();
  };

  const getUserFromCookie = () => {
    try {
      const raw = getCookie("userDetails");
      if (!raw) return null;

      const decoded = decodeURIComponent(decodeURIComponent(raw));
      return JSON.parse(decoded);
    } catch (err) {
      toast.error("Failed to parse userDetails from cookie");
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

  // Add question to session storage
  const addQuestionToSession = (question: CodeQuestion) => {
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
        (q: CodeQuestion) => q.id === question.id
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
      toast.error("Error saving question to session:" + error);
    }
  };

  // Replace the prepareDataForSubmission function with this improved version
  const prepareDataForSubmission = () => {
    const user = getUserFromCookie();
    const topicId = getTopicId();

    if (!user) {
      throw new Error("User not logged in properly");
    }

    if (!topicId) {
      throw new Error("No topic ID found");
    }

    // Create a new code object that ONLY includes languages with validated test cases
    const validatedCode: Record<string, any> = {};

    // Check which languages have test cases
    const languagesWithTestCases = new Set<string>();
    savedTestCases.forEach((testCase) => {
      if (testCase.language) {
        languagesWithTestCases.add(testCase.language);
      }
    });

    // Only include languages that have test cases
    for (const language of languagesWithTestCases) {
      const langCapitalized =
        language.charAt(0).toUpperCase() + language.slice(1);
      if (currentQuestion.code[langCapitalized]) {
        validatedCode[langCapitalized] = currentQuestion.code[langCapitalized];
      }
    }

    // If no languages have test cases, include only the current language if it has test cases
    if (
      Object.keys(validatedCode).length === 0 &&
      validatedLanguages.has(currentQuestion.language)
    ) {
      const langCapitalized =
        currentQuestion.language.charAt(0).toUpperCase() +
        currentQuestion.language.slice(1);
      validatedCode[langCapitalized] = currentQuestion.code[langCapitalized];
    }

    // Prepare the data in the format required by the API
    return {
      topicId,
      topic: topicId,
      section: user.section || user.department || "",
      title: currentQuestion.title,
      duration: currentQuestion.timeLimit,
      questionLevel: level,
      questionTopic: currentQuestion.questionTopic,
      questionType: "coding",
      generatedDriverCode: currentQuestion.generatedDriverCode,
      code: validatedCode, // Only include validated languages
      codeQuestion: currentQuestion.codeQuestion,
      parameters: currentQuestion.parameters,
      returnType: currentQuestion.returnType,
      testcase: savedTestCases.map((tc) => ({
        input: tc.input,
        expectedOutput: tc.output,
        isHidden: tc.isHidden,
        language: tc.language, // Include language information with each test case
      })),
      totalTestCases: savedTestCases.length,
      totalMarks: currentQuestion.totalMarks,
      createdBy: user._id,
    };
  };

  // Replace the validateQuestion function with this improved version
  const validateQuestion = () => {
    if (!currentQuestion.title.trim()) {
      toast.error("Please enter a question title");
      return false;
    }
    if (!currentQuestion.questionTopic?.trim()) {
      toast.error("Please enter a question topic");
      return false;
    }

    if (!currentQuestion.codeQuestion.trim()) {
      toast.error("Please enter the code question");
      return false;
    }

    // Check if any languages have test cases
    const languagesWithTestCases = new Set<string>();
    savedTestCases.forEach((testCase) => {
      if (testCase.language) {
        languagesWithTestCases.add(testCase.language);
      }
    });

    if (languagesWithTestCases.size === 0) {
      toast.error("Please add at least one test case for any language");
      return false;
    }

    if (savedTestCases.length === 0) {
      toast.error("Please add at least one test case");
      return false;
    }

    return true;
  };

  // 4. Modify handleSaveQuestion to clear localStorage
  const handleSaveQuestion = async () => {
    if (!validateQuestion()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData = prepareDataForSubmission();

      // Save to API
      await axios.post("/api/questions", submissionData);

      // Get existing questions from localStorage
      const savedQuestions = localStorage.getItem("topicQuestions");
      const questions = savedQuestions ? JSON.parse(savedQuestions) : [];

      // Add to questions array
      questions.push(currentQuestion);

      // Save to localStorage
      localStorage.setItem("topicQuestions", JSON.stringify(questions));

      // Add to session storage
      addQuestionToSession(currentQuestion);

      // Mark that the user has seen the guide
      localStorage.setItem("hasSeenCodeQuestionGuide", "true");

      // Clear the current question data from localStorage
      localStorage.removeItem(LOCAL_STORAGE_CURRENT_CODE_QUESTION_KEY);

      // Navigate back to questions list
      router.back();

      toast.success("Question saved successfully");
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Failed to save question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Modify handleAddNextQuestion to clear localStorage
  const handleAddNextQuestion = async () => {
    if (!validateQuestion()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const submissionData = prepareDataForSubmission();

      // Save to API
      await axios.post("/api/questions", submissionData);

      // Get existing questions from localStorage
      const savedQuestions = localStorage.getItem("topicQuestions");
      const questions = savedQuestions ? JSON.parse(savedQuestions) : [];

      // Add to questions array
      questions.push(currentQuestion);

      // Save to localStorage
      localStorage.setItem("topicQuestions", JSON.stringify(questions));

      // Add to session storage
      addQuestionToSession(currentQuestion);

      // Get existing session questions to determine next number
      const savedSessionQuestions = sessionStorage.getItem(
        SESSION_QUESTIONS_KEY
      );
      const sessionQuestions = savedSessionQuestions
        ? JSON.parse(savedSessionQuestions)
        : [];
      const nextNumber = sessionQuestions.length + 1;

      // Mark that the user has seen the guide
      localStorage.setItem("hasSeenCodeQuestionGuide", "true");

      // Clear the current question data from localStorage
      localStorage.removeItem(LOCAL_STORAGE_CURRENT_CODE_QUESTION_KEY);

      // Create next question with incremented number
      setCurrentQuestion({
        id: `question-${Date.now()}`,
        number: nextNumber,
        title: "",
        questionTopic: "",
        language: "java", // Reset to default language
        timeLimit: currentQuestion.timeLimit,
        questionLevel: currentQuestion.questionLevel,
        totalMarks: currentQuestion.totalMarks,
        codeQuestion: "",
        parameters: [""],
        returnType: "integer",
        code: {
          Java: {
            defaultCode: defaultCodeTemplates.java.defaultCode,
            solutionCode: defaultCodeTemplates.java.solutionCode,
          },
        },
        testcase: [{ input: "", expectedOutput: "", isHidden: false }],
        totalTestCases: 1,
        questionType: "coding",
        generatedDriverCode: false,
      });

      // Reset states for the new question
      setSavedTestCases([]);
      setCurrentTestCaseInput("");
      setCompilerResponse("");
      setCompilationStatus(null);
      setCompilationMessage("");
      setIsTestCaseSuccessful(false);
      setValidatedLanguages(new Set());

      toast.success(
        "Question added successfully. Now creating a new question."
      );
    } catch (error) {
      console.error("Error saving question:", error);
      toast.error("Failed to save question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current language code
  const getCurrentLanguageCode = () => {
    const languageName =
      currentQuestion.language.charAt(0).toUpperCase() +
      currentQuestion.language.slice(1);
    return (
      currentQuestion.code[languageName] || {
        defaultCode: "",
        solutionCode: "",
      }
    );
  };

  // Add a function to simulate running the code
  // Add this function before the return statement:

  const handleRunCode = async () => {
    // Start loading state
    setIsSubmitting(true);

    try {
      const { language, code } = currentQuestion;
      const currentLanguage =
        language.charAt(0).toUpperCase() + language.slice(1);
      const flattenedCode = code?.[currentLanguage]?.solutionCode || "";
      const formattedInput = currentTestCaseInput;

      if (!formattedInput.trim()) {
        toast.error("Please enter input for the test case");
        setIsSubmitting(false);
        return;
      }

      let compilerLanguage = language;
      if (language === "python") {
        compilerLanguage = "py";
      }
      const payload = {
        code: flattenedCode,
        language: compilerLanguage,
        input: formattedInput,
      };

      // Make the actual API call to the compiler
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_COMPILER_ROUTE}`,
        payload,
        { timeout: 20000 }
      );

      // Process the response
      const compilerData = response.data;

      // Check if there's an error
      if (compilerData.error && compilerData.error.trim() !== "") {
        setCompilationStatus("error");
        setCompilationMessage(
          "Compilation failed. Please check your code for errors."
        );
        setCompilerResponse(compilerData.error);
        setIsTestCaseSuccessful(false);
      }
      // If no error, set the output
      else {
        const actualOutput = compilerData.output?.trim() || "";
        setCompilerResponse(actualOutput);
        setCompilationStatus("success");
        setCompilationMessage("Code executed successfully!");
        setIsTestCaseSuccessful(true);
      }
    } catch (error) {
      console.error("Error running code:", error);
      setCompilationStatus("error");
      setCompilationMessage("Failed to run code. Please try again.");
      setCompilerResponse(
        error instanceof Error ? error.message : "Unknown error occurred"
      );
      setIsTestCaseSuccessful(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const dismissFirstTimeGuide = () => {
    setShowFirstTimeGuide(false);
  };

  // Add this function to display which languages have test cases
  const getLanguagesWithTestCases = () => {
    const languagesWithTestCases = new Set<string>();
    savedTestCases.forEach((testCase) => {
      if (testCase.language) {
        languagesWithTestCases.add(testCase.language);
      }
    });
    return Array.from(languagesWithTestCases);
  };

  return (
    <div className="w-full mx-auto px-4 py-8">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center">
          <Button onClick={handleCancel} variant="ghost" className="p-2 mr-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-xl font-semibold">
            Question No: {currentQuestion.number}
          </h2>
        </div>
        <div className="flex gap-2 items-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowHelpDialog(true)}
                >
                  <HelpCircle className="h-5 w-5 text-[#219CAE]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Need help? Click for guidance</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button
            variant="outline"
            onClick={handleCancel}
            className="px-6 py-2 text-gray-600"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveQuestion}
            className="px-6 py-2 bg-[#219CAE] hover:bg-[#1a7d8b] text-white"
            disabled={isSubmitting}
          >
            Save
          </Button>
        </div>
      </div>

      {/* First-time user guide */}
      {showFirstTimeGuide && (
        <Card className="mt-4 mb-6 border-[#219CAE] bg-[#E6F5F9]">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-[#219CAE] flex items-center">
                <Info className="h-5 w-5 mr-2" /> Getting Started with Coding
                Questions
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={dismissFirstTimeGuide}
                className="h-8 w-8 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CardDescription>
              Follow these steps to create your coding question
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <div className="bg-[#219CAE] text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  1
                </div>
                <p>
                  Fill in the basic question details (title, difficulty, etc.)
                </p>
              </div>
              <div className="flex items-start">
                <div className="bg-[#219CAE] text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  2
                </div>
                <p>
                  Select a programming language and write both the initial code
                  (shown to students) and solution code
                </p>
              </div>
              <div className="flex items-start">
                <div className="bg-[#219CAE] text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  3
                </div>
                <p>
                  {" "}
                  Create test cases by toggling to &quot;Test Cases&quot;,
                  entering input, and running the code
                </p>
              </div>
              <div className="flex items-start">
                <div className="bg-[#219CAE] text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  4
                </div>
                <p>Add successful test cases to your question</p>
              </div>
              <div className="flex items-start">
                <div className="bg-[#219CAE] text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                  5
                </div>
                <p> Save your question when you&apos;re done</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
        {/* Form fields section */}
        <div className="space-y-6 md:col-span-1">
          <h3 className="text-lg font-medium">Question Details</h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="">
              <Label htmlFor="language" className="text-sm mb-1 block ">
                Coding Language
              </Label>
              <Select
                value={currentQuestion.language}
                onValueChange={handleLanguageChange}
              >
                <SelectTrigger className="w-full h-1 size=sm ">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="java">
                    Java{" "}
                    {savedTestCases.some((tc) => tc.language === "java") && "✓"}
                  </SelectItem>
                  <SelectItem value="python">
                    Python{" "}
                    {savedTestCases.some((tc) => tc.language === "python") &&
                      "✓"}
                  </SelectItem>
                  <SelectItem value="c">
                    C {savedTestCases.some((tc) => tc.language === "c") && "✓"}
                  </SelectItem>
                  <SelectItem value="cpp">
                    C++{" "}
                    {savedTestCases.some((tc) => tc.language === "cpp") && "✓"}
                  </SelectItem>
                </SelectContent>
              </Select>
              {savedTestCases.some(
                (tc) => tc.language === currentQuestion.language
              ) ? (
                <div className="flex items-center mt-1 text-green-600 text-xs">
                  <Check className="h-3 w-3 mr-1" /> Test cases validated
                </div>
              ) : (
                <div className="flex items-center mt-1 text-amber-600 text-xs">
                  <Info className="h-3 w-3 mr-1" /> No test cases for this
                  language
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="timeLimit" className="text-sm mb-1 block">
                Time Limit (minutes)
              </Label>
              <Input
                id="timeLimit"
                type="number"
                min="1"
                value={currentQuestion.timeLimit}
                onChange={(e) => handleTimeLimitChange(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="questionLevel" className="text-sm mb-1 block">
                Difficulty Level
              </Label>

              {/* This approach will definitely work */}
              <Select
                value={level ?? currentQuestion.questionLevel}
                onValueChange={handleQuestionLevelChange}
                disabled={!!level}
              >
                <SelectTrigger
                  className="w-full relative"
                  asChild={false} // Important for click handling
                >
                  {/* We'll add a hidden overlay that captures clicks when disabled */}
                  {!!level && (
                    <div
                      className="absolute inset-0 z-10"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toast(`Difficulty is locked to "${level}".`);
                      }}
                    />
                  )}
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
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

          <div>
            <Label htmlFor="questionTitle" className="text-sm mb-1 block">
              Question Title
            </Label>
            <Input
              id="questionTitle"
              value={currentQuestion.title}
              onChange={(e) =>
                setCurrentQuestion((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              placeholder="Enter question title"
              className="w-full mb-4"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Label htmlFor="questionTopic" className="text-sm">
                Topic <span className="text-red-500">*</span>
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Topic examples: Binary search, DSA, Computer Networks etc
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              id="questionTopic"
              value={currentQuestion.questionTopic}
              onChange={(e) =>
                setCurrentQuestion((prev) => ({
                  ...prev,
                  questionTopic: e.target.value,
                }))
              }
              placeholder="Enter question topic"
              className="w-full mb-4"
              required
            />
          </div>
          <div>
            <Label htmlFor="codeQuestion" className="text-sm mb-1 block">
              Code Question Description
            </Label>
            <div className="border rounded-md">
              {typeof window !== "undefined" && (
                <Editor
                  value={currentQuestion.codeQuestion}
                  onTextChange={(e) =>
                    handleCodeQuestionChange(e.htmlValue || "")
                  }
                  style={{ height: "200px" }}
                  headerTemplate={editorHeader}
                />
              )}
            </div>
          </div>

          {/* 6. Remove the function parameters and return type input fields by removing these sections from the JSX */}
          {/* Remove the button from its current location and add it after the languages with test cases section */}

          {/* Add this section before the "Add Next Question" button to show which languages have test cases */}
          <div className="space-y-2 mt-4">
            <div className="text-sm font-medium">
              Languages with Test Cases:
            </div>
            <div className="flex flex-wrap gap-2">
              {getLanguagesWithTestCases().length > 0 ? (
                getLanguagesWithTestCases().map((lang) => (
                  <Badge
                    key={lang}
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}{" "}
                    <Check className="h-3 w-3 ml-1" />
                  </Badge>
                ))
              ) : (
                <div className="text-amber-600 text-sm flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" /> No languages have
                  test cases yet
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Only languages with test cases will be included in the final
              question.
            </p>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {validatedLanguages.size > 0 ? (
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-600 mr-1" />
                  <span>
                    {validatedLanguages.size} language
                    {validatedLanguages.size !== 1 ? "s" : ""} validated with
                    test cases
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-amber-600">
                  <Info className="h-4 w-4 mr-1" />
                  <span>
                    No languages validated yet. Add test cases to validate.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Button
              onClick={handleAddNextQuestion}
              className="w-full flex items-center justify-center gap-2 bg-[#219CAE] hover:bg-[#1a7d8b] text-white py-2"
              disabled={isSubmitting}
            >
              <Plus className="h-4 w-4" /> Add Next Question
            </Button>
          </div>
        </div>

        {/* Code editor section - styled to match the screenshot */}
        <div className="md:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">
              Coding Language:{" "}
              {currentQuestion.language.charAt(0).toUpperCase() +
                currentQuestion.language.slice(1)}
            </h3>
          </div>

          <Tabs
            defaultValue="initial-code"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid grid-cols-2 mb-6 h-15 w-full border border-gray-200 p-0 rounded-lg bg-gray-100 overflow-hidden">
              <TabsTrigger
                value="initial-code"
                className="rounded-none first:rounded-l-lg data-[state=active]:bg-[#E6F5F9] data-[state=active]:text-black bg-white text-lg font-medium py-4"
              >
                Initial Code
              </TabsTrigger>
              <TabsTrigger
                value="solution-code"
                className="rounded-none last:rounded-r-lg data-[state=active]:bg-[#E6F5F9] data-[state=active]:text-black bg-white text-lg font-medium py-4"
              >
                Solution Code
              </TabsTrigger>
            </TabsList>
            <TabsContent value="initial-code">
              {/* Editor container styled to match the screenshot */}
              <div className="editor-wrapper h-[450px]">
                <CodeEditor
                  height="450px"
                  language={currentQuestion.language}
                  theme="vs-light"
                  value={getCurrentLanguageCode().defaultCode}
                  onChange={(value) =>
                    value !== undefined && handleDefaultCodeChange(value)
                  }
                  className="monaco-editor-container"
                  options={{
                    minimap: {
                      enabled: true,
                      showSlider: "always",
                      renderCharacters: true,
                      maxColumn: 120,
                      side: "right",
                    },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    lineNumbers: "on",
                    automaticLayout: true,
                    scrollbar: {
                      useShadows: false,
                      verticalHasArrows: false,
                      horizontalHasArrows: false,
                      vertical: "visible",
                      horizontal: "visible",
                      verticalScrollbarSize: 10,
                      horizontalScrollbarSize: 10,
                    },
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="solution-code">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Switch
                    id="solution-test-toggle"
                    checked={!isShowingTestCases}
                    onCheckedChange={(checked) =>
                      setIsShowingTestCases(!checked)
                    }
                  />
                  <Label htmlFor="solution-test-toggle" className="ml-2">
                    <span className="text-[#219CAE] font-medium">
                      {isShowingTestCases
                        ? "Toggle to Solution Code"
                        : "Toggle to Test Cases"}
                    </span>
                  </Label>
                </div>
                <Button
                  variant="outline"
                  className="bg-gray-100 hover:bg-gray-200"
                  onClick={handleRunCode}
                  disabled={isSubmitting || !isShowingTestCases}
                >
                  {isSubmitting ? "Running..." : "Run"}
                </Button>
              </div>

              {!isShowingTestCases ? (
                /* Solution Code Editor */
                <div className="editor-wrapper h-[450px]">
                  <CodeEditor
                    height="450px"
                    language={currentQuestion.language}
                    theme="vs-light"
                    value={getCurrentLanguageCode().solutionCode}
                    onChange={(value) =>
                      value !== undefined && handleSolutionCodeChange(value)
                    }
                    className="monaco-editor-container"
                    options={{
                      minimap: {
                        enabled: true,
                        showSlider: "always",
                        renderCharacters: true,
                        maxColumn: 120,
                        side: "right",
                      },
                      scrollBeyondLastLine: false,
                      fontSize: 14,
                      lineNumbers: "on",
                      automaticLayout: true,
                      scrollbar: {
                        useShadows: false,
                        verticalHasArrows: false,
                        horizontalHasArrows: false,
                        vertical: "visible",
                        horizontal: "visible",
                        verticalScrollbarSize: 10,
                        horizontalScrollbarSize: 10,
                      },
                    }}
                  />
                </div>
              ) : (
                /* Test Cases Section */
                <>
                  {/* Hint section */}
                  <div className="hint-section mb-4">
                    <div
                      className="hint-header flex items-center justify-between bg-[#E6F5F9] p-3 rounded-md cursor-pointer"
                      onClick={() => setIsHintOpen(!isHintOpen)}
                    >
                      <h4 className="text-[#219CAE] font-medium">
                        How to Create Test Cases
                      </h4>
                      {isHintOpen ? (
                        <ChevronUp className="h-5 w-5 text-[#219CAE]" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-[#219CAE]" />
                      )}
                    </div>
                    {isHintOpen && (
                      <div className="hint-content bg-white p-4 border border-gray-200 rounded-md mt-2">
                        <p className="mb-2">
                          To add test cases, follow these steps:
                        </p>
                        <ol className="list-decimal pl-5 space-y-2 text-sm">
                          <li>
                            Enter input values in the format expected by your
                            code
                          </li>
                          <li>
                            Click the <strong>Run</strong> button to execute
                            your solution code with the input
                          </li>
                          <li>
                            If the code runs successfully, click{" "}
                            <strong>Add Test Case</strong> to save it
                          </li>
                          <li>
                            Add multiple test cases to thoroughly test your
                            solution
                          </li>
                        </ol>

                        <p className="mt-4 font-medium text-[#219CAE]">
                          Input Format Examples:
                        </p>

                        <div className="mt-2 space-y-4">
                          <div>
                            <div className="text-sm font-medium mb-1">
                              For arrays:
                            </div>
                            <Textarea
                              readOnly
                              value="[1, 2, 3, 4, 5]"
                              className="w-full mb-1 bg-gray-50 text-sm"
                            />
                          </div>

                          <div>
                            <div className="text-sm font-medium mb-1">
                              For multiple inputs:
                            </div>
                            <Textarea
                              readOnly
                              value="[1, 2, 3, 4, 5] 3"
                              className="w-full mb-1 bg-gray-50 text-sm"
                            />
                            <p className="text-xs text-gray-600">
                              Separate multiple inputs with spaces
                            </p>
                          </div>

                          <div>
                            <div className="text-sm font-medium mb-1">
                              For strings:
                            </div>
                            <Textarea
                              readOnly
                              value="Hello World"
                              className="w-full mb-1 bg-gray-50 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Compiler Message Section */}
                  <div className="mb-6">
                    <div className="p-4 rounded-md border">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Compiler Message</h4>
                        <Badge variant="outline" className="text-xs">
                          {compilationStatus
                            ? "Last run: Just now"
                            : "Not run yet"}
                        </Badge>
                      </div>

                      {compilationStatus === "success" && (
                        <div className="bg-[#219CAE]/10 text-[#219CAE] p-3 rounded-md">
                          <p className="font-medium">
                            ✓ Code executed successfully
                          </p>
                          <p className="text-sm">{compilationMessage}</p>
                          <div className="mt-2">
                            <p className="text-xs font-medium">
                              Actual Output:
                            </p>
                            <pre className="text-xs bg-[#219CAE]/5 p-2 mt-1 rounded overflow-x-auto">
                              {compilerResponse || "(No output)"}
                            </pre>
                          </div>
                        </div>
                      )}

                      {compilationStatus === "error" && (
                        <div className="bg-red-100 text-red-700 p-3 rounded-md">
                          <p className="font-medium">✗ Compilation error</p>
                          <p className="text-sm">{compilationMessage}</p>
                          {compilerResponse && (
                            <pre className="text-xs bg-red-50 p-2 mt-1 rounded overflow-x-auto whitespace-pre-wrap">
                              {compilerResponse}
                            </pre>
                          )}
                        </div>
                      )}

                      {!compilationStatus && (
                        <div className="bg-gray-100 p-3 rounded-md text-gray-600">
                          <p className="text-sm">
                            Enter input values and click &quot;Run&quot; to test
                            your code.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Test Case Input and Output */}
                  <div className="p-4 bg-gray-50 rounded-md mb-4">
                    <div className="mb-4">
                      <Label className="text-sm mb-1 block">Input:</Label>
                      <Textarea
                        value={currentTestCaseInput}
                        onChange={(e) =>
                          handleTestCaseInputChange(e.target.value)
                        }
                        className="w-full min-h-[80px]"
                        placeholder={
                          currentQuestion.language === "java"
                            ? "Enter input values (e.g., [1, 2, 3, 4], 3)"
                            : "Enter input values"
                        }
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Input should match the parameters in your function:{" "}
                        {currentQuestion.parameters.join(", ")}
                      </p>
                    </div>

                    <div className="mb-4">
                      <Label className="text-sm mb-1 block">
                        Actual Output:
                      </Label>
                      <Textarea
                        value={compilerResponse}
                        readOnly
                        className="w-full min-h-[80px] bg-gray-50"
                        placeholder="Compiler output will appear here after running the code"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This is the actual output generated by the compiler when
                        you run your code.
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Switch
                          id="hide-testcase"
                          checked={isCurrentTestCaseHidden}
                          onCheckedChange={handleTestCaseHiddenChange}
                        />
                        <Label htmlFor="hide-testcase" className="ml-2 text-sm">
                          Hide this testcase from students
                        </Label>
                      </div>
                      <Button
                        onClick={handleAddTestCase}
                        className={`${
                          isTestCaseSuccessful
                            ? "bg-[#219CAE] hover:bg-[#1a7d8b] text-white"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                        disabled={!isTestCaseSuccessful}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Test Case
                      </Button>
                    </div>
                  </div>

                  {/* Saved Test Cases Dropdown */}
                  {savedTestCases.length > 0 && (
                    <Collapsible
                      open={isSavedTestCasesOpen}
                      onOpenChange={setIsSavedTestCasesOpen}
                      className="border rounded-md overflow-hidden mb-4"
                    >
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-3 bg-gray-100 hover:bg-gray-200 transition-colors">
                        <div className="flex items-center">
                          <h4 className="font-medium">
                            Saved Test Cases ({savedTestCases.length})
                          </h4>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 transition-transform ${
                            isSavedTestCasesOpen ? "transform rotate-180" : ""
                          }`}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="divide-y">
                          {savedTestCases.map((testCase, index) => (
                            <div
                              key={testCase.id}
                              className="p-4 hover:bg-gray-50"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium flex items-center">
                                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#219CAE]/10 text-[#219CAE] mr-2">
                                    {index + 1}
                                  </span>
                                  Test Case {index + 1}
                                  {testCase.language && (
                                    <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200">
                                      {testCase.language
                                        .charAt(0)
                                        .toUpperCase() +
                                        testCase.language.slice(1)}
                                    </Badge>
                                  )}
                                </h5>
                                <div className="flex items-center">
                                  <Switch
                                    id={`hide-saved-testcase-${testCase.id}`}
                                    checked={testCase.isHidden}
                                    onCheckedChange={(checked) =>
                                      handleSavedTestCaseHiddenChange(
                                        testCase.id,
                                        checked
                                      )
                                    }
                                    className="mr-2"
                                  />
                                  <Badge
                                    variant="outline"
                                    className={
                                      testCase.isHidden ? "bg-orange-100" : ""
                                    }
                                  >
                                    {testCase.isHidden ? "Hidden" : "Visible"}
                                  </Badge>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    Input:
                                  </p>
                                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto border">
                                    {testCase.input}
                                  </pre>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500 mb-1">
                                    Output:
                                  </p>
                                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto border">
                                    {testCase.output}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Help Dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-lg h-[87vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>How to Create a Coding Question</DialogTitle>
            <DialogDescription>
              Follow these steps to create an effective coding question
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-[#219CAE]">
                Step 1: Basic Setup
              </h3>
              <div className="space-y-2 text-sm">
                <p>
                  • Fill in the question title, difficulty level, and time limit
                </p>
                <p>
                  • Write a clear description of the problem in the Code
                  Question Description field
                </p>
                <p>• Define the function parameters and return type</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-[#219CAE]">
                Step 2: Code Templates
              </h3>
              <div className="space-y-2 text-sm">
                <p>• Select a programming language from the dropdown</p>
                <p>
                  • Write the initial code that students will see (Initial Code
                  tab)
                </p>
                <p>
                  • Write the solution code that will be used to validate test
                  cases (Solution Code tab)
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-[#219CAE]">Step 3: Test Cases</h3>
              <div className="space-y-2 text-sm">
                <p>Toggle to &quot;Test Cases&quot; in the Solution Code tab</p>
                <p>• Enter input values that match your function parameters</p>
                <p>
                  •Click &quot;Run&quot; to execute your solution code with the
                  input
                </p>
                <p>
                  •If successful, click &quot;Add Test Case&quot; to save it
                </p>
                <p>
                  • Add multiple test cases to thoroughly test your solution
                </p>
                <p>• You can mark test cases as hidden from students</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-[#219CAE]">
                Step 4: Multiple Languages (Optional)
              </h3>
              <div className="space-y-2 text-sm">
                <p>• You can add support for multiple programming languages</p>
                <p>
                  • Switch languages using the dropdown and repeat steps 2-3 for
                  each language
                </p>
                <p>
                  • Only languages with validated test cases will be included in
                  the final question
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-[#219CAE]">
                Step 5: Save Your Question
              </h3>
              <div className="space-y-2 text-sm">
                <p>• Click &quot;Save&quot; to save your question</p>
                <p>
                  • Or click &quot;Add Next Question&quot; to save and create
                  another question
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setShowHelpDialog(false)}
              className="bg-[#219CAE] hover:bg-[#1a7d8b] text-white"
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
