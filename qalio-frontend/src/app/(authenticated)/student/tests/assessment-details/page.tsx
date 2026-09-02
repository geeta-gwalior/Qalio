"use client";

import { ArrowLeft, BookOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAssessmentStore } from "@/stores/assessmentStore";

interface AssessmentDetails {
  _id: string;
  name: string;
  additionalDescription?: string;
  totalTime: number;
  totalAttempts: number;
  totalMarks: number;
  isNegativeMarking: boolean;
  startDate: string | Date;
  endDate: string | Date;
  totalQuestionsCount: number;
  attemptCount: number;
  level: string;
  type: string;
  status: string;
  topics: Array<{
    heading: string;
    description: string;
    selectedQuestions: Array<{
      questionId: string;
      title: string;
      questionType: string;
      totalMarks: number;
      _id: string;
    }>;
    _id: string;
  }>;
  studentResponses: string[];
  appearedStudents: string[];
  config: {
    isCameraRequired: boolean;
    maxTabSwitches: number;
    maxAudioLimitExceedCount: number;
    enableAudioProctoring: boolean;
    enableRandomShuffling: boolean;
    disableCopyPasteInEditor: boolean;
    takeSnapshotsDuringTest: boolean;
    restrictFullscreenMode: boolean;
    logoutOnLeave: boolean;
    restrictedIPs: string[];
    openContest: boolean;
    instructions: Array<{
      _id: string;
      title: string;
      description: string;
    }>;
    faqs: Array<{
      _id: string;
      question: string;
      answer: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export default function AssessmentDetailsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id");
  const { currentAssessmentId, usedAttempts, allowedAttempts } =
    useAssessmentStore();
  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssessment = async () => {
      if (!assessmentId) {
        setError("Assessment ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Replace with your actual API endpoint
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments/${assessmentId}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch assessment: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.assessment) {
          // Transform the backend data to match our frontend interface
          setAssessment(data.assessment);
        } else {
          throw new Error(data.message || "Failed to fetch assessment");
        }
      } catch (err) {
        console.log("Error fetching assessment:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [assessmentId]);

  // Helper function to get unique question types
  const getUniqueQuestionTypes = (topics: any[]) => {
    const types = new Set<string>();
    topics.forEach((topic) => {
      topic.selectedQuestions?.forEach((q: any) => {
        if (q.questionType) {
          switch (q.questionType) {
            case "mcq":
              types.add("Multiple Choice (Single)");
              break;
            case "mcqmulti":
              types.add("Multiple Choice (Multiple)");
              break;
            case "findAnswer":
              types.add("Reading Comprehension");
              break;
            case "coding":
              types.add("Coding Questions");
              break;
            default:
              types.add(q.questionType);
          }
        }
      });
    });
    return Array.from(types);
  };

  // Helper function to calculate time allocation per topic
  const calculateTimeAllocation = (topics: any[], totalTime: number) => {
    const allocations: string[] = [];
    const totalQuestions = topics.reduce(
      (sum, topic) => sum + (topic.selectedQuestions?.length || 0),
      0
    );

    topics.forEach((topic) => {
      if (topic.selectedQuestions?.length > 0) {
        const topicQuestions = topic.selectedQuestions.length;
        const estimatedTime = Math.round(
          (topicQuestions / totalQuestions) * totalTime
        );
        allocations.push(`${topic.heading}: ~${estimatedTime} minutes`);
      }
    });
    return allocations;
  };

  // Helper function to format date
  const formatDate = (dateInput: string | Date) => {
    try {
      const date =
        typeof dateInput === "string" ? new Date(dateInput) : dateInput;

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return typeof dateInput === "string" ? dateInput : "Invalid Date";
      }

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return typeof dateInput === "string" ? dateInput : "Invalid Date";
    }
  };

  if (loading) {
    return (
      <div className="p-6 w-full mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-10 w-10 rounded-md bg-gray-200 animate-pulse"></div>
          <div className="h-6 w-48 bg-gray-200 animate-pulse"></div>
        </div>
        <div className="h-[180px] w-full bg-gray-200 animate-pulse rounded-lg mb-8"></div>
        <div className="flex flex-col md:flex-row gap-6 mt-4">
          <div className="flex-1 h-[580px] bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="w-full md:w-[350px] h-[580px] bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 w-full max-w-[1240px] mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-red-600">Error</h2>
          <p className="text-gray-600 mt-2">{error}</p>
          <Button
            onClick={() => router.push("/student/tests")}
            className="mt-4 bg-[#219CAE] hover:bg-[#1a7a89] text-white"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="p-6 w-full max-w-[1240px] mx-auto">
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-gray-800">
            Assessment not found
          </h2>
          <p className="text-gray-600 mt-2">
            The assessment you&apos;re looking for doesn&apos;t exist or has
            been removed.
          </p>
          <Button
            onClick={() => router.push("/student/tests")}
            className="mt-4 bg-[#219CAE] hover:bg-[#1a7a89] text-white"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 sm:p-4 md:p-2">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 border-b border-gray-200 pb-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => router.push("/student/tests")}
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-md shadow-md"
            >
              <ArrowLeft className="h-4 w-4 text-gray-600" />
            </Button>
            <h1 className="text-xl font-bold text-gray-800">
              {assessment.name}
            </h1>
          </div>

          {/* Quick Action Buttons */}
          <div className="hidden md:flex gap-2">
            {/* <Button
              variant="outline"
              onClick={() => {
              }}
            >
              FAQs
            </Button> */}
            <Button
              onClick={() =>
                router.push(
                  `/student/tests/take-test?assessmentId=${currentAssessmentId}`
                )
              }
              className="bg-[#219CAE] hover:bg-[#1a7a89] text-white"
              disabled={usedAttempts >= allowedAttempts}
            >
              {usedAttempts >= allowedAttempts
                ? "Assessment Completed"
                : "Start Assessment"}
            </Button>
          </div>
        </div>
      </div>

      {/* Test Overview Card */}
      <Card className="mb-8 shadow-md rounded-lg p-2.5 pl-0.5">
        <CardContent className="pl-2.5">
          <div className="flex flex-col sm:flex-row">
            {/* Mascot/Logo Section */}
            <div className="w-full sm:w-[140px] h-[140px] rounded-lg bg-[#EEF6FD] flex items-center justify-center mb-4 sm:mb-0 p-3">
              <BookOpen key="bookOpen" className="h-40 w-40 text-black" />
            </div>

            <div className="flex-1 p-2">
              <div className="grid text-center grid-cols-2 md:grid-cols-4 gap-1 gap-y-8">
                {/* Time Period */}
                <div className="border-r-0 md:border-r border-dashed border-[#219CAE] ml-2">
                  <h3 className="text-sm font-bold text-gray-600">Duration</h3>
                  <p className="text-sm text-gray-600">
                    {assessment.totalTime} minutes
                  </p>
                </div>

                {/* Timeline */}
                <div className="border-r-0 md:border-r border-dashed border-[#219CAE]">
                  <h3 className="text-sm font-bold text-gray-600">Timeline</h3>
                  <p className="text-sm text-gray-600">
                    {formatDate(assessment.startDate)} -{" "}
                    {formatDate(assessment.endDate)}
                  </p>
                </div>

                {/* Student Appeared */}
                <div className="border-r-0 md:border-r border-dashed border-[#219CAE] col-span-1">
                  <h3 className="text-sm font-bold text-gray-600">
                    Total Attempts
                  </h3>
                  <p className="text-sm text-gray-600">
                    {assessment.totalAttempts || 0}
                  </p>
                </div>

                {/* Total Marks */}
                <div>
                  <h3 className="text-sm font-bold text-gray-600">
                    Total Marks
                  </h3>
                  <p className="text-sm text-gray-600">
                    {assessment.totalMarks}
                  </p>
                </div>
              </div>

              {/* Test Description */}
              {assessment.additionalDescription && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-gray-600">
                    Test Description
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {assessment.additionalDescription}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area - Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-6 mt-4">
        {/* Left Column - Test Guidelines */}
        <div className="flex-1 flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            Test Guidelines
          </h2>
          <Card className="shadow-md rounded-lg flex-1 flex flex-col">
            <CardContent className="p-3 overflow-auto">
              {/* Instructions from config */}
              {assessment.config?.instructions &&
                assessment.config.instructions.length > 0 && (
                  <>
                    {assessment.config.instructions.map(
                      (instruction, index) => (
                        <div key={instruction._id} className="mb-4">
                          <h3 className="text-base font-bold text-gray-600 mb-1">
                            {instruction.title}
                          </h3>
                          <div className="text-sm text-gray-600 space-y-1">
                            {instruction.description
                              .split(/\d+\./)
                              .filter(Boolean)
                              .map((item, itemIndex) => (
                                <p key={itemIndex} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{item.trim()}</span>
                                </p>
                              ))}
                          </div>
                          {index <
                            assessment.config.instructions.length - 1 && (
                            <div className="border-t border-dashed border-gray-300 my-3"></div>
                          )}
                        </div>
                      )
                    )}
                  </>
                )}

              {/* Proctoring Settings */}
              {assessment.config && (
                <>
                  <div className="border-t border-dashed border-gray-300 my-3"></div>
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-gray-600 mb-1">
                      Proctoring & Security Settings
                    </h3>
                    <ul className="text-sm text-gray-600 space-y-2">
                      {/* Camera Monitoring */}
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          <strong>Camera Monitoring:</strong>{" "}
                          {assessment.config.isCameraRequired ? (
                            <span className="text-red-600">
                              Required - Your camera will be monitored
                              throughout the test
                            </span>
                          ) : (
                            <span className="text-green-600">Not required</span>
                          )}
                        </span>
                      </li>

                      {/* Tab Switching */}
                      {/* <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          <strong>Tab Switching:</strong> Maximum{" "}
                          {assessment.config.maxTabSwitches} tab switches
                          allowed. Exceeding this limit may result in test
                          termination.
                        </span>
                      </li> */}

                      {/* Audio Monitoring */}
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          <strong>Audio Monitoring:</strong>{" "}
                          {assessment.config.enableAudioProctoring ? (
                            <span className="text-red-600">
                              Enabled - Your microphone will be monitored for
                              suspicious sounds
                            </span>
                          ) : (
                            <span className="text-green-600">Disabled</span>
                          )}
                        </span>
                      </li>

                      {/* Screen Snapshots */}
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          <strong>Screen Monitoring:</strong>{" "}
                          {assessment.config.takeSnapshotsDuringTest ? (
                            <span className="text-red-600">
                              Enabled - Random screenshots will be taken during
                              the test
                            </span>
                          ) : (
                            <span className="text-green-600">
                              No screenshots will be taken
                            </span>
                          )}
                        </span>
                      </li>

                      {/* Fullscreen Mode */}
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          <strong>Fullscreen Mode:</strong>{" "}
                          {assessment.config.restrictFullscreenMode ? (
                            <span className="text-red-600">
                              Required - You must stay in fullscreen mode
                              throughout the test
                            </span>
                          ) : (
                            <span className="text-green-600">Not required</span>
                          )}
                        </span>
                      </li>

                      {/* Copy-Paste Restrictions */}
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          <strong>Copy-Paste:</strong>{" "}
                          {assessment.config.disableCopyPasteInEditor ? (
                            <span className="text-red-600">
                              Disabled in code editor
                            </span>
                          ) : (
                            <span className="text-green-600">Allowed</span>
                          )}
                        </span>
                      </li>

                      {/* Question Shuffling */}
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          <strong>Question Order:</strong>{" "}
                          {assessment.config.enableRandomShuffling ? (
                            <span className="text-blue-600">
                              Questions will be randomly shuffled
                            </span>
                          ) : (
                            <span className="text-gray-600">
                              Questions will appear in fixed order
                            </span>
                          )}
                        </span>
                      </li>

                      {/* Auto Logout */}
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          <strong>Auto Logout:</strong>{" "}
                          {assessment.config.logoutOnLeave ? (
                            <span className="text-red-600">
                              You will be automatically logged out if you leave
                              the test window
                            </span>
                          ) : (
                            <span className="text-green-600">
                              You can navigate away temporarily
                            </span>
                          )}
                        </span>
                      </li>

                      {/* IP Restrictions */}
                      {assessment.config.restrictedIPs &&
                        assessment.config.restrictedIPs.length > 0 && (
                          <li className="flex items-start">
                            <span className="mr-2">•</span>
                            <span>
                              <strong>IP Restrictions:</strong>{" "}
                              <span className="text-red-600">
                                Test access is restricted to specific IP
                                addresses
                              </span>
                            </span>
                          </li>
                        )}

                      {/* Open Contest */}
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>
                          <strong>Contest Type:</strong>{" "}
                          {assessment.config.openContest ? (
                            <span className="text-blue-600">
                              Open contest - Public participation allowed
                            </span>
                          ) : (
                            <span className="text-gray-600">
                              Restricted access - Invitation only
                            </span>
                          )}
                        </span>
                      </li>
                    </ul>

                    {/* Warning Box for Strict Proctoring */}
                    {(assessment.config.isCameraRequired ||
                      assessment.config.enableAudioProctoring ||
                      assessment.config.takeSnapshotsDuringTest ||
                      assessment.config.restrictFullscreenMode) && (
                      <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 font-medium">
                          ⚠️ <strong>Important:</strong> This assessment has
                          strict proctoring enabled. Please ensure you have a
                          stable internet connection, proper lighting, and a
                          quiet environment before starting the test.
                        </p>
                      </div>
                    )}

                    {/* Helpful Tips Box */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-700">
                        💡 <strong>Tips:</strong> Close unnecessary
                        applications, ensure your browser permissions are
                        enabled for camera/microphone (if required), and have a
                        backup internet connection ready.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Test Overview */}
        <div className="w-full lg:w-[350px] xl:w-[400px] flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 mb-3">
            Test Overview
          </h2>
          <Card className="shadow-md rounded-lg flex-1 flex flex-col">
            <CardContent className="p-4 flex-1 overflow-auto">
              {/* Number of Questions */}
              <div className="mb-4">
                <h3 className="text-base font-bold text-gray-600 mb-1">
                  Number of Questions:
                </h3>
                <p className="text-sm text-gray-600">
                  {assessment.totalQuestionsCount}
                </p>
              </div>
              <div className="border-t border-dashed border-[#219CAE] my-3"></div>

              {/* Types of Questions */}
              <div className="mb-4">
                <h3 className="text-base font-bold text-gray-600 mb-1">
                  Types of Questions:
                </h3>
                {getUniqueQuestionTypes(assessment.topics).map(
                  (type, index) => (
                    <p key={`type-${index}`} className="text-sm text-gray-600">
                      • {type}
                    </p>
                  )
                )}
              </div>
              <div className="border-t border-dashed border-[#219CAE] my-3"></div>

              {/* Time Allocation */}
              <div className="mb-4">
                <h3 className="text-base font-bold text-gray-600 mb-1">
                  Time Allocation:
                </h3>
                {calculateTimeAllocation(
                  assessment.topics,
                  assessment.totalTime
                ).map((time, index) => (
                  <p key={`time-${index}`} className="text-sm text-gray-600">
                    • {time}
                  </p>
                ))}
              </div>
              <div className="border-t border-dashed border-[#219CAE] my-3"></div>

              {/* Topics Overview */}
              <div className="mb-4">
                <h3 className="text-base font-bold text-gray-600 mb-1">
                  Topics Covered:
                </h3>
                {assessment.topics.map((topic, index) => (
                  <div key={topic._id} className="mb-2">
                    <p className="text-sm text-gray-600 font-medium">
                      • {topic.heading}
                    </p>
                    <p className="text-xs text-gray-500 ml-4">
                      {topic.description}
                    </p>
                    <p className="text-xs text-gray-500 ml-4">
                      {topic.selectedQuestions?.length || 0} questions
                    </p>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-[#219CAE] my-3"></div>

              {/* Assessment Details */}
              <div>
                <h3 className="text-base font-bold text-gray-600 mb-1">
                  Assessment Details:
                </h3>
                <p className="text-sm text-gray-600">
                  • Level: {assessment.level}
                </p>
                <p className="text-sm text-gray-600">
                  • Type: {assessment.type}
                </p>
                <p className="text-sm text-gray-600">
                  • Status: {assessment.status}
                </p>
                <p className="text-sm text-gray-600">
                  • Max Attempts: {assessment.totalAttempts}
                </p>
                {assessment.isNegativeMarking && (
                  <p className="text-sm text-red-600">
                    • Negative marking is enabled
                  </p>
                )}
              </div>
            </CardContent>

            {/* Action Buttons - Fixed at top of right column */}
            {/* <div className="p-4 border-b border-gray-200">
              <Button
                onClick={() =>
                  router.push(
                    `/student/tests/take-assessment?id=${assessmentId}`
                  )
                }
                className="w-full bg-[#219CAE] hover:bg-[#1a7a89] text-white p-4 mb-3"
                size="lg"
              >
                Start Assessment
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 text-sm"
                  onClick={() => {
     
                  }}
                >
                  View FAQs
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-sm"
                  onClick={() => {
               
                  }}
                >
                  Sample Test
                </Button>
              </div>
            </div> */}
          </Card>
        </div>
      </div>

      {/* Floating Action Button - Alternative option */}
      <div className="fixed bottom-6 right-6 lg:hidden">
        <Button
          onClick={() =>
            router.push(
              `/student/tests/take-test?assessmentId=${currentAssessmentId}`
            )
          }
          className="bg-[#219CAE] hover:bg-[#1a7a89] text-white"
          disabled={usedAttempts >= allowedAttempts}
        >
          {usedAttempts >= allowedAttempts
            ? "Assessment Completed"
            : "Start Assessment"}
        </Button>
      </div>
    </div>
  );
}
