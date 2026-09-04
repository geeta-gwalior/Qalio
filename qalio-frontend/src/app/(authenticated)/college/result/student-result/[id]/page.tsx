"use client";

import React from "react";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { getCookie } from "@/utils/getCookie";
import { Mail, Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useAuthStore } from "@/stores/auth-store";
import { BackHeader } from "@/components/backHeader";
import StudentTopicReportPDF from "@/components/common/StudentTopicReportPDF";
import { pdf } from "@react-pdf/renderer";

export default function StudentResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const searchParams = useSearchParams();
  const jobTitle = searchParams.get("jobTitle") || "Assessment";
  const { id: studentId } = React.use(params);
  const assessmentId = searchParams.get("assessmentId");
  const user: any = useAuthStore((state) => state.user);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAttemptIndex, setSelectedAttemptIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [bestAttemptId, setBestAttemptId] = useState<string | null>(null);

  useEffect(() => {
    const token = getCookie("jwt");

    if (!studentId || !assessmentId) return;

    const fetchStudentAssessmentResult = async () => {
      try {
        setLoading(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/college/student/result/${assessmentId}`,
          {
            params: {
              studentId,
            },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setResult(res.data);

        const completedAttempts = res.data.fullResponses.filter(
          (attempt: any) => attempt.status === "submitted"
        );

        // Find the highest scoring one
        if (completedAttempts.length > 0) {
          const bestAttempt = completedAttempts.reduce(
            (best: any, current: any) =>
              (current.totalMarksScored || 0) > (best.totalMarksScored || 0)
                ? current
                : best
          );
          setBestAttemptId(bestAttempt._id);

          const bestIndex = res.data.fullResponses.findIndex(
            (attempt: any) => attempt._id === bestAttempt._id
          );

          setSelectedAttemptIndex(bestIndex >= 0 ? bestIndex : 0);
        }
      } catch (error) {
        console.error("Error fetching result:", error);
        setError("Failed to load student results. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAssessmentResult();
  }, [studentId, assessmentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-600 border-blue-200 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-red-50 rounded-lg">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error</h2>
          <p className="text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-yellow-50 rounded-lg">
          <h2 className="text-xl font-semibold text-yellow-700 mb-2">
            No Results Found
          </h2>
          <p className="text-gray-700">
            No assessment results available for this student.
          </p>
        </div>
      </div>
    );
  }

  const { assessment, fullResponses } = result;
  const selectedAttempt = fullResponses[selectedAttemptIndex];
  const studentInfo = selectedAttempt?.student || {};
  // Format date function
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy • HH:mm");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Helper function to strip HTML tags
  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  // Helper function to determine if a question is multi-select
  const isMultiSelect = (question: any) => {
    return question.questionId.questionType === "mcqmulti";
  };

  // Helper function to get selected answers
  const getSelectedAnswers = (answer: string | string[] | any[]) => {
    if (Array.isArray(answer)) {
      return answer.map((item) => {
        if (typeof item === "string") {
          return item;
        } else if (
          typeof item === "object" &&
          item !== null &&
          "input" in item
        ) {
          return item.input;
        }
        return String(item);
      });
    }
    if (typeof answer === "object" && answer !== null && "input" in answer) {
      return [(answer as { input: string }).input];
    }
    return [String(answer)];
  };
  const handleDownload = async () => {
    setIsGenerating(true);
    const blob = await pdf(
      <StudentTopicReportPDF
        assessment={assessment}
        selectedAttempt={selectedAttempt}
        student={studentInfo}
      />
    ).toBlob();

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${
      studentInfo.name?.replace(/\s+/g, "_") || "student"
    }_topic_report.pdf`;
    link.click();
    URL.revokeObjectURL(url);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <BackHeader
            title={
              (user?.role === "company"
                ? `${jobTitle} (${assessment.name.split("#")[0].trim()})`
                : assessment?.name || "Assessment") +
              " / " +
              (studentInfo?.name || "Student")
            }
          />

          {selectedAttempt?._id === bestAttemptId && (
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="bg-[#219CAE] text-white px-4 py-2 rounded hover:bg-[#4a909b] transition whitespace-nowrap"
            >
              {isGenerating ? "Generating PDF..." : "Download PDF Report"}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[500px_1fr] gap-6">
          {/* Left Column */}
          <div className="sticky top-[76px] self-start h-fit">
            <div className="space-y-6">
              {/* Student Profile Card */}
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-16 h-16">
                    <AvatarImage
                      src={`/placeholder.svg?height=80&width=80&query=${studentInfo?.name}`}
                      alt={studentInfo?.name}
                    />
                    <AvatarFallback>
                      {studentInfo?.name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") || "ST"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      {studentInfo?.name || "Student Name"}
                    </h2>
                    <p className="text-gray-600">
                      {studentInfo?.email || "student@example.com"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 mb-6">
                  <Card className="flex-1 p-4 text-center border-2">
                    <p className="text-sm text-gray-600 mb-1">Your Score</p>
                    <p className="text-2xl font-semibold">
                      {Number.isInteger(selectedAttempt?.totalMarksScored ?? 0)
                        ? selectedAttempt?.totalMarksScored ?? 0
                        : (selectedAttempt?.totalMarksScored ?? 0).toFixed(2)}
                    </p>
                  </Card>
                  <Card className="flex-1 p-4 text-center border-2">
                    <p className="text-sm text-gray-600 mb-1">Total Score</p>
                    <p className="text-2xl font-semibold">
                      {assessment?.totalMarks || 0}
                    </p>
                  </Card>
                </div>

                <div className="border-t pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    {/* <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Mail className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-700">
                        {studentInfo?.email || "student@example.com"}
                      </span>
                    </div> */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-700">
                      Started: {selectedAttempt?.startedAt
                          ? formatDate(selectedAttempt.startedAt)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-700">
                      Completed: {selectedAttempt?.submittedAt
                          ? formatDate(selectedAttempt.startedAt)
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Clock className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-700">
                        {selectedAttempt?.startedAt &&
                        selectedAttempt?.submittedAt
                          ? `Completed in ${Math.round(
                              (new Date(selectedAttempt.submittedAt).getTime() -
                                new Date(selectedAttempt.startedAt).getTime()) /
                                60000
                            )} minutes`
                          : "Completed"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={`${
                          selectedAttempt?.status === "submitted"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : "bg-yellow-100 text-yellow-800 border-yellow-200"
                        }`}
                      >
                        {selectedAttempt?.status === "submitted"
                          ? "Completed"
                          : "Incomplete"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Assessment History */}
              <Card className="overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <h3 className="font-medium text-gray-900">Attempt History</h3>
                  <p className="text-sm text-gray-600">
                    Total attempts: {fullResponses.length}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Attempt
                        </th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                          Score
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Date
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fullResponses.map((attempt: any, index: number) => (
                        <tr
                          key={attempt._id}
                          className={`border-t border-l-4 ${
                            selectedAttemptIndex === index
                              ? "border-l-blue-500 bg-blue-50"
                              : attempt.status === "submitted"
                              ? "border-l-green-400"
                              : "border-l-yellow-400"
                          } cursor-pointer hover:bg-gray-50`}
                          onClick={() => setSelectedAttemptIndex(index)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900">
                            Attempt {index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">
                            {Number.isInteger(attempt.totalMarksScored ?? 0)
                              ? attempt.totalMarksScored ?? 0
                              : (attempt.totalMarksScored ?? 0).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {attempt.startedAt
                              ? formatDate(attempt.startedAt)
                              : "N/A"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <Badge
                              className={`${
                                attempt.status === "submitted"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {attempt.status === "submitted"
                                ? "Completed"
                                : "Incomplete"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Proctoring Details */}
              <Card className="overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <h3 className="font-medium text-gray-900">Proctoring Details</h3>
                </div>
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm text-gray-600">Trust Score</span>
                    <span className={`font-bold ${(selectedAttempt?.trustScore ?? 100) >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedAttempt?.trustScore ?? 100}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-sm text-gray-600">Tab Switches</span>
                    <span className="font-semibold text-gray-900">{selectedAttempt?.tabSwitchCount ?? 0}</span>
                  </div>
                  
                  {selectedAttempt?.proctoringLogs && selectedAttempt.proctoringLogs.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Logs:</p>
                      <ul className="text-xs text-gray-600 list-disc pl-4 space-y-1">
                        {selectedAttempt.proctoringLogs.map((log: any, idx: number) => (
                          <li key={idx}>[{formatDate(log.timestamp)}] {log.eventType} - {log.details}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>

          {/* Right Column - Questions */}
          <div className="overflow-y-auto max-h-[calc(100vh-100px)] pr-1">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Attempt {selectedAttemptIndex + 1}
              </h3>
              <p className="text-sm text-gray-600">
                {selectedAttempt?.responses?.length || 0} questions answered
              </p>
            </div>

            {selectedAttempt?.responses?.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-gray-600">
                  No questions answered in this attempt.
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                {selectedAttempt?.responses?.map(
                  (response: any, index: number) => {
                    const question = response.questionId;
                    const selectedAnswers = getSelectedAnswers(response.answer);
                    const multi = isMultiSelect(response);

                    return (
                      <Card
                        key={response._id}
                        className={`p-6 ${
                          question.questionType === "prompt"
                            ? response.marksAwarded === question.totalMarks
                              ? "bg-green-50 border-green-200"
                              : response.marksAwarded > 0
                              ? "bg-green-50 border-green-200"
                              : "bg-red-50 border-red-200"
                            : question.questionType === "findAnswer"
                            ? "bg-gray-50 border-gray-200" // Neutral style
                            : response.isCorrect
                            ? "bg-green-50 border-green-200"
                            : "bg-orange-50 border-orange-200"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge
                                variant="outline"
                                className="bg-gray-100 uppercase text-gray-700 border-gray-200"
                              >
                                {question.questionLevel || "beginner"}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-blue-50 uppercase text-blue-700 border-blue-200"
                              >
                                {question.questionType === "mcq"
                                  ? "Single Choice"
                                  : question.questionType === "mcqmulti"
                                  ? "Multiple Choice"
                                  : question.questionType === "findAnswer"
                                  ? "Find Answer"
                                  : question.questionType}
                              </Badge>
                            </div>
                            <h3 className="text-base font-medium text-gray-900 leading-relaxed mb-2">
                              Que-{index + 1}) {stripHtml(question.title)}
                            </h3>
                            <div className="flex items-center gap-4 mb-3">
                              <Badge
                                variant="outline"
                                className={`${
                                  question.questionType === "prompt" ||
                                  question.questionType === "findAnswer"
                                    ? response.marksAwarded ===
                                      question.totalMarks
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : response.marksAwarded > 0
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                    : response.isCorrect
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                Marks:{" "}
                                {Number.isInteger(response.marksAwarded)
                                  ? response.marksAwarded
                                  : response.marksAwarded.toFixed(2)}{" "}
                                / {question.totalMarks}
                              </Badge>
                            </div>
                          </div>
                          {question.questionType === "prompt" ? (
                            response.marksAwarded === question.totalMarks ? (
                              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 ml-4" />
                            ) : response.marksAwarded > 0 ? (
                              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 ml-4" />
                            ) : (
                              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 ml-4" />
                            )
                          ) : question.questionType === "findAnswer" ? (
                            response.marksAwarded > 0 ? (
                              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 ml-4" />
                            ) : (
                              <XCircle className="w-6 h-6 text-orange-600 flex-shrink-0 ml-4" />
                            )
                          ) : response.isCorrect ? (
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 ml-4" />
                          ) : (
                            <XCircle className="w-6 h-6 text-orange-600 flex-shrink-0 ml-4" />
                          )}
                        </div>

                        <div className="mb-4">
                          <p className="text-base text-gray-600 mb-2">
                            Your Answer{selectedAnswers.length > 1 ? "s" : ""}:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {selectedAnswers.map(
                              (answer: string, answerIndex: number) => (
                                <Badge
                                  key={answerIndex}
                                  variant="outline"
                                  className="bg-blue-50 text-sm text-blue-700 border-blue-200 max-w-full break-words whitespace-normal"
                                >
                                  <span className="break-words whitespace-normal">
                                    {String(answer)}
                                  </span>
                                </Badge>
                              )
                            )}
                          </div>
                        </div>

                        {/* Footer Notes */}
                        {/* <div className="pt-4 border-t border-gray-200">
                          <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                              Full-screen mode is mandatory, exiting will log
                              you out.
                            </li>
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                              All popups, tab switches, or window changes will
                              terminate your session.
                            </li>
                            <li className="flex items-center">
                              <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
                              Camera access may be required for identity
                              verification and monitoring.
                            </li>
                          </ul>
                        </div> */}
                      </Card>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
