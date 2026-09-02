"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SecureExamConfig {
  isCameraRequired?: boolean;
  maxTabSwitches?: number;
  enableAudioProctoring?: boolean;
  disableCopyPasteInEditor?: boolean;
  takeSnapshotsDuringTest?: boolean;
  restrictFullscreenMode?: boolean;
  logoutOnLeave?: boolean;
  enableRandomShuffling?: boolean;
  maxAudioLimitExceedCount?: number;
}

export const useSecureExam = ({
  config,
  onForceExit,
  onFullscreenWarning,
  onDevToolsDetected,
  onTabSwitchWarning,
  onEscapePressed,
  onAudioViolation,
}: {
  config: SecureExamConfig;
  onForceExit: () => void;
  onFullscreenWarning: () => void;
  onDevToolsDetected: () => void;
  onTabSwitchWarning?: (count: number) => void;
  onEscapePressed?: () => void;
  onAudioViolation?: (level: number) => void;
}) => {
  const router = useRouter();
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [audioViolationCount, setAudioViolationCount] = useState(0);
  const audioContext = useRef<AudioContext | null>(null);
  const audioAnalyser = useRef<AnalyserNode | null>(null);
  const audioDataArray = useRef<Uint8Array | null>(null);
  const audioMonitoringInterval = useRef<NodeJS.Timeout | null>(null);

  // Developer Tools Detection - Enhanced version
  const checkDevTools = () => {
    // Multiple detection methods for better coverage
    const heightDiff = window.outerHeight - window.innerHeight;
    const widthDiff = window.outerWidth - window.innerWidth;

    // More conservative detection to reduce false positives
    const isDevToolsOpen =
      (heightDiff > 150 && widthDiff > 150) || // Both dimensions significantly different
      (window.outerWidth > 0 &&
        window.outerHeight > 0 &&
        window.outerWidth * window.outerHeight < 8000); // Very small window

    if (isDevToolsOpen && !devToolsOpen) {
      setDevToolsOpen(true);
      onDevToolsDetected();
      // Force exit on developer tools detection
      setTimeout(() => {
        onForceExit();
      }, 2000);
    } else if (!isDevToolsOpen && devToolsOpen) {
      setDevToolsOpen(false);
    }
  };

  // Camera and Microphone Access
  useEffect(() => {
    if (!config.isCameraRequired && !config.enableAudioProctoring) return;

    const requestMediaPermissions = async () => {
      try {
        const constraints: MediaStreamConstraints = {
          video: config.isCameraRequired,
          audio: config.enableAudioProctoring,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setMediaStream(stream);

        // Set up audio monitoring if enabled
        if (config.enableAudioProctoring) {
          setupAudioMonitoring(stream);
        }

        toast.success("Camera and microphone access granted.");
      } catch (err) {
        console.error("Media permission denied:", err);
        toast.error(
          "Camera and microphone access is required to start the test."
        );
        onForceExit();
      }
    };

    requestMediaPermissions();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }

      if (audioMonitoringInterval.current) {
        clearInterval(audioMonitoringInterval.current);
      }

      if (audioContext.current) {
        audioContext.current.close();
      }
    };
  }, [config.isCameraRequired, config.enableAudioProctoring, onForceExit]);

  // Audio monitoring setup
  const setupAudioMonitoring = (stream: MediaStream) => {
    try {
      // Create audio context and analyzer
      audioContext.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioAnalyser.current = audioContext.current.createAnalyser();

      // Connect the audio stream to the analyzer
      const source = audioContext.current.createMediaStreamSource(stream);
      source.connect(audioAnalyser.current);

      // Configure analyzer
      audioAnalyser.current.fftSize = 256;
      const bufferLength = audioAnalyser.current.frequencyBinCount;
      audioDataArray.current = new Uint8Array(bufferLength);

      // Start monitoring audio levels
      audioMonitoringInterval.current = setInterval(() => {
        if (audioAnalyser.current && audioDataArray.current) {
          audioAnalyser.current.getByteFrequencyData(audioDataArray.current);

          // Calculate average volume level
          const average =
            audioDataArray.current.reduce((sum, value) => sum + value, 0) /
            audioDataArray.current.length;

          // Check if volume exceeds threshold (adjust as needed)
          const threshold = 70; // Adjust based on testing
          if (average > threshold) {
            handleAudioViolation(average);
          }
        }
      }, 1000);
    } catch (error) {
      console.error("Error setting up audio monitoring:", error);
    }
  };

  // Handle audio violations
  const handleAudioViolation = (level: number) => {
    setAudioViolationCount((prev) => {
      const newCount = prev + 1;

      // Notify about the violation
      onAudioViolation?.(level);

      // Check if violations exceed limit
      if (
        config.maxAudioLimitExceedCount &&
        newCount >= config.maxAudioLimitExceedCount
      ) {
        toast.error(
          "Too many audio violations detected. Test will be terminated."
        );
        setTimeout(() => {
          onForceExit();
        }, 3000);
      } else {
        toast.warning(
          `High audio level detected. This may be flagged as suspicious.`
        );
      }

      return newCount;
    });
  };

  // Developer Tools Detection (enhanced with multiple methods)
  useEffect(() => {
    // Regular interval check
    const interval = setInterval(() => {
      checkDevTools();
    }, 2000); // Reduced frequency to avoid performance issues

    return () => clearInterval(interval);
  }, [onDevToolsDetected, onForceExit]);

  // Fullscreen Mode Enforcement
  useEffect(() => {
    if (!config.restrictFullscreenMode) return;

    const enterFullScreen = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {
          toast.warning("Please enable fullscreen to take the test.");
        });
      }
    };

    enterFullScreen();

    // Periodically check and enforce fullscreen
    const fullscreenInterval = setInterval(() => {
      if (config.restrictFullscreenMode && !document.fullscreenElement) {
        enterFullScreen();
      }
    }, 5000);

    return () => clearInterval(fullscreenInterval);
  }, [config.restrictFullscreenMode]);

  // Handle Fullscreen Exit
  useEffect(() => {
    if (!config.restrictFullscreenMode) return;

    const handleFullscreenChange = () => {
      const isStillFull = !!document.fullscreenElement;
      if (!isStillFull) {
        setFullscreenExitCount((prev) => {
          const newCount = prev + 1;
          if (newCount >= 6) {
            // Allow 6 exits before force exit
            toast.error("Exited fullscreen too many times. Ending test.");
            onForceExit();
          } else {
            toast.warning("You exited fullscreen. Please re-enter.");
            onFullscreenWarning();
          }
          return newCount;
        });
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [config.restrictFullscreenMode, onForceExit, onFullscreenWarning]);

  // Disable Right-Click (always enabled for security)
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);
    return () => document.removeEventListener("contextmenu", handleContextMenu);
  }, []);

  // Tab Switching Detection
  useEffect(() => {
    if (!config.maxTabSwitches || config.maxTabSwitches <= 0) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        setTabSwitchCount((prev) => {
          const newCount = prev + 1;
          onTabSwitchWarning?.(newCount);

          if (newCount >= config.maxTabSwitches!) {
            toast.error(
              `Switched tabs ${config.maxTabSwitches} times. Ending test.`
            );
            if (config.logoutOnLeave) {
              onForceExit();
            }
          } else {
            const remaining = config.maxTabSwitches! - newCount;
            toast.warning(
              `Tab switch detected. ${remaining} more allowed before test ends.`
            );
          }
          return newCount;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [
    config.maxTabSwitches,
    config.logoutOnLeave,
    onForceExit,
    onTabSwitchWarning,
  ]);

  // Keyboard Shortcuts Blocking and ESC Detection - FIXED
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC key detection - ONLY handle ESC for fullscreen mode when required AND currently in fullscreen
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();

        // Only trigger ESC dialog if:
        // 1. Fullscreen mode is required by config
        // 2. User is currently in fullscreen mode (to avoid false positives)
        if (
          config.restrictFullscreenMode &&
          document.fullscreenElement &&
          onEscapePressed
        ) {
          onEscapePressed();
        }
        return;
      }

      // Disable F12 and other developer tool shortcuts
      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          (e.key === "I" || e.key === "J" || e.key === "C")) ||
        (e.ctrlKey && e.key === "U") // View source
      ) {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("Developer tools access is blocked.");
        // Don't call onDevToolsDetected here as it's handled by the detection function
        return;
      }

      // Disable common shortcuts
      if (
        (e.ctrlKey || e.metaKey) &&
        ["w", "t", "r", "n", "s", "p", "a", "c", "v", "x"].includes(
          e.key.toLowerCase()
        )
      ) {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("Shortcut blocked during test.");
        return;
      }

      // Disable Alt+Tab
      if (e.altKey && e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("Application switching is blocked.");
        return;
      }

      // Disable Windows key / Command key
      if (e.key === "Meta" || e.key === "OS") {
        e.preventDefault();
        e.stopPropagation();
        toast.warning("System key is disabled during the test.");
        return;
      }
    };

    // Use capture phase to catch events before they bubble
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [config.restrictFullscreenMode, onEscapePressed]);

  // Copy/Paste Prevention
  useEffect(() => {
    if (!config.disableCopyPasteInEditor) return;

    const blockClipboard = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error("Copy/paste is disabled during the test.");
    };

    document.addEventListener("copy", blockClipboard, true);
    document.addEventListener("paste", blockClipboard, true);
    document.addEventListener("cut", blockClipboard, true);

    return () => {
      document.removeEventListener("copy", blockClipboard, true);
      document.removeEventListener("paste", blockClipboard, true);
      document.removeEventListener("cut", blockClipboard, true);
    };
  }, [config.disableCopyPasteInEditor]);

  // Screenshot Detection (enhanced implementation)
  useEffect(() => {
    if (!config.takeSnapshotsDuringTest) return;

    // Detect Print Screen key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        e.preventDefault();
        toast.warning("Screenshots are not allowed during the test.");
      }
    };

    // Detect clipboard image data
    const handleClipboardChange = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.types.includes("image/png")) {
        toast.error("Screenshot detected. This will be reported.");
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("paste", handleClipboardChange, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("paste", handleClipboardChange, true);
    };
  }, [config.takeSnapshotsDuringTest]);

  // Prevent browser zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        toast.warning("Zooming is disabled during the test.");
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false });

    return () => document.removeEventListener("wheel", handleWheel);
  }, []);

  return {
    tabSwitchCount,
    fullscreenExitCount,
    devToolsOpen,
    mediaStream,
    audioViolationCount,
  };
};
