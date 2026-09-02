"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Edit, Clock, Eye, Settings, Users, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";
import { BackHeader } from "@/components/backHeader";
import { getCookie } from "@/utils/getCookie";

interface Question {
  _id: string;
  title: string;
  questionType: string;
  totalMarks: number;
  questionLevel?: string;
}

interface Topic {
  _id: string;
  heading: string;
  selectedQuestions: Question[];
}

interface AssessmentConfig {
  maxTabSwitches: number;
  maxAudioLimitExceedCount: number;
  isCameraRequired: boolean;
  enableAudioProctoring: boolean;
  enableRandomShuffling: boolean;
  disableCopyPasteInEditor: boolean;
  takeSnapshotsDuringTest: boolean;
  restrictFullscreenMode: boolean;
  logoutOnLeave: boolean;
  openContest: boolean;
  restrictedIPs: string[];
  isDeveloperToolsBlocked: boolean;
  resultPolicy: "auto" | "manual";
}

interface AssessmentData {
  _id: string;
  name: string;
  level: string;
  startDate: Date;
  endDate: Date;
  totalTime: number;
  totalQuestionsCount: number;
  totalMarks: number;
  topics: Topic[];
  config: AssessmentConfig;
}

export default function AssessmentConfig({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("overview");
  const { id } = use(params);

  // Fetch assessment data on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/assessment/${id}`);
        console.log("Response is ", response);
        setAssessmentData(response.data.data.assessment);
      } catch (error) {
        console.error("Error fetching assessment data:", error);
        toast.error("Failed to load assessment configuration");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSaveSettings = async () => {
    if (!assessmentData) {
      toast.error("No assessment data available");
      return;
    }
    const token = getCookie("jwt");
    const assessmentId = assessmentData._id;
    try {
      const updatePayload = {
        totalTime: assessmentData.totalTime,
        config: {
          maxTabSwitches: assessmentData.config.maxTabSwitches,
          maxAudioLimitExceedCount:
            assessmentData.config.maxAudioLimitExceedCount,
          isCameraRequired: assessmentData.config.isCameraRequired,
          enableAudioProctoring: assessmentData.config.enableAudioProctoring,
          enableRandomShuffling: assessmentData.config.enableRandomShuffling,
          disableCopyPasteInEditor:
            assessmentData.config.disableCopyPasteInEditor,
          isDeveloperToolsBlocked:
            assessmentData.config.isDeveloperToolsBlocked,
          takeSnapshotsDuringTest:
            assessmentData.config.takeSnapshotsDuringTest,
          restrictFullscreenMode: assessmentData.config.restrictFullscreenMode,
          logoutOnLeave: assessmentData.config.logoutOnLeave,
          openContest: assessmentData.config.openContest,
          restrictedIPs: assessmentData.config.restrictedIPs,
          resultPolicy: assessmentData.config.resultPolicy,
        },
      };
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments/${assessmentId}`,
        updatePayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // Update local state with the new data, preserving topics
      setAssessmentData((prev) => ({
        ...prev,
        ...response.data,
        topics: prev?.topics || [],
      }));
      toast.success("Settings saved successfully");
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(error?.response?.data?.message || "Failed to save settings");
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getQuestionTypes = (topics: Topic[] | undefined) => {
    if (!topics || topics.length === 0) return [];

    return topics
      .flatMap((topic) => topic.selectedQuestions || [])
      .reduce((acc: any[], question) => {
        const existingType = acc.find(
          (item) => item.type === question.questionType
        );
        if (existingType) {
          existingType.count += 1;
          existingType.score += question.totalMarks;
        } else {
          acc.push({
            type: question.questionType,
            difficulty: question?.questionLevel || "beginner",
            difficultyCount: 1,
            count: 1,
            score: question.totalMarks,
          });
        }
        return acc;
      }, []);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#219CAE]"></div>
      </div>
    );
  }

  if (!assessmentData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-red-500 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2">Assessment Not Found</h2>
        <p className="text-gray-600 mb-4">
          The assessment configuration could not be loaded.
        </p>
        <Button
          onClick={() => router.push("/")}
          className="bg-[#219CAE] hover:bg-[#1a7d8b] text-white"
        >
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <BackHeader title={`${assessmentData.name} Configuration`} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assessment Overview Card */}
        <div className="lg:col-span-1">
          <Card className="bg-white border border-gray-200">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-lg text-gray-800">
                Assessment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Name</h3>
                  <p className="font-medium text-gray-900">
                    {assessmentData.name}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Level</h3>
                  <p className="font-medium text-gray-900">
                    {assessmentData.level.charAt(0).toUpperCase() +
                      assessmentData.level.slice(1)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Availability
                  </h3>
                  <p className="text-sm text-gray-700">
                    {formatDate(assessmentData.startDate)}
                  </p>
                  <p className="text-xs text-gray-500">to</p>
                  <p className="text-sm text-gray-700">
                    {formatDate(assessmentData.endDate)}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Total Questions
                  </h3>
                  <p className="font-medium text-gray-900">
                    {assessmentData.totalQuestionsCount}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Total Score
                  </h3>
                  <p className="font-medium text-gray-900">
                    {assessmentData.totalMarks}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">
                    Test Duration
                  </h3>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-500" />
                    <p className="font-medium text-gray-900">
                      {Math.floor(assessmentData.totalTime / 60)} Hour{" "}
                      {assessmentData.totalTime % 60} Minutes
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-8 w-8 p-0"
                    ></Button>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setActiveTab("questions")}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Questions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="mb-6 bg-white border border-gray-200">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-[#219CAE] data-[state=active]:text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="questions"
                className="data-[state=active]:bg-[#219CAE] data-[state=active]:text-white"
              >
                <Eye className="h-4 w-4 mr-2" />
                Questions
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="data-[state=active]:bg-[#219CAE] data-[state=active]:text-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card className="bg-white border border-gray-200">
                <CardHeader className="bg-[#219CAE]/5 border-b border-gray-100">
                  <CardTitle className="text-lg text-[#219CAE]">
                    Assessment Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-100">
                          <th className="text-left p-4 font-medium text-gray-600">
                            Question type
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Difficulty level
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Questions
                          </th>
                          <th className="text-left p-4 font-medium text-gray-600">
                            Score
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getQuestionTypes(assessmentData?.topics).map(
                          (questionType, index) => (
                            <tr key={index} className="border-b border-gray-50">
                              <td className="p-4">
                                <Badge className="bg-[#219CAE]/10 uppercase text-[#219CAE] border-[#219CAE]/20">
                                  {questionType.type}
                                </Badge>
                              </td>
                              <td className="p-4">
                                <Badge className="bg-[#F68622]/10 capitalize text-[#F68622] border-[#F68622]/20">
                                  {questionType.difficulty} (
                                  {questionType.difficultyCount})
                                </Badge>
                              </td>
                              <td className="p-4 text-gray-900">
                                {questionType.count}
                              </td>
                              <td className="p-4 text-gray-900">
                                {questionType.score}
                              </td>
                            </tr>
                          )
                        )}
                        {getQuestionTypes(assessmentData?.topics).length ===
                          0 && (
                          <tr>
                            <td
                              colSpan={4}
                              className="p-8 text-center text-gray-500"
                            >
                              No questions found
                            </td>
                          </tr>
                        )}

                        <tr className="bg-gray-50/50 border-t border-gray-200">
                          <td colSpan={2} className="p-4">
                            <div className="flex items-center">
                              <Clock className="h-5 w-5 mr-3 text-[#219CAE]" />
                              <div>
                                <span className="font-medium text-[#219CAE]">
                                  Test duration
                                </span>
                                <div className="text-gray-600 text-sm">
                                  {Math.floor(assessmentData.totalTime / 60)}{" "}
                                  hour {assessmentData.totalTime % 60} minutes
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-[#219CAE]">
                                {assessmentData.totalQuestionsCount}
                              </div>
                              <div className="text-sm text-gray-600">
                                Questions
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-[#F68622]">
                                {assessmentData.totalMarks}
                              </div>
                              <div className="text-sm text-gray-600">Score</div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="questions">
              <Card className="bg-white border border-gray-200">
                <CardHeader className="bg-[#219CAE]/5 border-b border-gray-100">
                  <CardTitle className="text-lg text-[#219CAE]">
                    Assessment Questions
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-6">
                  <div className="space-y-6">
                    {assessmentData.topics &&
                    assessmentData.topics.length > 0 ? (
                      assessmentData.topics.map(
                        (topic: Topic, topicIndex: number) => (
                          <div key={topic._id}>
                            <h3 className="text-lg font-medium text-gray-800 mb-4">
                              {topic.heading}
                            </h3>
                            <div className="space-y-4">
                              {topic.selectedQuestions &&
                              topic.selectedQuestions.length > 0 ? (
                                topic.selectedQuestions.map(
                                  (question: Question, qIndex: number) => (
                                    <div
                                      key={question._id}
                                      className="border border-gray-200 rounded-lg p-4 hover:border-[#219CAE]/30 transition-colors"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h4 className="font-medium text-gray-800">
                                            Question {topicIndex + 1}.
                                            {qIndex + 1}
                                          </h4>
                                          <div
                                            className="text-gray-600 mt-1"
                                            dangerouslySetInnerHTML={{
                                              __html: question.title,
                                            }}
                                          />
                                        </div>
                                        <Badge
                                          className={
                                            question.questionType === "mcq"
                                              ? "bg-green-100 text-green-800 uppercase"
                                              : "bg-blue-100 text-blue-800 uppercase"
                                          }
                                        >
                                          {question.questionType}
                                        </Badge>
                                      </div>
                                      <div className="mt-2 text-sm text-gray-500">
                                        {question.questionType === "mcq"
                                          ? "Multiple choice question"
                                          : "Coding problem"}
                                      </div>
                                      <div className="mt-4 flex justify-between items-center">
                                        <div className="text-sm">
                                          <span className="font-medium">
                                            Score:
                                          </span>{" "}
                                          {question.totalMarks} marks
                                        </div>
                                        {/* <Button variant="outline" size="sm">
                                          View Details
                                        </Button> */}
                                      </div>
                                    </div>
                                  )
                                )
                              ) : (
                                <p className="text-gray-500">
                                  No questions in this topic
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <p className="text-gray-500 text-center">
                        No topics found
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <div className="space-y-6">
                {/* Duration Settings */}
                <Card className="bg-white border border-gray-200">
                  <CardHeader className="bg-[#219CAE]/5 border-b border-gray-100">
                    <CardTitle className="text-lg text-[#219CAE] flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Duration Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label
                          htmlFor="totalTime"
                          className="text-sm font-medium text-gray-700"
                        >
                          Test Duration (minutes)
                        </Label>
                        <Input
                          id="totalTime"
                          type="number"
                          value={assessmentData.totalTime}
                          onChange={(e) =>
                            setAssessmentData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    totalTime: Number(e.target.value),
                                  }
                                : null
                            )
                          }
                          className="border-gray-300 focus:border-[#219CAE] focus:ring-[#219CAE]/20"
                          min="1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label
                          htmlFor="maxTabSwitches"
                          className="text-sm font-medium text-gray-700"
                        >
                          Maximum Tab Switches
                        </Label>
                        <Input
                          id="maxTabSwitches"
                          type="number"
                          value={assessmentData.config.maxTabSwitches}
                          onChange={(e) =>
                            setAssessmentData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      maxTabSwitches: Number(e.target.value),
                                    },
                                  }
                                : null
                            )
                          }
                          className="border-gray-300 focus:border-[#219CAE] focus:ring-[#219CAE]/20"
                          min="0"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Proctoring Settings */}
                <Card className="bg-white border border-gray-200">
                  <CardHeader className="bg-[#219CAE]/5 border-b border-gray-100">
                    <CardTitle className="text-lg text-[#219CAE] flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Proctoring & Security
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-6">
                    <div className="space-y-4">
                      {/* Camera Required */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-base font-medium text-gray-800">
                            Require Camera
                          </Label>
                          <p className="text-sm text-gray-600">
                            Students must enable their camera during the test
                          </p>
                        </div>
                        <Switch
                          checked={assessmentData.config.isCameraRequired}
                          onCheckedChange={(checked) =>
                            setAssessmentData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      isCameraRequired: checked,
                                    },
                                  }
                                : null
                            )
                          }
                          className="data-[state=checked]:bg-[#219CAE]"
                        />
                      </div>

                      {/* Developer Tools Blocked */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-base font-medium text-gray-800">
                            Block Developer Tools
                          </Label>
                          <p className="text-sm text-gray-600">
                            Prevent students from accessing developer tools
                          </p>
                        </div>
                        <Switch
                          checked={
                            assessmentData.config.isDeveloperToolsBlocked
                          }
                          onCheckedChange={(checked) =>
                            setAssessmentData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      isDeveloperToolsBlocked: checked,
                                    },
                                  }
                                : null
                            )
                          }
                          className="data-[state=checked]:bg-[#219CAE]"
                        />
                      </div>

                      {/* Audio Proctoring */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-base font-medium text-gray-800">
                            Enable Audio Proctoring
                          </Label>
                          <p className="text-sm text-gray-600">
                            Monitor audio during the test
                          </p>
                        </div>
                        <Switch
                          checked={assessmentData.config.enableAudioProctoring}
                          onCheckedChange={(checked) =>
                            setAssessmentData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      enableAudioProctoring: checked,
                                    },
                                  }
                                : null
                            )
                          }
                          className="data-[state=checked]:bg-[#219CAE]"
                        />
                      </div>

                      {/* Take Snapshots */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-base font-medium text-gray-800">
                            Take Snapshots During Test
                          </Label>
                          <p className="text-sm text-gray-600">
                            Periodically capture webcam images during the test
                          </p>
                        </div>
                        <Switch
                          checked={
                            assessmentData.config.takeSnapshotsDuringTest
                          }
                          onCheckedChange={(checked) =>
                            setAssessmentData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      takeSnapshotsDuringTest: checked,
                                    },
                                  }
                                : null
                            )
                          }
                          className="data-[state=checked]:bg-[#219CAE]"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Test Behavior Settings */}
                <Card className="bg-white border border-gray-200">
                  <CardHeader className="bg-[#219CAE]/5 border-b border-gray-100">
                    <CardTitle className="text-lg text-[#219CAE] flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Test Behavior
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-6">
                    <div className="space-y-4">
                      {/* Random Shuffling */}
                      {/* <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-base font-medium text-gray-800">
                            Enable Random Shuffling
                          </Label>
                          <p className="text-sm text-gray-600">
                            Randomize the order of questions for each student
                          </p>
                        </div>
                        <Switch
                          checked={assessmentData.config.enableRandomShuffling}
                          onCheckedChange={(checked) =>
                            setAssessmentData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      enableRandomShuffling: checked,
                                    },
                                  }
                                : null
                            )
                          }
                          className="data-[state=checked]:bg-[#219CAE]"
                        />
                      </div> */}

                      {/* Disable Copy Paste */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-base font-medium text-gray-800">
                            Disable Copy-Paste in Editor
                          </Label>
                          <p className="text-sm text-gray-600">
                            Prevent students from copying and pasting code
                          </p>
                        </div>
                        <Switch
                          checked={
                            assessmentData.config.disableCopyPasteInEditor
                          }
                          onCheckedChange={(checked) =>
                            setAssessmentData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      disableCopyPasteInEditor: checked,
                                    },
                                  }
                                : null
                            )
                          }
                          className="data-[state=checked]:bg-[#219CAE]"
                        />
                      </div>

                      {/* Restrict Fullscreen */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-base font-medium text-gray-800">
                            Restrict Fullscreen Mode
                          </Label>
                          <p className="text-sm text-gray-600">
                            Prevent students from using fullscreen mode
                          </p>
                        </div>
                        <Switch
                          checked={assessmentData.config.restrictFullscreenMode}
                          onCheckedChange={(checked) =>
                            setAssessmentData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      restrictFullscreenMode: checked,
                                    },
                                  }
                                : null
                            )
                          }
                          className="data-[state=checked]:bg-[#219CAE]"
                        />
                      </div>

                      {/* Logout on Leave */}
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="space-y-1">
                          <Label className="text-base font-medium text-gray-800">
                            Logout on Leave
                          </Label>
                          <p className="text-sm text-gray-600">
                            Automatically log out students if they navigate away
                            from the test
                          </p>
                        </div>
                        <Switch
                          checked={assessmentData.config.logoutOnLeave}
                          onCheckedChange={(checked) =>
                            setAssessmentData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      logoutOnLeave: checked,
                                    },
                                  }
                                : null
                            )
                          }
                          className="data-[state=checked]:bg-[#219CAE]"
                        />
                      </div>

                      {/* Open Contest */}
                      <div className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
                        <div className="space-y-1">
                          <Label className="text-base font-semibold text-gray-900">
                            Open Contest
                          </Label>
                          <p className="text-sm text-gray-600">
                            Allow students to join the assessment without an
                            invitation.
                          </p>
                        </div>

                        <div className="flex flex-col items-end space-y-1">
                          <Switch
                            checked={assessmentData.config.openContest}
                            disabled
                            className="data-[state=checked]:bg-[#5CA7D4] opacity-60 cursor-not-allowed"
                          />
                          <span className="text-xs font-medium text-[#5CA7D4] bg-[#EAF6FC] px-2 py-0.5 rounded-full">
                            Upcoming soon
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white border border-gray-200">
                  <CardHeader className="bg-[#219CAE]/5 border-b border-gray-100">
                    <CardTitle className="text-lg text-[#219CAE] flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Result Policy
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="py-6 space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-base font-medium text-gray-800">
                          Set Result Policy
                        </Label>
                        <p className="text-sm text-gray-600">
                          Choose how results are displayed to students after the
                          assessment
                        </p>
                      </div>
                      <Switch
                        checked={
                          assessmentData.config.resultPolicy === "manual"
                        }
                        onCheckedChange={(checked) =>
                          setAssessmentData((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  config: {
                                    ...prev.config,
                                    resultPolicy: checked ? "manual" : "auto",
                                  },
                                }
                              : null
                          )
                        }
                        className="data-[state=checked]:bg-[#219CAE]"
                      />
                    </div>

                    {/* Conditional message */}
                    {assessmentData.config.resultPolicy === "manual" ? (
                      <div className="p-3 rounded-md bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
                        Result policy is set to <strong>Manual</strong>. You
                        must manually release results after the assessment ends.
                      </div>
                    ) : (
                      <div className="p-3 rounded-md bg-gray-50 border border-gray-200 text-sm text-gray-700">
                        Default policy is <strong>Auto</strong>. Results will be
                        automatically calculated and shown to students after the
                        assessment.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* IP Restrictions */}
                <Card className="bg-white border border-gray-200">
                  <CardHeader className="bg-[#219CAE]/5 border-b border-gray-100">
                    <CardTitle className="text-lg text-[#219CAE] flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      IP Restrictions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-6">
                    <div className="space-y-4">
                      <div>
                        <Label
                          htmlFor="restrictedIPs"
                          className="text-sm font-medium text-gray-700 mb-2 block"
                        >
                          Restricted IP Addresses
                        </Label>
                        <Input
                          id="restrictedIPs"
                          placeholder="e.g. 192.168.1.1, 10.0.0.1"
                          className="border-gray-300 focus:border-[#219CAE] focus:ring-[#219CAE]/20"
                          value={assessmentData.config.restrictedIPs.join(", ")}
                          onChange={(e) => {
                            const ips = e.target.value
                              .split(",")
                              .map((ip) => ip.trim())
                              .filter((ip) => ip.length > 0);
                            setAssessmentData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    config: {
                                      ...prev.config,
                                      restrictedIPs: ips,
                                    },
                                  }
                                : null
                            );
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Students with these IP addresses will not be able to
                          access the assessment
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveSettings}
                    className="bg-[#219CAE] hover:bg-[#1a7d8b] text-white px-8 py-2"
                  >
                    Save Settings
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
