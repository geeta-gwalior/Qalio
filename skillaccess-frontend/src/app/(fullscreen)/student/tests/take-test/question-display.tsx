"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Code,
  Play,
  Save,
  Terminal,
  FileText,
  TestTube,
  ChevronUp,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  Lightbulb,
  GripVertical,
  GripHorizontal,
} from "lucide-react";
import { Editor as CodeEditor } from "@monaco-editor/react";
import { toast } from "sonner";
import { getCookie } from "@/utils/getCookie";
import type { AssessmentData, Question } from "@/types/assessment";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

interface QuestionDisplayProps {
  question: Question;
  answer: any;
  onAnswerChange: (answer: any) => void;
  responseId?: string;
  assessment: AssessmentData;
}

interface CompilerResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
  memoryUsage?: number;
  compilerId?: string;
}

interface TestCaseResult {
  testCaseIndex: number;
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  error?: string;
  executionTime?: number;
  memoryUsage?: number;
}

interface CompilerLog {
  questionId: string;
  code: string;
  language: string;
  testResults: TestCaseResult[];
  compilerId?: string;
  timestamp: string;
}

interface ConsoleOutput {
  type: "success" | "error" | "info" | "test-results";
  message: string;
  timestamp: string;
  details?: any;
}

// Store question-specific state globally to persist across navigation
const questionStateCache = new Map<
  string,
  {
    consoleOutput: ConsoleOutput[];
    testResults: TestCaseResult[];
    currentCompilerId: string;
    customInput: string;
    isConsoleExpanded: boolean;
    activeTab: string;
    compilerLogs: CompilerLog[];
  }
>();

