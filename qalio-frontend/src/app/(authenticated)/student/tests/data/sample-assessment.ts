import type { AssessmentDetails } from "@/types/assessment";

export const sampleAssessment: AssessmentDetails = {
  id: "test-001",
  title: "Beginner Level Test",
  mascot: "",
  timePeriod: {
    duration: "09 minutes",
  },
  timeline: {
    startDate: "30th January",
    endDate: "08th February",
  },
  studentStats: {
    appeared: 4,
    attempts: 10,
  },
  description:
    "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
  guidelines: {
    proctoring: [
      "Full-screen mode is mandatory, exiting will log you out.",
      "All popups, tab switches, or window changes will terminate your session.",
      "Camera access may be required for identity verification and monitoring.",
    ],
    plagiarism: [
      "Copy-paste is disabled in the problem statement and code editor.",
      "Sharing answers or using external online tools is strictly prohibited.",
      "Violations can lead to permanent account suspension or blacklisting.",
    ],
    environment: [
      "Use a stable internet connection (at least 40 Mbps recommended).",
      "Avoid mobile tethering or unreliable networks.",
      "Close all other programs and notifications before starting.",
      "Prefer a private/incognito window to avoid browser extension interference.",
      "You are not allowed to modify driver code, doing so will lead to permanent rejection.",
    ],
    duringTest: [
      "Any unauthorized activity (e.g., tab switching, exiting full-screen) may lead to immediate submission.",
      "Major rule violations, such as external help or cheating, can result in instant disqualification.",
    ],
    finalReminders: [
      "Contact support immediately if you face technical issues.",
      "Refresh or closing the window without instruction may lock you out.",
      "By starting the test, you agree to abide by all these rules and maintain academic integrity.",
    ],
  },
  overview: {
    questionCount: 2,
    questionTypes: ["Compiler"],
    timeAllocation: ["Total Test Duration: 30 mins"],
    additionalInstructions: [
      "Total Test Duration: 30 mins",
      "Total Test Duration: 30 mins",
    ],
  },
};
