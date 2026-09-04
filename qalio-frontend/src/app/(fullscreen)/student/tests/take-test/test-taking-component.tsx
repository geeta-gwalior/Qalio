"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  X,
  Camera,
  Maximize,
  LogOut,
  Wifi,
  WifiOff,
  UserCircle,
  RefreshCw,
  Shield,
  Monitor,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { QuestionDisplay } from "./question-display";
import Image from "next/image";
import { useAuthStore } from "@/stores/auth-store";
import { useSecureExam } from "@/hooks/use-secure-exam";
import { Timer } from "../../components/timer";
import { QuestionTimer } from "../../components/question-timer";
import { NavigationPanel } from "../../components/navigation-panel";
import { ProctoringWidget } from "@/components/assessments/ProctoringWidget";
import { getCookie } from "@/utils/getCookie";
import type { AssessmentData, StudentResponse } from "@/types/assessment";
import { useInternetConnectivity } from "@/hooks/internet-connectivity-hook";
import type { InternetStatus } from "./TakeTestClient";

interface TestTakingPageProps {
  assessment: AssessmentData;
  studentResponse: StudentResponse;
  onSubmitTest: (
    answers: Record<string, any>,
    securityEvents?: Array<any>,
    internetStatus?: InternetStatus
  ) => Promise<void>;
}