export function QuestionDisplay({
  assessment,
  question,
  answer,
  onAnswerChange,
  responseId,
}: QuestionDisplayProps) {
  const [consoleOutput, setConsoleOutput] = useState<ConsoleOutput[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [isConsoleExpanded, setIsConsoleExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("description");
  const editorRef = useRef<any>(null);
  const [customInput, setCustomInput] = useState<string>("");
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [compilerLogs, setCompilerLogs] = useState<CompilerLog[]>([]);
  const [currentCompilerId, setCurrentCompilerId] = useState<string>("");
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [isCustomRunning, setIsCustomRunning] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<string>("");

  const user: any = useAuthStore((state) => state.user);

  // Determine if we should preserve state based on timer mode
  const shouldPreserveState = () => {
    // Total Duration Mode: Preserve state (allows back/forth navigation)
    if (assessment.isTotalDuration) {
      return true;
    }

    // Question Timer Mode: Don't preserve state (sequential only)
    if (!assessment.isTotalDuration) {
      return false;
    }

    // Default fallback - check if direct navigation is allowed
    return assessment.config?.allowDirectNavigation !== false;
  };

  // Save current question state to cache
  const saveQuestionState = useCallback(() => {
    if (shouldPreserveState() && currentQuestionId) {
      questionStateCache.set(currentQuestionId, {
        consoleOutput,
        testResults,
        currentCompilerId,
        customInput,
        isConsoleExpanded,
        activeTab,
        compilerLogs,
      });
    }
  }, [
    currentQuestionId,
    consoleOutput,
    testResults,
    currentCompilerId,
    customInput,
    isConsoleExpanded,
    activeTab,
    compilerLogs,
  ]);

  // Load question state from cache
  const loadQuestionState = useCallback((questionId: string) => {
    if (shouldPreserveState()) {
      const cachedState = questionStateCache.get(questionId);
      if (cachedState) {
        setConsoleOutput(cachedState.consoleOutput);
        setTestResults(cachedState.testResults);
        setCurrentCompilerId(cachedState.currentCompilerId);
        setCustomInput(cachedState.customInput);
        setIsConsoleExpanded(cachedState.isConsoleExpanded);
        setActiveTab(cachedState.activeTab);
        setCompilerLogs(cachedState.compilerLogs);
        return true;
      }
    }
    return false;
  }, []);

  // Reset state for new question
  const resetQuestionState = useCallback(() => {
    setConsoleOutput([]);
    setTestResults([]);
    setCurrentCompilerId("");
    setCustomInput("");
    setIsConsoleExpanded(false);
    setActiveTab("description");
    setIsRunning(false);
    setIsTestRunning(false);
    setIsCustomRunning(false);
    setCompilerLogs([]);
  }, []);

  // Handle question changes
  useEffect(() => {
    if (question._id !== currentQuestionId) {
      // Save current question state before switching
      if (currentQuestionId) {
        saveQuestionState();
      }

      // Try to load cached state for new question
      const stateLoaded = loadQuestionState(question._id);

      // If no cached state found or state preservation is disabled, reset
      if (!stateLoaded) {
        resetQuestionState();
      }

      setCurrentQuestionId(question._id);
    }
  }, [
    question._id,
    currentQuestionId,
    saveQuestionState,
    loadQuestionState,
    resetQuestionState,
  ]);

  // Save state when component unmounts or question changes
  useEffect(() => {
    return () => {
      if (currentQuestionId) {
        saveQuestionState();
      }
    };
  }, [currentQuestionId, saveQuestionState]);

  useEffect(() => {
    if (question?.questionType === "coding" && availableLanguages.length > 0) {
      setSelectedLanguage(availableLanguages[0]);
    }
  }, [question]);

  const addConsoleOutput = useCallback(
    (output: Omit<ConsoleOutput, "timestamp">) => {
      setConsoleOutput((prev) => [
        ...prev,
        { ...output, timestamp: new Date().toISOString() },
      ]);
      setIsConsoleExpanded(true);
    },
    []
  );

  // Clear console output
  const clearConsole = useCallback(() => {
    setConsoleOutput([]);
  }, []);

  const handleMCQChange = (selectedOption: string) => {
    onAnswerChange(selectedOption);
  };

  const handleMCQMultiChange = (option: string, checked: boolean) => {
    const currentAnswers = Array.isArray(answer) ? answer : [];
    if (checked) {
      onAnswerChange([...currentAnswers, option]);
    } else {
      onAnswerChange(currentAnswers.filter((a: string) => a !== option));
    }
  };

  const handleTextChange = (value: string) => {
    onAnswerChange(value);
  };

  const handleCodingChange = (value: string | undefined) => {
    if (value !== undefined) {
      onAnswerChange(value);
    }
  };

  const getMonacoLanguage = (language: string) => {
    const languageMap: { [key: string]: string } = {
      java: "java",
      cpp: "cpp",
      python: "python",
      c: "c",
    };
    return languageMap[language.toLowerCase()] || language.toLowerCase();
  };

  // Save compiler log to backend
  const saveCompilerLog = async (
    log: CompilerLog,
    studentId: string,
    assessmentId: string
  ) => {
    try {
      const totalTestCases = log.testResults.length;
      const totalPassedTestCases = log.testResults.filter(
        (r) => r.passed
      ).length;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student/save-compiler-log`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getCookie("jwt")}`,
          },
          body: JSON.stringify({
            student: studentId,
            assessment: assessmentId,
            attempt: 1,
            code: log.code,
            question: log.questionId,
            testcase: log.testResults,
            totalTestCases,
            totalPassedTestCases,
            codeLanguage: log.language,
          }),
        }
      );

      if (!response.ok) {
        addConsoleOutput({
          type: "error",
          message: "Failed to save compiler log to server",
        });
      } else {
        addConsoleOutput({
          type: "info",
          message: "Compiler log saved successfully",
        });
      }
    } catch (error) {
      addConsoleOutput({
        type: "error",
        message: `Error saving compiler log: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }
  };

  // Run code with custom input using the base compiler route
  const runCodeWithCustomInput = async () => {
    if (!answer) {
      addConsoleOutput({
        type: "error",
        message: "Please write some code first.",
      });
      return;
    }

    if (isTestRunning) {
      addConsoleOutput({
        type: "error",
        message: "Test cases are currently running. Please wait...",
      });
      return;
    }

    setIsCustomRunning(true);
    setIsRunning(true);
    clearConsole();

    addConsoleOutput({
      type: "info",
      message: "Running code with custom input...",
    });

    try {
      const payload = {
        code: answer,
        language:
          selectedLanguage.toLowerCase() === "python"
            ? "py"
            : selectedLanguage.toLowerCase(),
        input: customInput,
      };

      const response = await fetch(process.env.NEXT_PUBLIC_COMPILER_ROUTE!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: CompilerResult = await response.json();

      if (data.error) {
        addConsoleOutput({
          type: "error",
          message: `Compilation Error:\n${data.error}`,
          details: data,
        });
      } else {
        addConsoleOutput({
          type: "success",
          message: `Code executed successfully!\n\nOutput:\n${
            data.output || "(no output)"
          }`,
          details: data,
        });
      }
    } catch (error) {
      addConsoleOutput({
        type: "error",
        message: `Execution Error: ${
          error instanceof Error ? error.message : "Failed to execute code"
        }`,
        details: error,
      });
    } finally {
      setIsCustomRunning(false);
      setIsRunning(false);
    }
  };

  // Run all test cases using the /test route
  const runAllTestCases = async () => {
    if (!answer) {
      addConsoleOutput({
        type: "error",
        message: "Please write some code first.",
      });
      return;
    }

    if (!question.testcase || question.testcase.length === 0) {
      addConsoleOutput({
        type: "error",
        message: "No test cases available for this problem.",
      });
      return;
    }

    if (isCustomRunning) {
      addConsoleOutput({
        type: "error",
        message: "Custom input is currently running. Please wait...",
      });
      return;
    }

    setIsTestRunning(true);
    setIsRunning(true);
    clearConsole();

    addConsoleOutput({
      type: "info",
      message: `Running ${question.testcase.length} test cases...`,
    });

    const payload = {
      code: answer,
      language:
        selectedLanguage.toLowerCase() === "python"
          ? "py"
          : selectedLanguage.toLowerCase(),
      compilerId: question._id,
    };

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_COMPILER_ROUTE}/compile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        addConsoleOutput({
          type: "error",
          message: `Compilation Error:\n${data.error}`,
          details: data,
        });
        return;
      }

      const { passed = [], failed = [] } = data;
      const results: TestCaseResult[] = [];

      // Process all test results
      [...passed, ...failed].forEach((testCase, index) => {
        results.push({
          testCaseIndex: index,
          passed: testCase.passed,
          input: testCase.input,
          expected: testCase.expectedOutput,
          actual: testCase.realtimeOutputEscapeRemoved || testCase.output || "",
          error: testCase.error || "",
          executionTime: testCase.executionTime,
          memoryUsage: testCase.memoryUsage,
        });
      });

      setTestResults(results);
      setCurrentCompilerId(question._id);

      // Create compiler log
      const compilerLog: CompilerLog = {
        questionId: question._id,
        code: answer,
        language: selectedLanguage,
        testResults: results,
        compilerId: question._id,
        timestamp: new Date().toISOString(),
      };

      setCompilerLogs((prev) => [...prev, compilerLog]);

      // Save compiler log if responseId exists
      if (responseId && user?._id) {
        await saveCompilerLog(compilerLog, user._id, assessment._id!);
      }

      const passedCount = passed.length;
      const totalCount = passed.length + failed.length;
      const visibleCount = question.testcase.filter(
        (t: any) => !t.isHidden
      ).length;
      const visiblePassed = results.filter(
        (r, index) => r.passed && !question.testcase![index].isHidden
      ).length;

      // Add test results to console
      addConsoleOutput({
        type: "test-results",
        message: `Test Results: ${passedCount}/${totalCount} test cases passed`,
        details: {
          results,
          passedCount,
          totalCount,
          visiblePassed,
          visibleCount,
        },
      });

      if (passedCount === totalCount) {
        addConsoleOutput({
          type: "success",
          message: `🎉 All ${totalCount} test cases passed!`,
        });
        toast.success(`All test cases passed!`);
      } else {
        addConsoleOutput({
          type: "error",
          message: `${
            totalCount - passedCount
          } test case(s) failed. Check the details above.`,
        });
        toast.error(`${totalCount - passedCount} test cases failed`);
      }
    } catch (error) {
      addConsoleOutput({
        type: "error",
        message: `Error running test cases: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        details: error,
      });
      toast.error("Failed to run test cases");
    } finally {
      setIsTestRunning(false);
      setIsRunning(false);
    }
  };

  const getDefaultCode = () => {
    if (question.code && question.code[selectedLanguage]) {
      return question.code[selectedLanguage].defaultCode;
    }
    return answer || getLanguageTemplate(selectedLanguage);
  };

  const getLanguageTemplate = (language: string) => {
    const templates: { [key: string]: string } = {
      java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
    }
}`,
      cpp: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Write your solution here
    return 0;
}`,
      python: `# Write your solution here`,
      c: `#include <stdio.h>

int main() {
    // Write your solution here
    return 0;
}`,
    };
    return templates[language] || "";
  };

  const availableLanguages = question.code
    ? Object.keys(question.code)
    : ["java", "cpp", "python", "c"];

  const renderConsoleOutput = () => {
    if (consoleOutput.length === 0) {
      return (
        <div className="text-gray-400 text-sm">
          Console is ready. Click &apos;Run Tests&apos; or &apos;Run with Custom
          Input&apos; to see output...
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {consoleOutput.map((output, index) => (
          <div key={index} className="text-sm">
            <div className="flex items-start gap-2">
              <span className="text-gray-400 text-xs min-w-[60px]">
                {new Date(output.timestamp).toLocaleTimeString()}
              </span>
              <div className="flex-1">
                {output.type === "error" && (
                  <div className="text-red-400">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    <span className="font-medium">Error:</span>
                  </div>
                )}
                {output.type === "success" && (
                  <div className="text-green-400">
                    <CheckCircle className="h-3 w-3 inline mr-1" />
                    <span className="font-medium">Success:</span>
                  </div>
                )}
                {output.type === "info" && (
                  <div className="text-blue-400">
                    <Terminal className="h-3 w-3 inline mr-1" />
                    <span className="font-medium">Info:</span>
                  </div>
                )}
                {output.type === "test-results" && (
                  <div className="text-yellow-400">
                    <TestTube className="h-3 w-3 inline mr-1" />
                    <span className="font-medium">Test Results:</span>
                  </div>
                )}
                <pre className="whitespace-pre-wrap mt-1 text-gray-300">
                  {output.message}
                </pre>
                {/* Show detailed test results */}
                {output.type === "test-results" && output.details?.results && (
                  <div className="mt-2 space-y-1 border-l-2 border-gray-600 pl-3">
                    {output.details.results.map(
                      (result: TestCaseResult, idx: number) => (
                        <div key={idx} className="text-xs">
                          <div
                            className={`flex items-center gap-2 ${
                              result.passed ? "text-green-400" : "text-red-400"
                            }`}
                          >
                            {result.passed ? "✅" : "❌"} Test Case{" "}
                            {result.testCaseIndex + 1}
                            {result.executionTime && (
                              <span className="text-gray-400">
                                ({result.executionTime}ms)
                              </span>
                            )}
                          </div>
                          {!result.passed && (
                            <div className="ml-4 mt-1 text-gray-400">
                              <div>Input: {result.input}</div>
                              <div>Expected: {result.expected}</div>
                              <div className="text-red-400">
                                Got: {result.actual}
                              </div>
                              {result.error && (
                                <div className="text-red-400">
                                  Error: {result.error}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="outline">
              {question.questionType.toUpperCase()}
            </Badge>
            <Badge variant="secondary">{question.totalMarks} marks</Badge>
            {question.timeLimit && (
              <Badge variant="outline">
                {Math.floor(question.timeLimit / 60)}m per question
              </Badge>
            )}       
          </div>
          <div className="prose prose-sm max-w-none">
            <div dangerouslySetInnerHTML={{ __html: question.questionText }} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {question.questionType === "mcq" && question.options && (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <Label
                key={index}
                className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name={`question-${question._id}`}
                  value={option.text}
                  checked={answer === option.text}
                  onChange={(e) => handleMCQChange(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="flex-1">{option.text}</span>
              </Label>
            ))}
          </div>
        )}

        {question.questionType === "mcqmulti" && question.options && (
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <Label
                key={index}
                className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  value={option.text}
                  checked={
                    Array.isArray(answer) && answer.includes(option.text)
                  }
                  onChange={(e) =>
                    handleMCQMultiChange(option.text, e.target.checked)
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <span className="flex-1">{option.text}</span>
              </Label>
            ))}
          </div>
        )}

        {question.questionType === "findAnswer" && (
          <div className="space-y-6">
            {question.passage && (
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-medium mb-2">Passage:</h4>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: question.passage }}
                />
              </div>
            )}

            {question.questions && question.questions.length > 0 ? (
              <div className="space-y-4">
                {question.questions.map((subQuestion, subIndex) => (
                  <div key={subIndex} className="border rounded-lg p-4">
                    <h5 className="font-medium mb-3">
                      Question {subIndex + 1}: {subQuestion.questionText}
                    </h5>
                    {subQuestion.options && subQuestion.options.length > 0 ? (
                      <div className="space-y-2">
                        {subQuestion.options.map((option, optionIndex) => (
                          <Label
                            key={optionIndex}
                            className="flex items-center space-x-3 cursor-pointer p-2 border rounded hover:bg-gray-50"
                          >
                            <input
                              type="radio"
                              name={`findanswer-${question._id}-${subIndex}`}
                              value={option.text}
                              checked={
                                Array.isArray(answer) &&
                                answer[subIndex] === option.text
                              }
                              onChange={(e) => {
                                const newAnswers = Array.isArray(answer)
                                  ? [...answer]
                                  : [];
                                newAnswers[subIndex] = e.target.value;
                                onAnswerChange(newAnswers);
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <span className="flex-1">{option.text}</span>
                          </Label>
                        ))}
                      </div>
                    ) : (
                      <Textarea
                        placeholder={`Enter your answer for question ${
                          subIndex + 1
                        }...`}
                        value={
                          Array.isArray(answer) ? answer[subIndex] || "" : ""
                        }
                        onChange={(e) => {
                          const newAnswers = Array.isArray(answer)
                            ? [...answer]
                            : [];
                          newAnswers[subIndex] = e.target.value;
                          onAnswerChange(newAnswers);
                        }}
                        className="min-h-24 resize-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <Textarea
                  placeholder="Enter your answer here..."
                  value={answer || ""}
                  onChange={(e) => handleTextChange(e.target.value)}
                  className="min-h-32 resize-none"
                />
              </div>
            )}
          </div>
        )}

        {question.questionType === "prompt" && (
          <div className="space-y-6">
            {/* Answer Input Area */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your Response
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label
                    htmlFor="prompt-answer"
                    className="text-sm font-medium text-gray-700"
                  >
                    Write your detailed response below:
                  </Label>
                  <Textarea
                    id="prompt-answer"
                    placeholder="Start writing your response here... Be thorough and address all aspects mentioned in the guidelines."
                    value={answer || ""}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="min-h-[300px] mt-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ lineHeight: "1.6" }}
                  />
                </div>

                {/* Writing Statistics */}
                <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span>
                      Words:{" "}
                      <strong className="text-gray-700">
                        {answer
                          ? answer.trim()
                            ? answer.trim().split(/\s+/).length
                            : 0
                          : 0}
                      </strong>
                    </span>
                    <span>
                      Characters:{" "}
                      <strong className="text-gray-700">
                        {answer ? answer.length : 0}
                      </strong>
                    </span>
                    {answer && answer.trim() && (
                      <span>
                        Est. reading time:{" "}
                        <strong className="text-gray-700">
                          {Math.ceil(answer.trim().split(/\s+/).length / 200)}{" "}
                          min
                        </strong>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {answer &&
                      (() => {
                        const wordCount = answer.trim()
                          ? answer.trim().split(/\s+/).length
                          : 0;
                        if (wordCount < 50 && wordCount > 0) {
                          return (
                            <Badge
                              variant="outline"
                              className="text-yellow-600 border-yellow-300"
                            >
                              Consider expanding
                            </Badge>
                          );
                        } else if (wordCount >= 50 && wordCount < 200) {
                          return (
                            <Badge
                              variant="outline"
                              className="text-blue-600 border-blue-300"
                            >
                              Good length
                            </Badge>
                          );
                        } else if (wordCount >= 200) {
                          return (
                            <Badge
                              variant="outline"
                              className="text-green-600 border-green-300"
                            >
                              Comprehensive
                            </Badge>
                          );
                        }
                        return null;
                      })()}
                  </div>
                </div>

                {/* Writing Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Writing Tips
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>
                      • Structure your response with clear introduction, body,
                      and conclusion
                    </li>
                    <li>
                      • Use specific examples and evidence to support your
                      points
                    </li>
                    <li>
                      • Address all aspects mentioned in the guidelines above
                    </li>
                    <li>• Review and edit your response before submitting</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const textarea = document.getElementById(
                    "prompt-answer"
                  ) as HTMLTextAreaElement;
                  if (textarea) {
                    textarea.focus();
                    textarea.setSelectionRange(
                      textarea.value.length,
                      textarea.value.length
                    );
                  }
                }}
              >
                Continue Writing
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (answer) {
                    const words = answer.trim().split(/\s+/);
                    const sentences = answer
                      .split(/[.!?]+/)
                      .filter((s: any) => s.trim().length > 0);
                    toast.success(
                      `Writing Analysis: ${words.length} words, ${
                        sentences.length
                      } sentences, Average ${Math.round(
                        words.length / Math.max(sentences.length, 1)
                      )} words per sentence`
                    );
                  }
                }}
                disabled={!answer || answer.trim().length === 0}
              >
                Analyze Writing
              </Button>
            </div>
          </div>
        )}

        {question.questionType === "coding" && (
          <div className="w-full h-full">
            {question.questionType === "coding" && (
              <div className="space-y-4">
                <div className="flex justify-center gap-2">
                  <Button
                    onClick={runAllTestCases}
                    disabled={isRunning}
                    size="sm"
                    variant="outline"
                  >
                    {isTestRunning ? (
                      <>
                        <Save className="h-4 w-4 mr-2 animate-spin" />
                        Running Tests...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Compile & Run Test Cases
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={clearConsole}
                    disabled={isRunning}
                    size="sm"
                    variant="ghost"
                  >
                    Clear Console
                  </Button>
                </div>

                {/* Resizable LeetCode-style layout */}
                <div className="h-[700px] border rounded-lg overflow-hidden">
                  <PanelGroup direction="horizontal">
                    {/* Left Panel - Problem Description */}
                    <Panel defaultSize={50} minSize={30}>
                      <div className="h-full border-r">
                        <Tabs
                          value={activeTab}
                          onValueChange={setActiveTab}
                          className="h-full flex flex-col"
                        >
                          <div className="border-b bg-gray-50 px-4 py-2">
                            <TabsList className="grid w-full grid-cols-3">
                              <TabsTrigger
                                value="description"
                                className="text-xs"
                              >
                                <FileText className="h-3 w-3 mr-1" />
                                Description
                              </TabsTrigger>
                              <TabsTrigger
                                value="testcases"
                                className="text-xs"
                              >
                                <Terminal className="h-3 w-3 mr-1" />
                                Test Cases
                              </TabsTrigger>
                              <TabsTrigger value="custom" className="text-xs">
                                <Code className="h-3 w-3 mr-1" />
                                Custom
                              </TabsTrigger>
                            </TabsList>
                          </div>
                          <div className="flex-1 overflow-auto">
                            <TabsContent
                              value="description"
                              className="p-4 m-0 h-full"
                            >
                              <div className="prose prose-sm max-w-none">
                                <div
                                  dangerouslySetInnerHTML={{
                                    __html:
                                      question.codeQuestion ||
                                      question.questionText,
                                  }}
                                />
                              </div>
                            </TabsContent>

                            <TabsContent
                              value="testcases"
                              className="p-4 m-0 h-full"
                            >
                              <div className="space-y-3">
                                {question.testcase
                                  ?.filter((test) => !test.isHidden)
                                  .map((test, index) => {
                                    const result = testResults.find(
                                      (r) => r.testCaseIndex === index
                                    );
                                    return (
                                      <div
                                        key={index}
                                        className="border rounded-lg p-3"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="font-medium text-sm">
                                            Test Case {index + 1}
                                          </span>
                                          <div className="flex items-center gap-2">
                                            {result && (
                                              <span
                                                className={`text-xs ${
                                                  result.passed
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                                }`}
                                              >
                                                {result.passed ? (
                                                  <CheckCircle className="h-4 w-4" />
                                                ) : (
                                                  <XCircle className="h-4 w-4" />
                                                )}
                                              </span>
                                            )}
                                            {test.isHidden && (
                                              <Badge
                                                variant="secondary"
                                                className="text-xs"
                                              >
                                                Hidden
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                                          <div>
                                            <div className="text-gray-600 mb-1">
                                              Input:
                                            </div>
                                            <div className="bg-gray-100 p-2 rounded">
                                              {test.input}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="text-gray-600 mb-1">
                                              Expected:
                                            </div>
                                            <div className="bg-gray-100 p-2 rounded">
                                              {test.expectedOutput}
                                            </div>
                                          </div>
                                        </div>
                                        {result && !result.passed && (
                                          <div className="mt-2 pt-2 border-t">
                                            <div className="text-xs">
                                              <div className="text-gray-600 mb-1">
                                                Your Output:
                                              </div>
                                              <div className="bg-red-50 p-2 rounded font-mono text-red-800">
                                                {result.actual || result.error}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  }) || (
                                  <div className="text-gray-500 text-center py-8">
                                    No test cases available
                                  </div>
                                )}
                              </div>
                            </TabsContent>

                            <TabsContent
                              value="custom"
                              className="p-4 m-0 h-full"
                            >
                              <div className="space-y-4">
                                <div>
                                  <Label className="text-sm font-medium">
                                    Custom Input
                                  </Label>
                                  <Textarea
                                    placeholder="Enter your custom input here..."
                                    value={customInput}
                                    onChange={(e) =>
                                      setCustomInput(e.target.value)
                                    }
                                    className="mt-2 font-mono text-sm"
                                    rows={6}
                                  />
                                </div>
                                <Button
                                  onClick={runCodeWithCustomInput}
                                  disabled={isRunning}
                                  size="sm"
                                  className="w-full"
                                >
                                  {isCustomRunning ? (
                                    <>
                                      <Save className="h-4 w-4 mr-2 animate-spin" />
                                      Running...
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-4 w-4 mr-2" />
                                      Run with Custom Input
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TabsContent>
                          </div>
                        </Tabs>
                      </div>
                    </Panel>

                    {/* Horizontal Resize Handle */}
                    <PanelResizeHandle className="w-2 bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center group">
                      <GripVertical className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </PanelResizeHandle>

                    {/* Right Panel - Code Editor and Console */}
                    <Panel defaultSize={50} minSize={30}>
                      <PanelGroup direction="vertical">
                        {/* Code Editor Panel */}
                        <Panel defaultSize={70} minSize={40}>
                          <div className="h-full flex flex-col">
                            {/* Editor Header */}
                            <div className="border-b bg-gray-50 px-4 py-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Code className="h-4 w-4" />
                                <span className="font-medium text-sm">
                                  Code Editor
                                </span>
                                {currentCompilerId && (
                                  <Badge variant="outline" className="text-xs">
                                    ID: {currentCompilerId.slice(-8)}
                                  </Badge>
                                )}
                              </div>
                              <Select
                                value={selectedLanguage}
                                onValueChange={setSelectedLanguage}
                              >
                                <SelectTrigger className="w-32 h-8">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableLanguages.map((lang) => (
                                    <SelectItem key={lang} value={lang}>
                                      {lang.charAt(0).toUpperCase() +
                                        lang.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Monaco Editor */}
                            <div className="flex-1 relative">
                              <CodeEditor
                                height="100%"
                                language={getMonacoLanguage(selectedLanguage)}
                                theme="vs-light"
                                value={
                                  typeof answer === "string"
                                    ? answer
                                    : question.code?.[selectedLanguage]
                                        ?.defaultCode ||
                                      getLanguageTemplate(selectedLanguage)
                                }
                                onChange={handleCodingChange}
                                onMount={(editor: any, monaco: any) => {
                                  editorRef.current = editor;

                                  // Block copy/paste if configured
                                  if (
                                    assessment.config.disableCopyPasteInEditor
                                  ) {
                                    editor.addCommand(
                                      monaco.KeyMod.CtrlCmd |
                                        monaco.KeyCode.KeyC,
                                      () => {}
                                    );
                                    editor.addCommand(
                                      monaco.KeyMod.CtrlCmd |
                                        monaco.KeyCode.KeyV,
                                      () => {}
                                    );
                                    editor.addCommand(
                                      monaco.KeyMod.CtrlCmd |
                                        monaco.KeyCode.KeyX,
                                      () => {}
                                    );
                                    editor.updateOptions({
                                      contextmenu: false,
                                    });
                                  }
                                }}
                                options={{
                                  minimap: { enabled: false },
                                  scrollBeyondLastLine: false,
                                  fontSize: 14,
                                  lineNumbers: "on",
                                  automaticLayout: true,
                                  contextmenu:
                                    !assessment.config.disableCopyPasteInEditor,
                                  copyWithSyntaxHighlighting:
                                    !assessment.config.disableCopyPasteInEditor,
                                  dragAndDrop:
                                    !assessment.config.disableCopyPasteInEditor,
                                  wordWrap: "on",
                                  tabSize: 4,
                                  insertSpaces: true,
                                }}
                              />
                            </div>

                            {/* Action Buttons */}
                            <div className="border-t bg-gray-50 px-4 py-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {testResults.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {testResults.filter((r) => r.passed).length}
                                    /{testResults.length} passed
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setIsConsoleExpanded(!isConsoleExpanded)
                                  }
                                  className="text-xs"
                                >
                                  Console ({consoleOutput.length})
                                  {isConsoleExpanded ? (
                                    <ChevronDown className="h-3 w-3 ml-1" />
                                  ) : (
                                    <ChevronUp className="h-3 w-3 ml-1" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Panel>

                        {/* Vertical Resize Handle */}
                        <PanelResizeHandle className="h-2 bg-gray-200 hover:bg-gray-300 transition-colors flex items-center justify-center group">
                          <GripHorizontal className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                        </PanelResizeHandle>

                        {/* Console Output Panel */}
                        <Panel defaultSize={30} minSize={15} maxSize={60}>
                          <div className="h-full bg-gray-900 text-green-400 p-4 overflow-auto">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Terminal className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                  Console Output
                                </span>
                                {consoleOutput.length > 0 && (
                                  <Badge variant="outline" className="text-xs">
                                    {consoleOutput.length} entries
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearConsole}
                                className="text-xs text-gray-400 hover:text-white"
                              >
                                Clear
                              </Button>
                            </div>
                            <div className="text-xs">
                              {renderConsoleOutput()}
                            </div>
                          </div>
                        </Panel>
                      </PanelGroup>
                    </Panel>
                  </PanelGroup>
                </div>
              </div>
            )}
          </div>
        )}

        {!["mcq", "mcqmulti", "findAnswer", "coding"].includes(
          question.questionType
        ) && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md text-gray-500 text-center">
            Unsupported question type: {question.questionType}
          </div>
        )}
      </div>
    </div>
  );
}
