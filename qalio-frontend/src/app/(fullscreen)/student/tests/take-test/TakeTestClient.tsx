"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Camera,
  Mic,
  Laptop,
  Smartphone,
  Tablet,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TestTakingPageComponent from "./test-taking-component";
import { getCookie } from "@/utils/getCookie";
import {
  detectDeviceType,
  isDeviceAllowed,
  DEFAULT_ALLOWED_DEVICES,
} from "./device-detection";
import type {
  AssessmentData,
  Question,
  StudentResponse,
  BackendAssessment,
} from "@/types/assessment";

type SubmitResponse = {
  success: boolean;
  message: string;
  result?: {
    status: string;
    submittedAt: string;
    responses: Array<any>;
    totalMarksScored?: number;
  };
};

export interface InternetStatus {
  isOnline: boolean;
  connectionQuality?: any;
  isGoodConnection: boolean;
  isPoorConnection: boolean;
  isOffline: boolean;
}

export default function TakeTestClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId");
  const responseId = searchParams.get("responseId");

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [studentResponse, setStudentResponse] =
    useState<StudentResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCompletedDialog, setShowCompletedDialog] = useState(false);
  const [showSecurityDialog, setShowSecurityDialog] = useState(false);
  const [securityChecked, setSecurityChecked] = useState(false);
  const [mediaPermissionsGranted, setMediaPermissionsGranted] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [deviceType, setDeviceType] = useState<"mobile" | "tablet" | "laptop">(
    "laptop"
  );
  const [isDeviceRestricted, setIsDeviceRestricted] = useState(false);

  // Parse duration - handles numeric duration (minutes)
  const parseDuration = useCallback((duration: number): number => {
    if (!duration || typeof duration !== "number") return 60;
    return duration * 60; // Convert minutes to seconds
  }, []);

  // Check browser compatibility and security requirements
  const checkSecurityRequirements = useCallback(
    async (config: BackendAssessment["config"]) => {
      const issues: string[] = [];

      // Check device restrictions
      const currentDeviceType = detectDeviceType();
      const allowedDevices = config.allowedDevices || DEFAULT_ALLOWED_DEVICES;

      if (!allowedDevices.includes(currentDeviceType)) {
        const deviceTypeText =
          currentDeviceType === "mobile" ? "mobile phone" : currentDeviceType;
        issues.push(
          `This assessment requires a laptop or desktop computer. ${deviceTypeText} devices are not allowed for security reasons.`
        );
      }

      // Check camera/microphone permissions if required
      if (config.isCameraRequired || config.enableAudioProctoring) {
        try {
          const constraints: MediaStreamConstraints = {
            video: config.isCameraRequired,
            audio: config.enableAudioProctoring || config.isCameraRequired,
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          setMediaStream(stream);
          setMediaPermissionsGranted(true);
        } catch (err) {
          if (config.isCameraRequired) {
            issues.push("Camera access is required but not available");
          }
          if (config.enableAudioProctoring) {
            issues.push("Microphone access is required but not available");
          }
          setMediaPermissionsGranted(false);
        }
      } else {
        setMediaPermissionsGranted(true);
      }

      // Check fullscreen capability
      if (config.restrictFullscreenMode && !document.fullscreenEnabled) {
        issues.push(
          "Fullscreen mode is required but not supported by your browser"
        );
      }

      // Check if running in secure context (HTTPS)
      if (
        (config.isCameraRequired || config.enableAudioProctoring) &&
        !window.isSecureContext
      ) {
        issues.push(
          "Secure connection (HTTPS) is required for camera/microphone access"
        );
      }

      return issues;
    },
    []
  );

  // Transform backend assessment to frontend format
  const transformAssessment = useCallback(
    (backendAssessment: BackendAssessment): AssessmentData => {
      const questions: Question[] = [];

      backendAssessment.topics.forEach((topic) => {
        topic.selectedQuestions.forEach((q) => {
          const timeLimit = parseDuration(q.duration);

          const baseQuestion: Question = {
            _id: q._id,
            questionType: q.questionType,
            questionText: q.title,
            totalMarks: q.totalMarks,
            timeLimit,
          };

          switch (q.questionType) {
            case "mcq":
            case "mcqmulti":
              questions.push({
                ...baseQuestion,
                options: (q.options || []).map((opt) => ({
                  text: opt.text,
                  _id: opt._id,
                })),
              });
              break;

            case "findAnswer":
              questions.push({
                ...baseQuestion,
                passage: q.passage,
                questions: (q.questions || []).map((subQ) => ({
                  questionText: subQ.questionText,
                  options: (subQ.options || []).map((opt) => ({
                    text: opt.text,
                    _id: opt._id,
                  })),
                  _id: subQ._id,
                })),
              });
              break;

            case "coding":
              questions.push({
                ...baseQuestion,
                codeQuestion: q.codeQuestion,
                testcase: q.testcase || [],
                code: q.code || {},
              });
              break;

            default:
              questions.push(baseQuestion);
          }
        });
      });

      // Calculate total assessment duration based on mode
      let assessmentDuration: number;
      if (backendAssessment.isTotalDuration) {
        assessmentDuration = backendAssessment.totalTime || 60;
      } else {
        assessmentDuration =
          questions.reduce((total, q) => total + (q.timeLimit || 60), 0) / 60;
      }

      // Shuffle questions if random shuffling is enabled
      if (backendAssessment.config.enableRandomShuffling) {
        for (let i = questions.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [questions[i], questions[j]] = [questions[j], questions[i]];
        }
      }

      return {
        _id: backendAssessment._id,
        name: backendAssessment.name,
        additionalDescription: backendAssessment.additionalDescription,
        totalTime: assessmentDuration,
        totalMarks: backendAssessment.totalMarks,
        totalAttempts: backendAssessment.totalAttempts,
        attemptCount: backendAssessment.attemptCount,
        questions,
        isTotalDuration: backendAssessment.isTotalDuration,
        level: backendAssessment.level,
        type: backendAssessment.type,
        status: backendAssessment.status,
        startDate: backendAssessment.startDate,
        endDate: backendAssessment.endDate,
        config: backendAssessment.config,
        totalQuestionsCount: questions.length,
      };
    },
    [parseDuration]
  );

  // Detect device type on component mount
  useEffect(() => {
    const type = detectDeviceType();
    setDeviceType(type);
    setIsDeviceRestricted(!isDeviceAllowed(DEFAULT_ALLOWED_DEVICES));
  }, []);

  // Load assessment data from backend
  const loadAssessmentData = useCallback(async () => {
    if (!assessmentId) {
      setError("Assessment ID is required");
      setLoading(false);
      return;
    }

    try {
      // Fetch assessment details
      const assessmentRes = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/assessments/${assessmentId}`,
        {
          headers: {
            Authorization: `Bearer ${getCookie("jwt")}`,
          },
        }
      );

      if (!assessmentRes.ok) {
        throw new Error("Failed to fetch assessment");
      }

      const assessmentData = await assessmentRes.json();

      if (!assessmentData.success || !assessmentData.assessment) {
        throw new Error("Invalid assessment data received");
      }

      const backendAssessment = assessmentData.assessment;

      // Check device restrictions
      const currentDeviceType = detectDeviceType();
      const allowedDevices =
        backendAssessment.config.allowedDevices || DEFAULT_ALLOWED_DEVICES;

      if (!allowedDevices.includes(currentDeviceType)) {
        const deviceTypeText =
          currentDeviceType === "mobile" ? "mobile phone" : currentDeviceType;
        setError(
          `This assessment requires a laptop or desktop computer. ${deviceTypeText} devices are not allowed for security reasons.`
        );
        setLoading(false);
        return;
      }

      // Check security requirements
      const securityIssues = await checkSecurityRequirements(
        backendAssessment.config
      );
      if (securityIssues.length > 0) {
        setError(`Security requirements not met: ${securityIssues.join(", ")}`);
        setLoading(false);
        return;
      }

      const transformedAssessment = transformAssessment(backendAssessment);
      setAssessment(transformedAssessment);

      // Check assessment timing
      const now = new Date();
      const startDate = new Date(backendAssessment.startDate);
      const endDate = new Date(backendAssessment.endDate);

      if (now < startDate) {
        setError("Assessment has not started yet");
        setLoading(false);
        return;
      }

      if (now > endDate) {
        setError("Assessment has ended");
        setLoading(false);
        return;
      }

      // Show security dialog if strict proctoring is enabled
      if (
        backendAssessment.config.isCameraRequired ||
        backendAssessment.config.restrictFullscreenMode ||
        backendAssessment.config.enableAudioProctoring ||
        backendAssessment.config.isDeveloperToolsBlocked
      ) {
        setShowSecurityDialog(true);
      } else {
        setSecurityChecked(true);
      }

      // Handle existing response or start new attempt
      if (responseId) {
        const responseRes = await fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student-attempts/${responseId}`,
          {
            headers: {
              Authorization: `Bearer ${getCookie("jwt")}`,
            },
          }
        );

        if (responseRes.ok) {
          const responseData = await responseRes.json();
          const response = responseData.response;

          if (response.status === "submitted") {
            setStudentResponse(response);
            setShowCompletedDialog(true);
            setLoading(false);
            return;
          }

          setStudentResponse(response);
        }
      } else {
        // Start a new attempt
        const startRes = await fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student-attempts/start`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${getCookie("jwt")}`,
            },
            body: JSON.stringify({ assessmentId }),
          }
        );

        if (!startRes.ok) {
          if (startRes.status === 403) {
            setError("You have exhausted all attempts for this assessment");
            setLoading(false);
            return;
          }
          throw new Error("Failed to start assessment");
        }

        const startData = await startRes.json();
        const response = startData.response;

        if (response.status === "submitted") {
          setStudentResponse(response);
          setShowCompletedDialog(true);
          setLoading(false);
          return;
        }

        setStudentResponse(response);

        // Update URL with responseId
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set("responseId", response._id);
        window.history.replaceState({}, "", newUrl.toString());
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to initialize test"
      );
      toast.error("Failed to load assessment");
    } finally {
      setLoading(false);
    }
  }, [
    assessmentId,
    responseId,
    transformAssessment,
    checkSecurityRequirements,
  ]);

  // Initialize assessment data on component mount
  useEffect(() => {
    loadAssessmentData();
  }, [loadAssessmentData]);

  const handleSubmitTest = async (
    answers: Record<string, any>,
    securityEvents?: Array<any>,
    internetStatus?: InternetStatus
  ) => {
    if (!studentResponse) {
      toast.error("No active assessment attempt found");
      return;
    }

    try {
      const formattedResponses = Object.entries(answers).map(
        ([questionId, answer]) => ({
          questionId,
          answer,
          submittedAt: new Date().toISOString(),
        })
      );

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student-attempts/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getCookie("jwt")}`,
          },
          body: JSON.stringify({
            responseId: studentResponse._id,
            responses: formattedResponses,
            securityEvents,
            internetStatus,
            submittedAt: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to submit assessment");
      }

      const data: SubmitResponse = await response.json();

      if (data.success) {
        const manualPolicy =
          data?.message?.includes("Results will be published later") ||
          data?.result?.totalMarksScored === undefined;

        toast.success(
          manualPolicy
            ? "Assessment submitted! Results will be published by your instructor."
            : data?.result?.totalMarksScored === undefined
            ? "Assessment submitted! Your results are being evaluated."
            : "Assessment submitted successfully!"
        );

        setStudentResponse((prev) =>
          prev
            ? {
                ...prev,
                status:
                  data.result?.status === "submitted" ||
                  data.result?.status === "in-progress"
                    ? data.result.status
                    : "submitted",
                submittedAt:
                  data.result?.submittedAt || new Date().toISOString(),
                responses: data.result?.responses ?? formattedResponses,
                securityEvents,
              }
            : null
        );

        router.push("/student/tests");
      } else {
        throw new Error(data.message || "Submission failed");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit assessment"
      );
      throw error;
    }
  };

  const handleSecurityAgreement = () => {
    if (!mediaPermissionsGranted && assessment?.config.isCameraRequired) {
      toast.error(
        "Camera and/or microphone permissions are required to proceed"
      );
      return;
    }

    setShowSecurityDialog(false);
    setSecurityChecked(true);
  };

  const handleStartNewAttempt = async () => {
    if (!assessment) return;

    try {
      setLoading(true);
      const startRes = await fetch(
        `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student-attempts/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getCookie("jwt")}`,
          },
          body: JSON.stringify({ assessmentId: assessment._id }),
        }
      );

      if (!startRes.ok) {
        throw new Error("Failed to start new assessment attempt");
      }

      const startData = await startRes.json();
      const response = startData.response;

      if (response.status === "submitted") {
        toast.error("Cannot start new attempt - assessment already completed");
        return;
      }

      setStudentResponse(response);
      setShowCompletedDialog(false);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("responseId", response._id);
      window.history.replaceState({}, "", newUrl.toString());

      toast.success("New attempt started successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to start new attempt"
      );
    } finally {
      setLoading(false);
    }
  };

  // Render device restriction message
  if (isDeviceRestricted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Device Not Supported
            </CardTitle>
            <CardDescription>
              This assessment requires a laptop or desktop computer for security
              reasons.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                {deviceType === "mobile" ? (
                  <Smartphone className="h-16 w-16 text-red-500" />
                ) : (
                  <Tablet className="h-16 w-16 text-red-500" />
                )}
                <div>
                  <p className="font-medium">
                    {deviceType === "mobile"
                      ? "Mobile phones"
                      : "Tablet devices"}{" "}
                    are not allowed
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    For security and proctoring purposes, this assessment can
                    only be taken on a laptop or desktop computer with a proper
                    keyboard, webcam, and larger screen.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center p-4 border rounded-lg bg-green-50 border-green-200">
              <Laptop className="h-12 w-12 text-green-600 mb-2" />
              <span className="text-lg font-medium text-green-800">
                Required Device
              </span>
              <span className="text-sm text-green-600 text-center">
                Laptop or Desktop Computer
                <br />
                with webcam and microphone
              </span>
            </div>

            <Button
              onClick={() => router.push("/student/tests")}
              className="w-full mt-4"
            >
              Back to Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Security agreement dialog
  if (showSecurityDialog && assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Dialog open={showSecurityDialog} onOpenChange={() => {}}>
          <DialogContent
            className="sm:max-w-md"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Security Requirements
              </DialogTitle>
              <DialogDescription>
                This assessment has strict security measures enabled. Please
                review and accept the following requirements:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 text-sm">
              {assessment.config.isCameraRequired && (
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md">
                  <Camera className="h-4 w-4 text-red-600" />
                  <span>Camera monitoring is required throughout the test</span>
                </div>
              )}

              {assessment.config.enableAudioProctoring && (
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md">
                  <Mic className="h-4 w-4 text-red-600" />
                  <span>Microphone monitoring is enabled</span>
                </div>
              )}

              {assessment.config.restrictFullscreenMode && (
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md">
                  <span>🖥️</span>
                  <span>Fullscreen mode is required</span>
                </div>
              )}

              {assessment.config.isDeveloperToolsBlocked && (
                <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md">
                  <span>🔒</span>
                  <span>Developer tools are blocked</span>
                </div>
              )}
            </div>

            {(assessment.config.isCameraRequired ||
              assessment.config.enableAudioProctoring) && (
              <div className="p-3 bg-blue-50 rounded-md border border-blue-200 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>Important:</strong> Please grant camera and microphone
                  permissions when prompted. You must allow these permissions to
                  continue.
                </p>
              </div>
            )}

            <div className="flex justify-center my-4">
              {mediaPermissionsGranted ||
              !assessment.config.isCameraRequired ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>
                    {assessment.config.isCameraRequired
                      ? "Camera and microphone access granted"
                      : "Ready to proceed"}
                  </span>
                </div>
              ) : (
                <Button
                  onClick={async () => {
                    try {
                      const constraints: MediaStreamConstraints = {
                        video: assessment.config.isCameraRequired,
                        audio: assessment.config.enableAudioProctoring,
                      };
                      const stream = await navigator.mediaDevices.getUserMedia(
                        constraints
                      );
                      setMediaStream(stream);
                      setMediaPermissionsGranted(true);
                      toast.success("Camera and microphone access granted");
                    } catch (err) {
                      toast.error("Failed to access camera or microphone");
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Grant Camera/Mic Access
                </Button>
              )}
            </div>

            <DialogFooter className="sm:justify-between">
              <Button
                variant="outline"
                onClick={() => router.push("/student/tests")}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSecurityAgreement}
                className="bg-red-600 hover:bg-red-700"
                disabled={
                  !mediaPermissionsGranted && assessment.config.isCameraRequired
                }
              >
                I Understand & Agree
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Show completed assessment dialog
  if (showCompletedDialog && studentResponse && assessment) {
    const percentage = Math.round(
      (studentResponse.totalMarksScored / assessment.totalMarks) * 100
    );
    const hasRemainingAttempts =
      assessment.attemptCount < assessment.totalAttempts;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle>Assessment Completed!</CardTitle>
            <CardDescription>
              You have already submitted this assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {studentResponse.totalMarksScored} / {assessment.totalMarks}
              </div>
              <p className="text-lg font-medium">{percentage}%</p>
              <p className="text-sm text-muted-foreground">
                Submitted on{" "}
                {new Date(studentResponse.submittedAt!).toLocaleString()}
              </p>
            </div>

            <div className="pt-4 space-y-2">
              <Button
                onClick={() => router.push("/student/tests")}
                className="w-full"
              >
                Back to Tests
              </Button>

              {hasRemainingAttempts && (
                <Button
                  variant="outline"
                  onClick={handleStartNewAttempt}
                  className="w-full"
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Start New Attempt
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assessment || !studentResponse || !securityChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load assessment. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative">
      <TestTakingPageComponent
        assessment={assessment}
        studentResponse={studentResponse}
        onSubmitTest={handleSubmitTest}
      />
    </div>
  );
}