export default function TestTakingPageComponent({
  assessment,
  studentResponse,
  onSubmitTest,
}: TestTakingPageProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const user: any = useAuthStore((state) => state.user);
  const {
    isOnline,
    connectionQuality,
    isGoodConnection,
    isPoorConnection,
    isOffline,
  } = useInternetConnectivity();

  // State management
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [showNavPanel, setShowNavPanel] = useState(!isMobile);

  // Initialize timeRemaining based on assessment mode
  const [timeRemaining, setTimeRemaining] = useState(() => {
    if (assessment.isTotalDuration) {
      const startTime = new Date(studentResponse.startedAt).getTime();
      const currentTime = Date.now();
      const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
      const totalSeconds = assessment.totalTime * 60;
      return Math.max(0, totalSeconds - elapsedSeconds);
    }
    return 0;
  });

  // For question timer mode - use a key to force QuestionTimer remount
  const [questionTimerKey, setQuestionTimerKey] = useState(0);
  const [questionTimeLimit, setQuestionTimeLimit] = useState(() => {
    if (
      !assessment.isTotalDuration &&
      assessment.questions &&
      assessment.questions[0]
    ) {
      return assessment.questions[0].timeLimit || 0;
    }
    return 0;
  });

  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [isEscapeDialogOpen, setIsEscapeDialogOpen] = useState(false);
  const [autoSaveIndicator, setAutoSaveIndicator] = useState<
    null | "saving" | "saved"
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);
  const [audioLevel, setAudioLevel] = useState<number | null>(null);

  // Screenshot functionality state
  const [screenshotInterval, setScreenshotInterval] =
    useState<NodeJS.Timeout | null>(null);
  const [lastScreenshotTime, setLastScreenshotTime] = useState<Date | null>(
    null
  );
  const [screenshotCount, setScreenshotCount] = useState(0);
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);

  // Enhanced connection and fullscreen states
  const [showConnectionDialog, setShowConnectionDialog] = useState(false);
  const [showForceFullscreenModal, setShowForceFullscreenModal] =
    useState(false);
  const [isRetryingConnection, setIsRetryingConnection] = useState(false);
  const [connectionRetryCount, setConnectionRetryCount] = useState(0);
  const [lastConnectionCheck, setLastConnectionCheck] = useState<Date | null>(
    null
  );
  const [isExiting, setIsExiting] = useState(false);

  // Utility to check fullscreen
  const isInFullscreen = () => !!document.fullscreenElement;

  // Enhanced fullscreen request with error handling
  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setShowForceFullscreenModal(false);
      toast.success("Fullscreen mode activated");
    } catch (err) {
      console.error("Fullscreen error:", err);
      toast.error(
        "Failed to enter fullscreen mode. Please try manually pressing F11."
      );
    }
  };

  // Enhanced connection retry functionality
  const retryConnection = async () => {
    setIsRetryingConnection(true);
    setConnectionRetryCount((prev) => prev + 1);
    setLastConnectionCheck(new Date());

    try {
      // Attempt to make a test request to check connectivity
      const response = await fetch("/api/health-check", {
        method: "GET",
        cache: "no-cache",
      });

      if (response.ok) {
        toast.success("Connection restored!");
        setShowConnectionDialog(false);
        setConnectionRetryCount(0);
      } else {
        throw new Error("Health check failed");
      }
    } catch (error) {
      console.error("Connection retry failed:", error);
      toast.error(
        `Connection attempt ${
          connectionRetryCount + 1
        } failed. Please check your internet.`
      );
    } finally {
      setIsRetryingConnection(false);
    }
  };

  const securityWarningsRef = useRef<string[]>([]);
  useEffect(() => {
    securityWarningsRef.current = securityWarnings;
  }, [securityWarnings]);

  // Refs for timer management
  const overallTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isNavigatingRef = useRef(false);
  const currentIndexRef = useRef(0);

  // Safety check for questions array
  const questions = assessment?.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progressPercentage =
    totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  // Enhanced fullscreen monitoring
  useEffect(() => {
    // Check at load time
    if (!isInFullscreen()) {
      setShowForceFullscreenModal(true);
    }

    // Listen for fullscreen change
    const handleFullscreenChange = () => {
      if (!isInFullscreen()) {
        setShowForceFullscreenModal(true);
        toast.warning(
          "Please return to fullscreen mode for security compliance."
        );
      } else {
        setShowForceFullscreenModal(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Keep currentIndexRef in sync with currentQuestionIndex
  useEffect(() => {
    currentIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // Enhanced internet connectivity monitoring
  useEffect(() => {
    if (isOffline) {
      setShowConnectionDialog(true);
      toast.error("Internet connection lost. Please reconnect to continue.");
    } else if (isPoorConnection) {
      toast.warning("Poor internet connection detected. Test may be affected.");
    } else if (isGoodConnection && showConnectionDialog) {
      // Auto-close dialog if connection is restored
      setShowConnectionDialog(false);
      toast.success("Internet connection restored!");
      setConnectionRetryCount(0);
    }
  }, [isOffline, isPoorConnection, isGoodConnection, showConnectionDialog]);

  // Screenshot functionality (keeping existing implementation)
  const captureScreenshot = useCallback(async (): Promise<Blob | null> => {
    if (!videoRef.current || !canvasRef.current) {
      console.warn("Video or canvas ref not available for screenshot");
      return null;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        console.warn("Canvas context not available");
        return null;
      }

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.8);
      });
    } catch (error) {
      console.error("Error capturing screenshot:", error);
      return null;
    }
  }, []);

  const uploadScreenshot = useCallback(
    async (imageBlob: Blob, metadata: any) => {
      try {
        const formData = new FormData();
        formData.append(
          "screenshot",
          imageBlob,
          `screenshot_${Date.now()}.jpg`
        );
        formData.append("studentId", user?._id || "");
        formData.append("assessmentId", assessment._id);
        formData.append("studentResponseId", studentResponse._id);
        formData.append("metadata", JSON.stringify(metadata));

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_QALIO_BACKEND_URL}/student-attempts/${studentResponse._id}/screenshot`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${getCookie("jwt")}`,
            },
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to upload screenshot");
        }

        const result = await response.json();
        return result;
      } catch (error) {
        console.error("Error uploading screenshot:", error);
        toast.error("Failed to upload screenshot");
        return null;
      }
    },
    [user?._id, assessment._id, studentResponse._id]
  );

  const takeScreenshot = useCallback(
    async (reason = "periodic") => {
      if (!assessment.config.takeSnapshotsDuringTest || isCapturingScreenshot) {
        return;
      }

      // Avoid taking screenshot if last one was taken < 30 seconds ago
      const now = new Date();
      if (
        lastScreenshotTime &&
        now.getTime() - lastScreenshotTime.getTime() < 30 * 1000
      ) {
        console.log("📷 Skipping screenshot - taken too recently");
        return;
      }

      setIsCapturingScreenshot(true);

      try {
        const imageBlob = await captureScreenshot();
        if (imageBlob) {
          const metadata = {
            reason,
            questionIndex: currentQuestionIndex,
            questionId: currentQuestion?._id,
            timeRemaining: assessment.isTotalDuration
              ? timeRemaining
              : questionTimeLimit,
            assessmentMode: assessment.isTotalDuration
              ? "total_duration"
              : "question_timer",
            userAgent: navigator.userAgent,
            timestamp: now.toISOString(),
            screenshotSize: imageBlob.size,
            connectionQuality,
          };

          const result = await uploadScreenshot(imageBlob, metadata);
          if (result?.success) {
            setLastScreenshotTime(now);
            setScreenshotCount((prev) => prev + 1);
          }
        }
      } catch (error) {
        console.error("Error taking screenshot:", error);
      } finally {
        setIsCapturingScreenshot(false);
      }
    },
    [
      assessment.config.takeSnapshotsDuringTest,
      isCapturingScreenshot,
      lastScreenshotTime,
      captureScreenshot,
      uploadScreenshot,
      currentQuestionIndex,
      currentQuestion?._id,
      timeRemaining,
      questionTimeLimit,
      connectionQuality,
    ]
  );

  // Security callbacks (keeping existing implementation)
  const handleForceExit = useCallback(() => {
    toast.error("Security violation detected. Exiting test.");
    const updated = [
      ...securityWarningsRef.current,
      "Security violation detected. Exiting test.",
    ];
    securityWarningsRef.current = updated;
    submitTest();
  }, []);

  const handleFullscreenWarning = useCallback(() => {
    toast.warning("Please return to fullscreen mode.");
    const updated = [
      ...securityWarningsRef.current,
      "Fullscreen exit detected",
    ];
    securityWarningsRef.current = updated;
  }, []);

  const handleDevToolsDetected = useCallback(() => {
    toast.error("Developer tools detected. Test will be terminated.");
    const updated = [
      ...securityWarningsRef.current,
      "Developer tools detected",
    ];
    securityWarningsRef.current = updated;
    setSecurityWarnings((prev) => [...prev, "Developer tools detected"]);
    setTimeout(() => {
      submitTest();
    }, 2000);
  }, []);

  const handleTabSwitchWarning = useCallback(
    (count: number) => {
      const updated = [
        ...securityWarningsRef.current,
        `Tab switch #${count} detected`,
      ];
      securityWarningsRef.current = updated;
      setSecurityWarnings((prev) => [...prev, `Tab switch #${count} detected`]);
      if (assessment.config.takeSnapshotsDuringTest) {
        takeScreenshot("tab_switch");
      }
    },
    [assessment.config.takeSnapshotsDuringTest, takeScreenshot]
  );

  const handleEscapePressed = useCallback(() => {
    if (
      assessment.config.restrictFullscreenMode &&
      document.fullscreenElement
    ) {
      setIsEscapeDialogOpen(true);
      setSecurityWarnings((prev) => [...prev, "ESC key pressed"]);
      if (assessment.config.takeSnapshotsDuringTest) {
        takeScreenshot("esc_key_pressed");
      }
    }
  }, [
    assessment.config.restrictFullscreenMode,
    assessment.config.takeSnapshotsDuringTest,
    takeScreenshot,
  ]);

  const handleAudioViolation = useCallback(
    (level: number) => {
      setAudioLevel(level);
      const updated = [
        ...securityWarningsRef.current,
        `High audio level detected: ${level.toFixed(0)}`,
      ];
      securityWarningsRef.current = updated;
      setSecurityWarnings((prev) => [
        ...prev,
        `High audio level detected: ${level.toFixed(0)}`,
      ]);
      if (assessment.config.takeSnapshotsDuringTest) {
        takeScreenshot("audio_violation");
      }
    },
    [assessment.config.takeSnapshotsDuringTest, takeScreenshot]
  );

  // Initialize secure exam features
  const { tabSwitchCount, mediaStream, audioViolationCount } = useSecureExam({
    config: assessment.config,
    onForceExit: handleForceExit,
    onFullscreenWarning: handleFullscreenWarning,
    onDevToolsDetected: handleDevToolsDetected,
    onTabSwitchWarning: handleTabSwitchWarning,
    onEscapePressed: handleEscapePressed,
    onAudioViolation: handleAudioViolation,
  });

  const [trustScore, setTrustScore] = useState(100);
  useEffect(() => {
    const switchPenalties = tabSwitchCount * 10;
    const audioPenalties = audioViolationCount * 5;
    setTrustScore(Math.max(0, 100 - switchPenalties - audioPenalties));
  }, [tabSwitchCount, audioViolationCount]);

  // Clear all timers function
  const clearAllTimers = useCallback(() => {
    console.log("🧹 Clearing all timers");
    if (overallTimerRef.current) {
      clearInterval(overallTimerRef.current);
      overallTimerRef.current = null;
    }
    if (screenshotInterval) {
      clearInterval(screenshotInterval);
      setScreenshotInterval(null);
    }
  }, [screenshotInterval]);

  // Camera preview setup
  useEffect(() => {
    if (mediaStream && videoRef.current) {
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  // Prevent back navigation
  useEffect(() => {
    history.pushState(null, "", window.location.href);
    const handlePopState = (event: PopStateEvent) => {
      setIsExitDialogOpen(true);
      history.pushState(null, "", window.location.href);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Load existing responses
  useEffect(() => {
    if (studentResponse.responses && studentResponse.responses.length > 0) {
      const existingAnswers: Record<string, any> = {};
      studentResponse.responses.forEach((response) => {
        existingAnswers[response.questionId] = response.answer;
      });
      setAnswers(existingAnswers);
    }
  }, [studentResponse]);

  // Function to move to the next question
  const moveToNextQuestion = useCallback(() => {
    if (isNavigatingRef.current) {
      console.log("⚠️ Navigation already in progress, ignoring");
      return;
    }
    isNavigatingRef.current = true;
    console.log(
      "➡️ Moving to next question from index",
      currentIndexRef.current
    );

    // Check if we're at the last question
    if (currentIndexRef.current >= totalQuestions - 1) {
      console.log("🏁 Last question reached, showing submit dialog");
      setIsSubmitDialogOpen(true);
      isNavigatingRef.current = false;
      return;
    }

    // Move to next question
    const nextIndex = currentIndexRef.current + 1;
    console.log("📍 Setting current index to", nextIndex);
    setCurrentQuestionIndex(nextIndex);

    // Reset navigation flag after a short delay
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
  }, [totalQuestions]);

  // Enhanced test submission with better error handling
  const submitTest = async () => {
    setIsSubmitting(true);
    setIsExiting(true);
    clearAllTimers();

    if (assessment.config.takeSnapshotsDuringTest) {
      await takeScreenshot("test_submission");
    }

    try {
      await onSubmitTest(answers, securityWarningsRef.current, {
        isOnline,
        connectionQuality,
        isGoodConnection,
        isPoorConnection,
        isOffline,
      });

      toast.success("Test submitted successfully!");
    } catch (error) {
      console.error("Test submission error:", error);
      toast.error("Failed to submit test. Please try again.");
      setIsSubmitting(false);
      setIsExiting(false);
      return;
    } finally {
      setIsSubmitDialogOpen(false);
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  };

  // Handle timer expiration - FIXED VERSION with auto-submit
  const handleTimerExpiration = useCallback(() => {
    console.log("⏰ Timer expired for question", currentIndexRef.current + 1);

    // Prevent multiple calls
    if (isNavigatingRef.current) {
      console.log("Already navigating, ignoring timer expiration");
      return;
    }

    if (assessment.config.takeSnapshotsDuringTest) {
      takeScreenshot("timer_expired");
    }

    toast.warning(`Time's up for question ${currentIndexRef.current + 1}!`, {
      duration: 3000,
    });

    // Check if this is the last question
    if (currentIndexRef.current >= totalQuestions - 1) {
      console.log("🏁 Last question timer expired, auto-submitting test");
      const updatedWarnings = [
        ...securityWarningsRef.current,
        "Timer expired on final question. Auto-submitting.",
      ];
      securityWarningsRef.current = updatedWarnings;
      setSecurityWarnings(updatedWarnings);
      toast.success("Test completed! Submitting automatically...", {
        duration: 2000,
      });
      setTimeout(() => {
        submitTest();
      }, 1000);
    } else {
      console.log("➡️ Moving to next question after timer expiration");
      moveToNextQuestion();
    }
  }, [
    totalQuestions,
    moveToNextQuestion,
    assessment.config.takeSnapshotsDuringTest,
    takeScreenshot,
  ]);

  // Update question time limit when question changes - FIXED VERSION with key reset
  useEffect(() => {
    if (!assessment.isTotalDuration && questions[currentQuestionIndex]) {
      const timeLimit = questions[currentQuestionIndex]?.timeLimit || 0;
      console.log(
        "📝 Parent: Setting question time limit to",
        timeLimit,
        "for question",
        currentQuestionIndex + 1
      );
      setQuestionTimeLimit(timeLimit);
      setQuestionTimerKey((prev) => prev + 1);
    }
  }, [assessment.isTotalDuration, currentQuestionIndex, questions]);

  // Initialize overall timer (for total duration mode)
  useEffect(() => {
    if (assessment.isTotalDuration && timeRemaining > 0) {
      console.log("⏰ Starting overall timer with", timeRemaining, "seconds");
      overallTimerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearAllTimers();
            setIsSubmitDialogOpen(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (overallTimerRef.current) {
          clearInterval(overallTimerRef.current);
          overallTimerRef.current = null;
        }
      };
    }
  }, [assessment.isTotalDuration, timeRemaining, clearAllTimers]);

  // Screenshot setup and intervals
  useEffect(() => {
    if (!assessment.config.takeSnapshotsDuringTest) return;

    const initialTimeout = setTimeout(() => {
      takeScreenshot("test_start");
    }, 200);

    const interval = setInterval(() => {
      takeScreenshot("periodic");
    }, 2 * 60 * 1000);

    setScreenshotInterval(interval);

    return () => {
      clearTimeout(initialTimeout);
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [assessment.config.takeSnapshotsDuringTest, takeScreenshot]);

  // Take screenshot on question change (only in question timer mode)
  useEffect(() => {
    if (
      !assessment.isTotalDuration &&
      assessment.config.takeSnapshotsDuringTest &&
      currentQuestionIndex > 0
    ) {
      const timeout = setTimeout(() => {
        takeScreenshot("question_change");
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [
    currentQuestionIndex,
    assessment.isTotalDuration,
    assessment.config.takeSnapshotsDuringTest,
    takeScreenshot,
  ]);

  // Handle manual question navigation
  const goToQuestion = (index: number) => {
    if (!assessment.isTotalDuration) {
      toast.warning(
        "Direct navigation is not allowed in this assessment mode."
      );
      return;
    }
    if (index >= 0 && index < totalQuestions) {
      setCurrentQuestionIndex(index);
    }
  };

  const goToNextQuestion = useCallback(() => {
    console.log("🖱️ Manual next button clicked");
    if (currentQuestionIndex < totalQuestions - 1) {
      moveToNextQuestion();
    } else {
      setIsSubmitDialogOpen(true);
    }
  }, [currentQuestionIndex, totalQuestions, moveToNextQuestion]);

  const goToPreviousQuestion = () => {
    if (!assessment.isTotalDuration) {
      toast.warning(
        "Going back to previous questions is not allowed in this assessment mode."
      );
      return;
    }
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Handle answer updates
  const updateAnswer = useCallback(
    (answer: any) => {
      if (!currentQuestion) return;

      setAnswers((prev) => {
        const newAnswers = { ...prev, [currentQuestion._id]: answer };
        setAutoSaveIndicator("saving");
        setTimeout(() => {
          setAutoSaveIndicator("saved");
          setTimeout(() => {
            setAutoSaveIndicator(null);
          }, 2000);
        }, 1000);
        return newAnswers;
      });
    },
    [currentQuestion]
  );

  // Handle flagging questions
  const toggleFlagQuestion = () => {
    setFlaggedQuestions((prev) => {
      const newFlagged = new Set(prev);
      if (newFlagged.has(currentQuestionIndex)) {
        newFlagged.delete(currentQuestionIndex);
      } else {
        newFlagged.add(currentQuestionIndex);
      }
      return newFlagged;
    });
  };

  // Handle ESC dialog actions
  const handleContinueFullscreen = async () => {
    setIsEscapeDialogOpen(false);
    try {
      await document.documentElement.requestFullscreen();
      toast.success("Returned to fullscreen mode");
    } catch (error) {
      toast.error("Failed to enter fullscreen mode");
    }
  };

  const handleExitTest = () => {
    setIsEscapeDialogOpen(false);
    setIsExitDialogOpen(true);
  };

  // Handle window beforeunload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message =
        "You have unsaved changes. Are you sure you want to leave?";
      e.returnValue = message;
      return message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [answers]);

  // Responsive layout effect
  useEffect(() => {
    setShowNavPanel(!isMobile);
  }, [isMobile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  // Early return if no questions available
  if (!currentQuestion || totalQuestions === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <div className="text-sm text-muted-foreground">
            No questions available for this assessment.
            <br />
            <br />
            Debug Info:
            <br />
            Total Questions: {totalQuestions}
            <br />
            Current Index: {currentQuestionIndex}
            <br />
            Assessment ID: {assessment?._id}
            <br />
            Is Total Duration: {assessment.isTotalDuration ? "Yes" : "No"}
          </div>
        </Alert>
      </div>
    );
  }

  const avatarSrc =
    typeof user?.avatar === "string" && user.avatar.trim() !== ""
      ? user.avatar
      : null;

  return (
    <div
      className={cn(
        "flex flex-col h-screen w-full bg-background overflow-hidden"
      )}
    >
      {/* Hidden canvas for screenshot capture */}
      <canvas
        ref={canvasRef}
        style={{ display: "none" }}
        width={640}
        height={480}
      />

      {/* Header with test info and controls */}
      <header className="flex items-center justify-between p-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-3">
          <Image
            src="/images/skill_access_logo.png"
            alt="Qalio Logo"
            width={140}
            height={18.34}
          />
          <div>
            <h1 className="font-bold text-lg">{assessment.name}</h1>
            <p className="text-sm text-muted-foreground">Assessment Platform</p>
          </div>

          {/* Enhanced Connection status in header */}
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg shadow-sm text-sm border transition-all duration-200",
              isGoodConnection && "bg-green-50 text-green-700 border-green-200",
              isPoorConnection &&
                "bg-yellow-50 text-yellow-700 border-yellow-200",
              isOffline && "bg-red-50 text-red-700 border-red-200"
            )}
          >
            {isOnline ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            <span>
              {isGoodConnection && "Good Connection"}
              {isPoorConnection && "Poor Connection"}
              {isOffline && "No Connection"}
            </span>
            {lastConnectionCheck && (
              <span className="text-xs opacity-75">
                ({lastConnectionCheck.toLocaleTimeString()})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {autoSaveIndicator && (
            <span
              className={cn(
                "text-xs px-2 py-1 rounded-md",
                autoSaveIndicator === "saving"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-green-100 text-green-800"
              )}
            >
              {autoSaveIndicator === "saving" ? "Saving..." : "Saved"}
            </span>
          )}

          {/* Security indicators */}
          {assessment.config.isCameraRequired && (
            <div className="flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-md">
              <Camera className="h-3 w-3" />
              <span>Monitored</span>
            </div>
          )}

          {/* Timer mode indicator */}
          <span className="text-xs px-2 py-1 rounded-md bg-blue-100 text-blue-800">
            {assessment.isTotalDuration
              ? "Total Duration Mode"
              : "Question Timer Mode"}
          </span>

          {/* Conditional timer display */}
          {assessment.isTotalDuration ? (
            <Timer timeRemaining={timeRemaining} warningThreshold={300} />
          ) : (
            currentQuestion?.timeLimit && (
              <QuestionTimer
                key={questionTimerKey}
                timeRemaining={questionTimeLimit}
                warningThreshold={Math.min(
                  10,
                  Math.floor((currentQuestion.timeLimit || 60) / 5)
                )}
                onTimeEnd={handleTimerExpiration}
              />
            )
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsExitDialogOpen(true)}
            className="rounded-md"
            disabled={isExiting}
          >
            {isExiting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-white">
              {avatarSrc ? (
                <Image
                  src={avatarSrc || "/placeholder.svg"}
                  height={40}
                  width={40}
                  alt="User Avatar"
                  className="object-cover w-10 h-10 rounded-full"
                />
              ) : (
                <UserCircle className="text-gray-400 w-full h-full" />
              )}
            </div>
            <span className="text-sm font-medium">
              {user?.name || "Student"}
            </span>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 w-full bg-gray-100">
        <div
          className="h-full bg-[#219CAE] transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Security warnings banner */}
      {securityWarnings.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 p-2">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <span>
              Security Events: {securityWarnings.slice(-3).join(", ")}
            </span>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation panel - collapsible on mobile */}
        {showNavPanel && (
          <div className="w-64 border-r bg-white flex flex-col overflow-y-auto">
            {/* Proctoring Widget */}
            <div className="p-4 border-b">
               <ProctoringWidget
                 trustScore={trustScore}
                 tabSwitches={tabSwitchCount}
                 warnings={securityWarnings}
               />
            </div>

            {/* Camera preview in sidebar */}
            {assessment.config.isCameraRequired && mediaStream && (
              <div className="p-4 border-b">
                <div className="w-full h-32 rounded-lg overflow-hidden border-2 border-gray-200 shadow-sm relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-red-500 w-2 h-2 rounded-full animate-pulse"></div>
                  {assessment.config.takeSnapshotsDuringTest && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1">
                      <Camera
                        className={cn(
                          "h-3 w-3 text-white",
                          isCapturingScreenshot && "animate-pulse"
                        )}
                      />
                      <span className="text-xs text-white bg-black bg-opacity-50 px-1 rounded">
                        📸 {screenshotCount}
                      </span>
                    </div>
                  )}
                </div>
                {lastScreenshotTime &&
                  assessment.config.takeSnapshotsDuringTest && (
                    <div className="mt-2 text-xs text-gray-600 text-center">
                      Last: {lastScreenshotTime.toLocaleTimeString()}
                    </div>
                  )}
              </div>
            )}

            <div className="p-4 flex-1">
              <NavigationPanel
                questions={questions.map((q) => ({
                  ...q,
                  options: q.options?.map((opt, idx) => ({
                    ...opt,
                    _id: (opt as any)._id ?? `${q._id}_opt_${idx}`,
                  })),
                }))}
                currentIndex={currentQuestionIndex}
                answers={answers}
                flaggedQuestions={flaggedQuestions}
                onSelectQuestion={goToQuestion}
                isNavigationRestricted={!assessment.isTotalDuration}
              />
            </div>
          </div>
        )}

        {/* Question display area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            <div className="">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNavPanel(!showNavPanel)}
                    className="md:hidden rounded-md"
                  >
                    {showNavPanel ? (
                      <ChevronLeft className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  <span className="text-sm font-medium">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                  {!assessment.isTotalDuration && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Can advance early • No going back
                    </span>
                  )}
                </div>

                {assessment.isTotalDuration && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFlagQuestion}
                    className={cn(
                      "rounded-md",
                      flaggedQuestions.has(currentQuestionIndex) &&
                        "bg-amber-50 text-amber-600 border-amber-200"
                    )}
                  >
                    <Flag className="h-4 w-4 mr-1" />
                    {flaggedQuestions.has(currentQuestionIndex)
                      ? "Flagged"
                      : "Flag"}
                  </Button>
                )}
              </div>

              <Card className="p-4 md:p-6 shadow-sm">
                <QuestionDisplay
                  assessment={assessment}
                  question={currentQuestion}
                  answer={answers[currentQuestion._id]}
                  onAnswerChange={updateAnswer}
                  responseId={studentResponse._id}
                />
              </Card>
            </div>
          </div>

          {/* Navigation and action buttons */}
          <div className="p-4 border-t bg-white flex items-center justify-between">
            <Button
              variant="outline"
              onClick={goToPreviousQuestion}
              disabled={
                currentQuestionIndex === 0 || !assessment.isTotalDuration
              }
              className="rounded-md bg-transparent"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsSubmitDialogOpen(true)}
                className="rounded-md"
                disabled={isSubmitting}
              >
                Submit Test
              </Button>
              <Button
                onClick={goToNextQuestion}
                disabled={currentQuestionIndex === totalQuestions - 1}
                className="rounded-md bg-[#219CAE] hover:bg-[#1a7a89]"
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Connection Quality Dialog */}
      <Dialog open={showConnectionDialog} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-red-600" />
              Internet Connection Required
            </DialogTitle>
            <DialogDescription>
              A stable internet connection is required to continue the
              assessment. Your progress has been saved automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <p className="text-sm font-medium text-red-800">
                  Connection Status
                </p>
              </div>
              <p className="text-sm text-red-700">
                <strong>Status:</strong>{" "}
                {connectionQuality.status === "offline"
                  ? "Offline"
                  : connectionQuality.status === "poor"
                  ? "Poor Quality"
                  : "Good"}
              </p>
              {connectionRetryCount > 0 && (
                <p className="text-sm text-red-700 mt-1">
                  <strong>Retry attempts:</strong> {connectionRetryCount}
                </p>
              )}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-800">
                  Troubleshooting Steps
                </p>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Check your internet connection</li>
                <li>• Move closer to your WiFi router</li>
                <li>• Close other applications using internet</li>
                <li>• Try switching to mobile data if available</li>
                <li>• Contact support if issues persist</li>
              </ul>
            </div>

            {lastConnectionCheck && (
              <div className="text-xs text-gray-600 text-center">
                Last checked: {lastConnectionCheck.toLocaleTimeString()}
              </div>
            )}
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={retryConnection}
              disabled={isRetryingConnection}
              className="rounded-md bg-transparent"
            >
              {isRetryingConnection ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Connection
                </>
              )}
            </Button>
            <Button
              onClick={() => setShowConnectionDialog(false)}
              className="rounded-md"
              disabled={!isOnline}
            >
              {isOnline ? "Continue Test" : "Waiting for Connection..."}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Fullscreen Modal */}
      {showForceFullscreenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl text-center max-w-md w-full p-8 border">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Monitor className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Fullscreen Required
              </h2>
              <p className="text-gray-600 leading-relaxed">
                This assessment must be taken in fullscreen mode for security
                and monitoring purposes. This helps ensure test integrity.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-amber-600" />
                <p className="text-sm font-medium text-amber-800">
                  Security Notice
                </p>
              </div>
              <p className="text-sm text-amber-700">
                Exiting fullscreen mode during the test may be recorded as a
                security event.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={requestFullscreen}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-medium"
              >
                <Maximize className="h-5 w-5 mr-2" />
                Enter Fullscreen Mode
              </Button>

              <p className="text-xs text-gray-500">
                You can also press{" "}
                <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">F11</kbd>{" "}
                to enter fullscreen
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ESC Key Dialog */}
      <Dialog open={isEscapeDialogOpen} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Fullscreen Mode Required
            </DialogTitle>
            <DialogDescription>
              You pressed the ESC key. This assessment requires fullscreen mode
              for security purposes. What would you like to do?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Recommended:</strong> Continue the test in fullscreen
                mode to maintain security compliance.
              </p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> Exiting the test will save your
                progress but may count as a security violation.
              </p>
            </div>
          </div>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={handleExitTest}
              className="rounded-md bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Exit Test
            </Button>
            <Button
              onClick={handleContinueFullscreen}
              className="rounded-md bg-blue-600 hover:bg-blue-700"
            >
              <Maximize className="h-4 w-4 mr-2" />
              Continue in Fullscreen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Submit confirmation dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Submit Test
            </DialogTitle>
            <DialogDescription>
              You are about to submit your test. You have answered{" "}
              {answeredCount} out of {totalQuestions} questions.
              {answeredCount < totalQuestions && (
                <div className="mt-2 p-2 bg-amber-50 text-amber-800 rounded-md flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    You have {totalQuestions - answeredCount} unanswered
                    questions.
                  </span>
                </div>
              )}
              {securityWarnings.length > 0 && (
                <div className="mt-2 p-2 bg-red-50 text-red-800 rounded-md">
                  <p className="text-sm">
                    Security events recorded: {securityWarnings.length}
                  </p>
                </div>
              )}
              {assessment.config.takeSnapshotsDuringTest &&
                screenshotCount > 0 && (
                  <div className="mt-2 p-2 bg-blue-50 text-blue-800 rounded-md">
                    <p className="text-sm">
                      Screenshots captured: {screenshotCount}
                    </p>
                  </div>
                )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setIsSubmitDialogOpen(false)}
              className="rounded-md"
              disabled={isSubmitting}
            >
              Continue Test
            </Button>
            <Button
              onClick={submitTest}
              className="rounded-md bg-[#219CAE] hover:bg-[#1a7a89]"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              )}
              Submit Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enhanced Exit confirmation dialog */}
      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-red-600" />
              Exit Test
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to exit? Your progress will be saved, but
              the test timer will continue running.
              {securityWarnings.length > 0 && (
                <div className="mt-2 p-2 bg-amber-50 text-amber-800 rounded-md">
                  <p className="text-sm">
                    Note: Security events have been recorded during this
                    session.
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setIsExitDialogOpen(false)}
              className="rounded-md"
              disabled={isExiting}
            >
              Continue Test
            </Button>
            <Button
              onClick={submitTest}
              variant="destructive"
              className="rounded-md"
              disabled={isExiting}
            >
              {isExiting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exiting...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Exit Test
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile navigation tabs */}
      {isMobile && !showNavPanel && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-2 md:hidden">
          <Tabs defaultValue="questions" className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger
                value="questions"
                onClick={() => setShowNavPanel(true)}
              >
                Questions
              </TabsTrigger>
              <TabsTrigger value="current">Current</TabsTrigger>
              <TabsTrigger
                value="submit"
                onClick={() => setIsSubmitDialogOpen(true)}
              >
                Submit
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}
    </div>
  );
}
