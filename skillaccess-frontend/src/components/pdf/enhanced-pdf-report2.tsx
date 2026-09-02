"use client";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Users,
  Trophy,
  ArrowLeft,
  Clock,
  BookOpen,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { useAuthStore } from "@/stores/auth-store";

interface AssessmentConfig {
  resultPolicy: "auto" | "manual";
}

const COLORS = [
  "#8884d8", // Purple
  "#82ca9d", // Green
  "#ffc658", // Yellow
  "#ff8042", // Orange
  "#0088FE", // Blue
  "#00C49F", // Teal
  "#FFBB28", // Amber
  "#FF4444", // Red
];

const barColors = ["#219CAE", "#94B9FF", "#FFBB28", "#FFC8DD", "#FDD365"];

interface Assessment {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  appearedStudents: any[];
  invitedStudents: any[];
  level: string;
  totalMarks: number;
  description?: string;
  duration?: number;
  resultList?: any;
  config: AssessmentConfig;
  resultPolicy?: "auto" | "manual";
  totalTime?: number;
  totalQuestionsCount?: number;
  topics?: any[];
  cutOff?: number | undefined;
}

interface Candidate {
  studentId: string;
  name: string;
  email: string;
  totalMarksScored: number | string;
  submittedAt: string;
  evaluatedStatus?: string;
}

interface EnhancedPDFReportProps {
  assessment: Assessment;
  appearedCandidates: Candidate[];
  shortlistedCandidates: Candidate[];
  jobTitle: string;
  examDate: string;
  studentResponses: any[];
  onClose: () => void;
}

interface TopicAnalytics {
  heading: string;
  weightage: string; // percentage string
  performance: string;
  supportingData: string;
  percentageAvg: number; // To determine color
}

export default function EnhancedPDFReport2({
  assessment,
  appearedCandidates,
  shortlistedCandidates,
  jobTitle,
  examDate,
  studentResponses,
  onClose,
}: EnhancedPDFReportProps) {
  const user: any = useAuthStore((state) => state.user);
  console.log(user, "user role in report");

  const handlePrint = () => {
    const printContent = document.getElementById("pdf-content");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Assessment Report</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @media print {
              body {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .print-break-after-page {
                break-after: page;
              }
            }
            body {
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
          </style>
        </head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
  };

  //Calculation for student performance in Topics
  function generateTopicAnalytics(
    topics: any[],
    studentResponses: any[]
  ): TopicAnalytics[] {
    const topicData: {
      [key: string]: {
        heading: string;
        questionIds: Set<string>;
        totalMarks: number;
        totalScored: number;
        studentCount: number;
        studentsBelow40: number;
      };
    } = {};
    let totalAssessmentMarks = 0;

    // Step 1: Collect total marks per topic
    for (const topic of topics) {
      const totalMarks = topic.selectedQuestions.reduce(
        (sum: number, q: any) => sum + q.totalMarks,
        0
      );
      const questionIds = topic.selectedQuestions.map((q: any) => q.questionId);
      topicData[topic.heading] = {
        heading: topic.heading,
        questionIds: new Set(questionIds),
        totalMarks,
        totalScored: 0,
        studentCount: 0,
        studentsBelow40: 0,
      };
      totalAssessmentMarks += totalMarks;
    }

    // Step 2: Process each student
    for (const student of studentResponses) {
      const responseMap = new Map();
      for (const response of student.responses) {
        responseMap.set(response.questionId, response.marksAwarded || 0);
      }

      for (const topicKey in topicData) {
        const topic = topicData[topicKey];
        let studentScoreInTopic = 0;
        for (const qId of topic.questionIds) {
          studentScoreInTopic += responseMap.get(qId) || 0;
        }
        topic.totalScored += studentScoreInTopic;
        topic.studentCount += 1;
        const percentageScore = (studentScoreInTopic / topic.totalMarks) * 100;
        if (percentageScore < 40) {
          topic.studentsBelow40 += 1;
        }
      }
    }

    // Step 3: Generate summary
    const summary: TopicAnalytics[] = [];
    for (const topicKey in topicData) {
      const topic = topicData[topicKey];
      const weightage = (
        (topic.totalMarks / totalAssessmentMarks) *
        100
      ).toFixed(0);
      const average = topic.totalScored / topic.studentCount;
      const percentageAvg = (average / topic.totalMarks) * 100;
      let performanceLine = "";
      if (percentageAvg >= 70) {
        performanceLine = `Students generally scored well in this section.`;
      } else if (percentageAvg >= 40) {
        performanceLine = `Students had mixed performance in this section.`;
      } else {
        performanceLine = `Most students scored poorly in this section.`;
      }
      summary.push({
        heading: topic.heading,
        weightage: weightage,
        performance: performanceLine,
        supportingData: `${topic.studentsBelow40} out of ${topic.studentCount} students scored below 40% in this topic.`,
        percentageAvg: percentageAvg,
      });
    }
    return summary;
  }

  const topics = assessment.topics || [];
  const report = generateTopicAnalytics(topics, studentResponses || []);
  console.log(report);

  interface QuestionPerformanceUI {
    questionId: string;
    title: string;
    questionTopic: string;
    difficulty: string;
    marks: number;
    correctRate: string; // "82%"
    avgTime: number; // in seconds
    performanceColor: string; // "green" | "orange" | "red"
    performanceWidth: number;
  }

  function truncateText(text: string, maxLength: number) {
    if (!text) return "";
    const clean = text.replace(/<[^>]*>/g, "").trim();
    return clean.length > maxLength
      ? clean.substring(0, maxLength) + "..."
      : clean;
  }
  function generateQuestionPerformanceUI_old(
    topics: any[],
    studentResponses: any[]
  ): QuestionPerformanceUI[] {
    const allQuestions: {
      [key: string]: {
        questionId: string;
        title: string;
        questionTopic: string;
        difficulty: string;
        marks: number;
        attempts: number;
        correctCount: number;
        totalTime: number;
      };
    } = {};

    // Step 1: Flatten all selected questions
    for (const topic of topics) {
      for (const q of topic.selectedQuestions) {
        allQuestions[q.questionId] = {
          questionId: q.questionId,
          title: truncateText(q.title, 15),
          questionTopic: q.questionTopic,
          difficulty: q.difficulty || "Medium",
          marks: q.totalMarks,
          attempts: 0,
          correctCount: 0,
          totalTime: 0,
        };
      }
    }

    // Step 2: Count stats from student responses
    for (const student of studentResponses) {
      for (const res of student.responses) {
        const qData = allQuestions[res.questionId];
        if (!qData) continue;

        qData.attempts += 1;
        if ((res.marksAwarded || 0) === qData.marks) {
          qData.correctCount += 1;
        }
        qData.totalTime += res.timeTaken || 0;
      }
    }

    // Step 3: Build output
    const results: QuestionPerformanceUI[] = [];

    for (const qId in allQuestions) {
      const q = allQuestions[qId];
      const correctRateNum =
        q.attempts > 0 ? (q.correctCount / q.attempts) * 100 : 0;
      const avgTime = q.attempts > 0 ? q.totalTime / q.attempts : 0;

      let performanceColor = "red";
      if (correctRateNum >= 70) {
        performanceColor = "green";
      } else if (correctRateNum >= 50) {
        performanceColor = "orange";
      }

      results.push({
        questionId: q.questionId,
        title: q.title,
        questionTopic: q.questionTopic,
        difficulty: q.difficulty,
        marks: q.marks,
        correctRate: `${Math.round(correctRateNum)}%`,
        avgTime: Math.round(avgTime),
        performanceColor,
        performanceWidth: Math.round(correctRateNum), // ✅ Direct width
      });
    }

    return results;
  }

  const questionwiseReport = generateQuestionPerformanceUI_old(
    topics,
    studentResponses || []
  );
  console.log(questionwiseReport, "questionwiseReport");
  // --- Calculations for Summary and Key Findings ---
  const totalAppeared = appearedCandidates.length;
  const totalInvited = assessment.invitedStudents?.length || 0;
  const totalMarksScored = appearedCandidates.reduce((sum, c) => {
    const marks =
      typeof c.totalMarksScored === "number" ? c.totalMarksScored : 0;
    return sum + marks;
  }, 0);
  const classAverage =
    totalAppeared > 0 ? (totalMarksScored / totalAppeared).toFixed(1) : "0.0";
  const classAveragePercentage =
    totalAppeared > 0
      ? (
          (totalMarksScored / totalAppeared / assessment.totalMarks) *
          100
        ).toFixed(1)
      : "0.0";
  const passCount = shortlistedCandidates.length; // Placeholder, replace with actual logic if available
  const passRate =
    shortlistedCandidates.length > 0
      ? ((shortlistedCandidates.length / totalAppeared) * 100).toFixed(1)
      : "0.0";
  const highestScore = appearedCandidates.reduce((max, c) => {
    const marks =
      typeof c.totalMarksScored === "number" ? c.totalMarksScored : 0;
    return Math.max(max, marks);
  }, 0);

  // Dynamic calculation for strong performers and need support
  const strongPerformers = appearedCandidates.filter(
    (c) =>
      (typeof c.totalMarksScored === "number" ? c.totalMarksScored : 0) > 60
  );
  const strongPerformersCount = strongPerformers.length;
  const strongPerformersPercentage =
    totalAppeared > 0
      ? ((strongPerformersCount / totalAppeared) * 100).toFixed(1)
      : "0.0";

  const needSupport = appearedCandidates.filter(
    (c) =>
      (typeof c.totalMarksScored === "number" ? c.totalMarksScored : 0) < 20
  );
  const needSupportCount = needSupport.length;
  const needSupportPercentage =
    totalAppeared > 0
      ? ((needSupportCount / totalAppeared) * 100).toFixed(1)
      : "0.0";

  const sortedCandidates = [...appearedCandidates]
    .map((c) => ({
      ...c,
      numericScore:
        typeof c.totalMarksScored === "number" ? c.totalMarksScored : 0,
    }))
    .sort((a, b) => b.numericScore - a.numericScore);

  const topPerformers = sortedCandidates.slice(0, 4); // Used for the table, not the chart

  // Data for the new Performance Analysis Bar Chart (Average vs Top 5)
  const top5PerformersForChart = sortedCandidates.slice(0, 5);
  const performanceAnalysisChartData = [
    { name: "Class Average", score: Number.parseFloat(classAveragePercentage) },
    ...top5PerformersForChart.map((p, index) => ({
      name: `Top ${index + 1}`,
      score: Number.parseFloat(
        ((p.numericScore / assessment.totalMarks) * 100).toFixed(1)
      ),
    })),
  ];

  const performanceAnalysisChartConfig = {
    "Class Average": {
      label: "Class Average",
      color: "hsl(var(--chart-1))", // Orange
    },
    "Top 1": {
      label: "Top 1",
      color: "hsl(var(--chart-2))", // Green
    },
    "Top 2": {
      label: "Top 2",
      color: "hsl(var(--chart-3))", // Green
    },
    "Top 3": {
      label: "Top 3",
      color: "hsl(var(--chart-4))", // Green
    },
    "Top 4": {
      label: "Top 4",
      color: "hsl(var(--chart-5))", // Green
    },
    "Top 5": {
      label: "Top 5",
      color: "hsl(var(--chart-6))", // Green
    },
  } as const;

  // Data for the Performance Distribution Pie Chart
  const averagePerformersCount = Math.max(
    0,
    totalInvited - strongPerformersCount - needSupportCount
  );
  const performanceData = [
    { name: "Strong Performers", value: strongPerformersCount },
    { name: "Need Support", value: needSupportCount },
    { name: "Average Performers", value: averagePerformersCount },
  ];

  // Filter out categories with 0 value if totalInvited is 0 or counts are invalid
  const filteredPerformanceData = performanceData.filter(
    (item) => item.value > 0
  );

  const performanceChartConfig = {
    "Strong Performers": {
      label: "Strong Performers",
      color: "hsl(var(--chart-1))", // Greenish
    },
    "Need Support": {
      label: "Need Support",
      color: "hsl(var(--chart-2))", // Orangish
    },
    "Average Performers": {
      label: "Average Performers",
      color: "hsl(var(--chart-3))", // Bluish
    },
  } as const; // Use 'as const' for better type inference with ChartContainer

  // Data for Score Distribution Analysis Chart
  const scoreRanges = [
    {
      range: "0-20%",
      level: "Poor",
      min: 0,
      max: 20,
      count: 0,
      color: "#FF6384",
    },
    {
      range: "21-40%",
      level: "Below Average",
      min: 21,
      max: 40,
      count: 0,
      color: "#36A2EB",
    },
    {
      range: "41-60%",
      level: "Average",
      min: 41,
      max: 60,
      count: 0,
      color: "#FFCE56",
    },
    {
      range: "61-80%",
      level: "Good",
      min: 61,
      max: 80,
      count: 0,
      color: "#4BC0C0",
    },
    {
      range: "81-100%",
      level: "Excellent",
      min: 81,
      max: 100,
      count: 0,
      color: "#9966FF",
    },
  ];

  const scoreDistributionData = scoreRanges.map((range) => {
    const count = appearedCandidates.filter((c) => {
      const score =
        typeof c.totalMarksScored === "number" ? c.totalMarksScored : 0;
      const percentage = (score / assessment.totalMarks) * 100;
      return percentage >= range.min && percentage <= range.max;
    }).length;
    return { ...range, count };
  });

  const scoreDistributionChartConfig = {
    count: {
      label: "Number of Students",
      color: "hsl(var(--chart-1))",
    },
    "0-20%": { color: "hsl(var(--chart-1))" },
    "21-40%": { color: "hsl(var(--chart-2))" },
    "41-60%": { color: "hsl(var(--chart-3))" },
    "61-80%": { color: "hsl(var(--chart-4))" },
    "81-100%": { color: "hsl(var(--chart-5))" },
  } as const;

  // Pagination logic for "TOTAL STUDENTS PERFORMERS"
  const studentsPerPageFirst = 20;
  const studentsPerPageSubsequent = 20;
  let studentsRendered = 0;
  const totalStudents = sortedCandidates.length;
  const paginatedStudents = [];

  // First page
  if (totalStudents > 0) {
    const firstPageSlice = sortedCandidates.slice(0, studentsPerPageFirst);
    paginatedStudents.push(firstPageSlice);
    studentsRendered += firstPageSlice.length;
  }

  // Subsequent pages
  while (studentsRendered < totalStudents) {
    const nextPageSlice = sortedCandidates.slice(
      studentsRendered,
      studentsRendered + studentsPerPageSubsequent
    );
    if (nextPageSlice.length > 0) {
      paginatedStudents.push(nextPageSlice);
      studentsRendered += nextPageSlice.length;
    } else {
      break; // No more students to add
    }
  }

  return (
    <div className="w-full h-full bg-gray-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto bg-white shadow-lg">
        {/* Control buttons - not part of print content */}
        <div className="flex justify-between items-center p-6 bg-white sticky top-0 z-10 border-b">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex items-center gap-2 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Results
          </Button>
          <Button
            onClick={handlePrint}
            className="bg-[#219CAE] hover:bg-[#6ba8b1]"
          >
            Print Report
          </Button>
        </div>

        {/* PDF Content - this will be printed */}
        <div id="pdf-content">
          {/* Page 1: Main Overview */}
          <div className="print-break-after-page">
            {/* Header Section */}
            <div className="bg-white text-black p-8 relative rounded-2xl border border-[#CDE7EB] overflow-hidden print:shadow-none print:border">
              <div className="relative z-10">
                <div className="flex items-center mb-6 space-x-4">
                  {/* Skill Access Logo */}
                  <Image
                    alt="Skill Access Logo"
                    width={160}
                    height={160}
                    src="/images/skill_access_logo.png"
                  />
                  {/* Ampersand separator */}
                  {user.role === "company" && (
                    <>
                      <div className="w-8 h-8 rounded-full bg-[#CDE7EB] flex items-center justify-center text-[#219CAE] font-bold text-xl">
                        &
                      </div>
                      <Image
                        alt="Partner Logo"
                        width={160}
                        height={160}
                        src="/images/protonshub.svg" // replace with actual path/
                      />
                    </>
                  )}
                  {/* Right Line */}
                  <div className="flex-grow h-0.5 bg-[#CDE7EB] mt-2"></div>
                </div>
                {/* <h2 className="text-l text-[#219CAE] font-extrabold mb-2">
                  {jobTitle}
                </h2> */}
                <div>
                  {/* Company with two-tone styling */}
                  {user.role === "company" && (
                    <p className="mb-1">
                      <span className="text-gray-900 font-semibold">
                        Company:{" "}
                      </span>
                      <span className="text-black">{user.name}</span>
                    </p>
                  )}
                  {/* College */}
                  <p className="mb-1">
                    <span className="text-gray-900 font-semibold">
                      College:{" "}
                    </span>
                    <span className="text-black">NMIMS,Indore</span>
                  </p>
                  {/* Job Title */}

                  {user.role === "company" && (
                    <p className="mb-1">
                      <span className="text-gray-900 font-semibold">
                        Job Title:{" "}
                      </span>
                      <span className="text-black">{jobTitle}</span>
                    </p>
                  )}
                </div>
                {/* <p className="text-black mb-1">
                  Qalio | Assessment & Hiring Platform
                </p> */}
                {/* <p className="text-black mb-4">
                  Comprehensive Talent Evaluation & Analytics Dashboard
                </p> */}
                <p className="text-black">
                  Report Generated:{" "}
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-5 gap-4 p-8 ">
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700 print:border print:border-gray-300 print:shadow-none">
                <Clock className="h-6 w-6 text-[#2563EB] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#2563EB]">Time</p>
                <p className="text-lg text-[#2563EB] font-bold">
                  {assessment.totalTime || 55} minutes
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700 print:border print:border-gray-300 print:shadow-none">
                <Trophy className="h-6 w-6 text-[#16A34A] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#16A34A]">Total</p>
                <p className="text-lg text-[#16A34A] font-bold">
                  {assessment.totalMarks || 100} marks
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700 print:border print:border-gray-300 print:shadow-none">
                <BookOpen className="h-6 w-6 text-[#9333EA] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#9333EA]">Questions</p>
                <p className="text-lg text-[#9333EA] font-bold">
                  {assessment.totalQuestionsCount || 12} questions
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700 print:border print:border-gray-300 print:shadow-none">
                <Users className="h-6 w-6 text-[#EA580C] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#EA580C]">
                  Students Appeared
                </p>
                <p className="text-lg text-[#EA580C] font-bold">
                  {totalAppeared} students
                </p>
              </div>
              <div className="bg-white rounded-lg p-4 text-center border border-gray-200 dark:border-gray-700 print:border print:border-gray-300 print:shadow-none">
                <CalendarDays className="h-6 w-6 text-[#EA0C0C] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#EA0C0C]">Calendar</p>
                <p className="text-lg text-[#EA0C0C] font-bold">
                  {examDate}
                  {/* {assessment.endDate
                    ? new Date(assessment.endDate).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "July 25, 2025"} */}
                </p>
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-white  ">
              <div className="p-8 ">
                <div className="flex gap-1.5">
                  <div className="mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width={20}
                      height={33}
                      fill="none"
                    >
                      <path
                        stroke="#219CAE"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.667}
                        d="M10 4.667a2.5 2.5 0 1 0-4.997.104 3.333 3.333 0 0 0-2.105 4.808 3.333 3.333 0 0 0 .463 5.49 3.333 3.333 0 1 0 6.639.43V4.668Z"
                      />
                      <path
                        stroke="#219CAE"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.667}
                        d="M10 4.667a2.5 2.5 0 1 1 4.998.104 3.333 3.333 0 0 1 2.104 4.808 3.334 3.334 0 0 1-.463 5.49A3.335 3.335 0 1 1 10 15.5V4.667Z"
                      />
                      <path
                        stroke="#219CAE"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.667}
                        d="M12.5 11.333A3.75 3.75 0 0 1 10 8a3.75 3.75 0 0 1-2.5 3.333M14.666 5.917a2.5 2.5 0 0 0 .332-1.146M5.004 4.771a2.5 2.5 0 0 0 .332 1.146M2.896 9.58c.153-.124.316-.235.488-.33M16.615 9.25c.172.095.335.206.488.33M5 15.5a3.332 3.332 0 0 1-1.639-.43M16.64 15.07c-.501.282-1.066.43-1.64.43"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#219CAE] mb-6">
                    Summary
                  </h2>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="bg-slate-50 rounded-lg p-6 text-center">
                    <p className="text-4xl font-bold text-blue-600 mb-2">
                      {classAveragePercentage}%
                    </p>
                    <p className="text-lg font-medium text-gray-700">
                      Class Average
                    </p>
                    <p className="text-sm text-gray-500">
                      ({classAverage}/{assessment.totalMarks} marks)
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-6 text-center">
                    <p className="text-4xl font-bold text-orange-600 mb-2">
                      {passRate}%
                    </p>
                    <p className="text-lg font-medium text-gray-700">
                      Pass Rate
                    </p>
                    <p className="text-sm text-gray-500">
                      ({passCount}/{totalAppeared} students)
                    </p>
                  </div>
                  <div className="bg-cyan-50 rounded-lg p-6 text-center">
                    <p className="text-4xl font-bold text-green-600 mb-2">
                      {highestScore}
                    </p>
                    <p className="text-lg font-medium text-gray-700">
                      Highest Score
                    </p>
                    <p className="text-sm text-gray-500">
                      Range: 0-{assessment.totalMarks}
                    </p>
                  </div>
                </div>
              </div>

              {/* Key Findings Section */}
              <div className="p-4  ">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="-mt-5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-7 h-7" // Tailwind scaling now works
                      viewBox="0 0 13 14"
                      fill="none"
                    >
                      <path
                        stroke="#EAB308"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.063}
                        d="M7.976 7.998c.106-.532.372-.904.797-1.33.532-.478.797-1.169.797-1.86a3.19 3.19 0 1 0-6.379 0c0 .532.107 1.17.798 1.86.372.373.69.798.797 1.33M4.787 10.125h3.19M5.316 12.252h2.127"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-[#EAB308] mb-6">
                    Key Findings
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-green-50 rounded-lg p-6 flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        Strong Performers
                      </p>
                      <p className="text-gray-700">
                        {strongPerformersCount} students (
                        {strongPerformersPercentage}
                        %) scored above 60 marks
                      </p>
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-6 flex items-center gap-4">
                    <div className="bg-orange-100 p-3 rounded-full">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        Need Support
                      </p>
                      <p className="text-gray-700">
                        {needSupportCount} students ({needSupportPercentage}%)
                        scored below 20 marks
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Performance Analysis Section */}
          <div className="print-break-after-page flex flex-col">
            <div className="flex-1">
              <div className="p-3">
                <div className="flex flex-row gap-3.5">
                  <div className="mt-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 18 18"
                      className="w-6 h-6"
                      fill="none"
                    >
                      <path
                        fill="#219CAE"
                        d="M0 2a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2ZM16 0H2v14h14V2ZM9 4a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1Zm4 2a1 1 0 0 1 1 1v6a1 1 0 0 1-2 0V7a1 1 0 0 1 1-1ZM5 8a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1Z"
                      />
                    </svg>
                  </div>
                  <h2 className="text-2xl text-[#219CAE] font-bold mb-4">
                    PERFORMANCE ANALYSIS
                  </h2>
                </div>
                <p className="text-gray-600 mb-8">
                  This chart compares the overall average performance with the
                  top 5 individual performers, highlighting the performance gap
                  and excellence benchmarks.
                </p>
                <div className="relative h-80 bg-white border rounded-lg p-6">
                  {totalAppeared > 0 &&
                  performanceAnalysisChartData.length > 0 ? (
                    <ChartContainer
                      config={performanceAnalysisChartConfig}
                      className="!h-[300px] w-full"
                    >
                      <BarChart
                        accessibilityLayer
                        data={performanceAnalysisChartData}
                        margin={{
                          top: 20,
                          right: 10,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <XAxis
                          dataKey="name"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          className="text-xs"
                        />
                        <YAxis
                          tickFormatter={(value) => `${value}%`}
                          tickLine={false}
                          axisLine={false}
                          className="text-xs"
                        />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar
                          dataKey="score"
                          radius={[4, 4, 0, 0]}
                          label={{
                            position: "top",
                            formatter: (value: number) => `${value}%`,
                          }}
                        >
                          {performanceAnalysisChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={barColors[index % barColors.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  ) : (
                    <p className="text-gray-500">
                      No data available for performance analysis.
                    </p>
                  )}
                </div>
              </div>

              <div className=" bg-white">
                <div className="p-2">
                  <div className="flex flex-row gap-3.5">
                    <div className="mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 18 18"
                        className="w-6 h-6"
                        fill="none"
                      >
                        <path
                          fill="#219CAE"
                          d="M0 2a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2ZM16 0H2v14h14V2ZM9 4a1 1 0 0 1 1 1v8a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1Zm4 2a1 1 0 0 1 1 1v6a1 1 0 0 1-2 0V7a1 1 0 0 1 1-1ZM5 8a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0V9a1 1 0 0 1 1-1Z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl text-[#219CAE] font-bold mb-4">
                      SCORE DISTRIBUTION ANALYSIS
                    </h2>
                  </div>
                  <p className="text-gray-600 mb-8">
                    This chart illustrates the distribution of student scores
                    across defined percentage ranges, indicating performance
                    levels.
                  </p>
                  <div className="relative h-80 bg-white border rounded-lg p-1">
                    {totalAppeared > 0 && scoreDistributionData.length > 0 ? (
                      <ChartContainer
                        config={scoreDistributionChartConfig}
                        className="!h-[300px] w-full"
                      >
                        <BarChart
                          accessibilityLayer
                          data={scoreDistributionData}
                          margin={{
                            top: 44,
                            right: 10,
                            left: 20,
                            bottom: 0,
                          }}
                        >
                          <XAxis
                            dataKey="range"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            className="text-xs"
                          />
                          <YAxis
                            tickFormatter={(value) => `${value}`}
                            tickLine={false}
                            axisLine={false}
                            className="text-xs"
                          />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="dot" />}
                          />
                          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                            {scoreDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            <LabelList
                              dataKey="count"
                              content={({ x, y, width, value, index }) => {
                                if (
                                  index === undefined ||
                                  index >= scoreDistributionData.length
                                )
                                  return null; // Check if index is valid
                                const count =
                                  scoreDistributionData[index].count; // Safely access count
                                const percentage = Math.round(
                                  (count / (totalAppeared || 1)) * 100
                                ); // Avoid division by zero
                                return (
                                  <text
                                    x={
                                      (typeof x === "number" ? x : 0) +
                                      (typeof width === "number" ? width : 0) /
                                        2
                                    } // Ensure x and width are numbers
                                    y={(typeof y === "number" ? y : 0) - 10} // Ensure y is a number
                                    textAnchor="middle"
                                    className="text-xs fill-gray-800"
                                  >{`${percentage}% (${value})`}</text>
                                );
                              }}
                            />
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <p className="text-gray-500">
                        No data available for score distribution.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Footer */}
            <div className="pt-6 border-t mt-16">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>2025 Qalio. All rights reserved.</span>
                <span>Confidential Assessment Report</span>
              </div>
            </div>
          </div>

          {/* Page 2: Subject Analysis (Score Distribution Analysis) */}
          {/* Performance Distribution Section (Pie Chart) */}
          <div className="print-break-after-page bg-white flex flex-col min-h-[100vh]">
            <div className="flex items-center mb-4 px-4 pt-0 space-x-1 pb-0">
              <Image
                alt="Skill Access Logo"
                width={100}
                height={60}
                src="/images/skill_access_logo.png"
              />
              {user.role === "company" && (
                <>
                  <div className="w-5  h-5 rounded-full bg-[#CDE7EB] flex items-center justify-center text-[#219CAE] font-bold text-l ">
                    &
                  </div>
                  {/* Partner SVG Logo */}
                  <Image
                    alt="Partner Logo"
                    width={100}
                    height={60}
                    src="/images/protonshub.svg" // replace with actual path/
                  />
                </>
              )}
            </div>
            <div className="p-8 pt-0 flex-1 flex flex-col">
              <div className="flex flex-row gap-3.5">
                {/* Icon and Heading */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 text-[#219CAE]"
                >
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <h2 className="text-2xl text-[#219CAE] font-bold mb-4">
                  PERFORMANCE DISTRIBUTION
                </h2>
              </div>
              <p className="text-gray-600 mb-8">
                This chart illustrates the distribution of student performance
                across different categories: strong performers, those needing
                support, and average performers, based on the total invited
                students.
              </p>
              <div className="relative h-96 bg-white border rounded-lg p-6 flex items-center justify-center">
                {totalInvited > 0 && filteredPerformanceData.length > 0 ? (
                  <ChartContainer
                    config={performanceChartConfig}
                    className="mx-auto aspect-square h-[511px] w-[621px] overflow-visible text-[10px] font-semibold text-gray-800"
                  >
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                      />
                      <Pie
                        data={filteredPerformanceData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={60}
                        outerRadius={120}
                        strokeWidth={3}
                        label={({ name, percent }) =>
                          `${name}\n${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {filteredPerformanceData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <ChartLegend
                        content={<ChartLegendContent nameKey="name" />}
                        className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                      />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <p className="text-gray-500">
                    No data available for performance distribution.
                  </p>
                )}
              </div>
            </div>

            {/* 🔽 Sticky Footer */}
            <div className="mt-8 pt-4 border-t px-8">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>2025 Qalio. All rights reserved.</span>
                <span>Confidential Assessment Report</span>
              </div>
            </div>
          </div>
          {/*New Page*/}

          {/* Page X: Question Performance Analysis */}
          <div className="print-break-after-page bg-white flex flex-col min-h-[100vh]">
            {/* Header Logo */}
            <div className="flex items-center mb-4 px-4 pt-0 space-x-1 pb-0">
              <Image
                alt="Skill Access Logo"
                width={100}
                height={60}
                src="/images/skill_access_logo.png"
              />
              {user.role === "company" && (
                <>
                  <div className="w-5 h-5 rounded-full bg-[#CDE7EB] flex items-center justify-center text-[#219CAE] font-bold text-l ">
                    &
                  </div>
                  <Image
                    alt="Partner Logo"
                    width={100}
                    height={60}
                    src="/images/protonshub.svg"
                  />
                </>
              )}
            </div>

            {/* Page Content */}
            <div className="p-8 pt-0 flex-1 flex flex-col">
              {/* Heading */}
              <div className="flex flex-row gap-3.5 items-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  className="w-6 h-6 -mt-3"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 2C0 1.46957 0.210714 0.960859 0.585786 0.585786C0.960859 0.210714 1.46957 0 2 0H16C16.5304 0 17.0391 0.210714 17.4142 0.585786C17.7893 0.960859 18 1.46957 18 2V16C18 16.5304 17.7893 17.0391 17.4142 17.4142C17.0391 17.7893 16.5304 18 16 18H2C1.46957 18 0.960859 17.7893 0.585786 17.4142C0.210714 17.0391 0 16.5304 0 16V2ZM16 2H2V16H16V2ZM9 4C9.26522 4 9.51957 4.10536 9.70711 4.29289C9.89464 4.48043 10 4.73478 10 5V13C10 13.2652 9.89464 13.5196 9.70711 13.7071C9.51957 13.8946 9.26522 14 9 14C8.73478 14 8.48043 13.8946 8.29289 13.7071C8.10536 13.5196 8 13.2652 8 13V5C8 4.73478 8.10536 4.48043 8.29289 4.29289C8.48043 4.10536 8.73478 4 9 4ZM13 6C13.2652 6 13.5196 6.10536 13.7071 6.29289C13.8946 6.48043 14 6.73478 14 7V13C14 13.2652 13.8946 13.5196 13.7071 13.7071C13.5196 13.8946 13.2652 14 13 14C12.7348 14 12.4804 13.8946 12.2929 13.7071C12.1054 13.5196 12 13.2652 12 13V7C12 6.73478 12.1054 6.48043 12.2929 6.29289C12.4804 6.10536 12.7348 6 13 6ZM5 8C5.26522 8 5.51957 8.10536 5.70711 8.29289C5.89464 8.48043 6 8.73478 6 9V13C6 13.2652 5.89464 13.5196 5.70711 13.7071C5.51957 13.8946 5.26522 14 5 14C4.73478 14 4.48043 13.8946 4.29289 13.7071C4.10536 13.5196 4 13.2652 4 13V9C4 8.73478 4.10536 8.48043 4.29289 8.29289C4.48043 8.10536 4.73478 8 5 8Z"
                    fill="#219CAE"
                  />
                </svg>

                <h2 className="text-2xl text-[#219CAE] font-bold mb-4">
                  Question Performance Analysis
                </h2>
              </div>

              {/* Description */}
              <p className="text-gray-600 mb-6">
                This section shows each question’s topic,marks and performance
                color and correct rate based on student responses.
              </p>

              {/* Table Section */}
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full border-collapse">
                  <thead className="bg-[#F4F9FA]">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border-b">
                        Question Title
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border-b">
                        Topic
                      </th>
                      {/* <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border-b">
                        Difficulty
                      </th> */}
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border-b">
                        Marks
                      </th>
                      {/* <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border-b">
                        Correct Rate
                      </th> */}
                      {/* <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600 border-b">
                        Avg Time (sec)
                      </th> */}
                      <th className="px-2 py-2 text-left text-sm font-semibold text-gray-600 border-b">
                        Correct Rate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {generateQuestionPerformanceUI_old(
                      topics,
                      studentResponses
                    ).map((q) => (
                      <tr key={q.questionId} className="hover:bg-gray-50">
                        {/* Question Title */}
                        <td className="px-4 py-2 text-sm text-gray-800 border-b">
                          {q.title}
                        </td>

                        {/* Topic Badge */}
                        <td className="px-4 py-2 text-sm text-gray-600 border-b">
                          <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full whitespace-nowrap">
                            {q.questionTopic}
                          </span>
                        </td>

                        {/* Difficulty Badge */}
                        {/* <td className="px-4 py-2 text-sm text-gray-600 border-b">
                          <span
                            className={`px-3 py-1 rounded-full ${
                              q.difficulty.toLowerCase() === "easy"
                                ? "bg-green-100 text-green-600"
                                : q.difficulty.toLowerCase() === "medium"
                                ? "bg-orange-100 text-orange-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </td> */}

                        {/* Marks */}
                        <td className="px-4 py-2 text-sm text-gray-600 border-b">
                          {q.marks}
                        </td>

                        {/* Correct Rate */}
                        {/* <td className="px-4 py-2 text-sm text-gray-600 border-b">
                          {q.correctRate}
                        </td> */}

                        {/* Avg Time */}
                        {/* <td className="px-4 py-2 text-sm text-gray-600 border-b">
                          {q.avgTime}
                        </td> */}

                        {/* Performance Bar */}
                        <td className="px-4 py-2 text-sm border-b">
                          <div
                            className="flex items-center gap-2"
                            style={{ minWidth: "120px" }}
                          >
                            <div
                              className="bg-gray-200 rounded-full overflow-hidden"
                              style={{
                                minWidth: "80px", // Ensures bar width for PDF
                                height: "8px",
                                flexShrink: 0,
                              }}
                            >
                              <div
                                style={{
                                  width: `${q.performanceWidth}%`,
                                  height: "100%",
                                  backgroundColor:
                                    q.performanceColor === "green"
                                      ? "#22c55e" // Tailwind green-500
                                      : q.performanceColor === "orange"
                                      ? "#f97316" // Tailwind orange-500
                                      : "#ef4444", // Tailwind red-500
                                }}
                              />
                            </div>
                            <span className="text-gray-600">
                              {q.correctRate}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t px-8">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>2025 Qalio. All rights reserved.</span>
                <span>Confidential Assessment Report</span>
              </div>
            </div>
          </div>

          {/* Page 3: All Students (Original content, no changes requested) */}
          <div className="print-break-after-page bg-white min-h-screen flex flex-col">
            {/* Header Logo */}
            <div className="flex items-center mb-4 px-4 pt-0 space-x-1 pb-0">
              <Image
                alt="Skill Access Logo"
                width={100}
                height={60}
                src="/images/skill_access_logo.png"
              />
              {user.role === "company" && (
                <>
                  <div className="w-5  h-5 rounded-full bg-[#CDE7EB] flex items-center justify-center text-[#219CAE] font-bold text-l ">
                    &
                  </div>
                  {/* Partner SVG Logo */}
                  <Image
                    alt="Partner Logo"
                    width={100}
                    height={60}
                    src="/images/protonshub.svg" // replace with actual path/
                  />
                </>
              )}
            </div>
            {/* Page Content */}
            <div className="p-4 flex-1">
              <h2 className="text-xl font-bold text-[#219CAE] mb-3">
                SUBJECT/TOPIC ANALYSIS:
              </h2>
              {report.length > 0 ? (
                report.map((topic, index) => {
                  let bgColor = "bg-red-50";
                  let borderColor = "border-red-500";
                  if (topic.percentageAvg >= 70) {
                    bgColor = "bg-green-50";
                    borderColor = "border-green-500";
                  } else if (topic.percentageAvg >= 40) {
                    bgColor = "bg-yellow-50";
                    borderColor = "border-yellow-500";
                  }

                  return (
                    <div
                      key={index}
                      className={`${bgColor} border-l-4 ${borderColor} p-6 mb-8`}
                    >
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        {topic.heading}
                      </h3>
                      <p className="text-gray-700 mb-2">
                        <strong>Weightage:</strong> {topic.weightage}% of total
                        mark
                      </p>
                      <div className="space-y-2">
                        <p className="text-gray-700">
                          <strong>• Performance:</strong> {topic.performance}
                        </p>
                        <p className="text-gray-700">
                          <strong>• Supporting Data:</strong>{" "}
                          {topic.supportingData}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500">
                  No topic analysis data available.
                </p>
              )}

              <h2 className="text-xl font-bold text-[#219CAE] mb-1">
                {shortlistedCandidates.length > 0
                  ? "TOP PERFORMERS"
                  : "Selection Round Overview"}
              </h2>
              {shortlistedCandidates.length > 0 ? (
                <>
                  <p className="text-gray-600 mb-4">
                    These have been shortlisted. They have scored{" "}
                    {assessment.cutOff} marks or above.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#F9FAFB] border-b">
                          {[
                            "Rank",
                            "Name",
                            "Email",
                            "Score",
                            "%",
                            "Grade",
                            "Performance",
                          ].map((h) => (
                            <th
                              key={h}
                              className="border-b px-2 py-1 text-left font-semibold"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {shortlistedCandidates.map((c, i) => {
                          const score =
                            typeof c.totalMarksScored === "number"
                              ? c.totalMarksScored
                              : 0;
                          const percentage = (
                            (score / assessment.totalMarks) *
                            100
                          ).toFixed(1);
                          const percent = Number.parseFloat(percentage);
                          let grade = "F";
                          if (percent >= 90) grade = "A";
                          else if (percent >= 80) grade = "B";
                          else if (percent >= 70) grade = "C";
                          else if (percent >= 60) grade = "D";
                          // else grade remains "F"
                          return (
                            <tr
                              key={c.studentId}
                              className="border-b hover:bg-gray-50"
                            >
                              <td className="px-2 py-1">#{i + 1}</td>
                              <td className="px-2 py-1">{c.name}</td>
                              <td className="px-2 py-1 break-all">{c.email}</td>
                              <td className="px-2 py-1">
                                {score}/{assessment.totalMarks}
                              </td>
                              <td className="px-2 py-1">{percentage}%</td>
                              <td className="px-2 py-1">
                                <span className="bg-green-100 text-black px-1 py-0.5 rounded text-xs">
                                  {grade}
                                </span>
                              </td>
                              <td className="px-2 py-1">
                                <div className="flex items-center gap-1">
                                  <div className="w-12 bg-gray-200 rounded-full h-1">
                                    <div
                                      className="bg-green-500 h-1 rounded-full"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                  <span>{percentage}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                  {/* Results Section */}
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      Assessment Results
                    </h3>
                    <div className="text-gray-600 mb-2">
                      <p className="text-lg">
                        No candidates have been shortlisted.
                      </p>
                    </div>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-lg font-bold text-gray-700">
                        Cutoff Score:
                      </span>
                      <span className="font-semibold text-2xl text-[#219CAE]">
                        {assessment.cutOff}
                      </span>
                    </div>
                  </div>
                  {/* Observations & Next Steps */}
                  <div className="border-t pt-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">
                      Observations
                    </h3>
                    <ul className="space-y-3 text-gray-700">
                      <li className="flex items-start">
                        <span className="text-[#219CAE] mr-2">•</span>
                        <div>
                          <span className="font-semibold">
                            Rigorous Standards:
                          </span>{" "}
                          The cutoff was set to ensure high competency, but the
                          current results suggest a need to revisit candidate
                          outreach or assessment criteria.
                        </div>
                      </li>
                      <li className="flex items-start">
                        {/* <span className="text-[#219CAE] mr-2">•</span>
                        <div>
                          <span className="font-semibold">
                            Recommendations:
                          </span>{" "}
                          Consider expanding the applicant pool or providing
                          targeted skill development opportunities for future
                          assessments.
                        </div> */}
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t px-4">
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>2025 Qalio. All rights reserved.</span>
                <span>Confidential Assessment Report</span>
              </div>
            </div>
          </div>

          {/* Paginated "TOTAL STUDENTS PERFORMERS" section */}
          {paginatedStudents.map((pageCandidates, pageIndex) => (
            <div
              key={`students-page-${pageIndex}`}
              className="print-break-after-page bg-white min-h-screen flex flex-col"
            >
              {/* Header Logo */}
              <div className="flex items-center space-x-3 px-4 pt-0">
                <Image
                  alt="Skill Access Logo"
                  width={100}
                  height={60}
                  src="/images/skill_access_logo.png"
                />
                {user.role === "company" && (
                  <>
                    <div className="w-5  h-5 rounded-full bg-[#CDE7EB] flex items-center justify-center text-[#219CAE] font-bold text-l ">
                      &
                    </div>
                    {/* Partner SVG Logo */}
                    <Image
                      alt="Partner Logo"
                      width={100}
                      height={60}
                      src="/images/protonshub.svg" // replace with actual path/
                    />
                  </>
                )}
              </div>
              {/* Page Content */}
              <div className="p-4 flex-1">
                <div className="flex flex-row gap-3">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    className="w-6 h-6"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M0 2C0 1.46957 0.210714 0.960859 0.585786 0.585786C0.960859 0.210714 1.46957 0 2 0H16C16.5304 0 17.0391 0.210714 17.4142 0.585786C17.7893 0.960859 18 1.46957 18 2V16C18 16.5304 17.7893 17.0391 17.4142 17.4142C17.0391 17.7893 16.5304 18 16 18H2C1.46957 18 0.960859 17.7893 0.585786 17.4142C0.210714 17.0391 0 16.5304 0 16V2ZM16 2H2V16H16V2ZM9 4C9.26522 4 9.51957 4.10536 9.70711 4.29289C9.89464 4.48043 10 4.73478 10 5V13C10 13.2652 9.89464 13.5196 9.70711 13.7071C9.51957 13.8946 9.26522 14 9 14C8.73478 14 8.48043 13.8946 8.29289 13.7071C8.10536 13.5196 8 13.2652 8 13V5C8 4.73478 8.10536 4.48043 8.29289 4.29289C8.48043 4.10536 8.73478 4 9 4ZM13 6C13.2652 6 13.5196 6.10536 13.7071 6.29289C13.8946 6.48043 14 6.73478 14 7V13C14 13.2652 13.8946 13.5196 13.7071 13.7071C13.5196 13.8946 13.2652 14 13 14C12.7348 14 12.4804 13.8946 12.2929 13.7071C12.1054 13.5196 12 13.2652 12 13V7C12 6.73478 12.1054 6.48043 12.2929 6.29289C12.4804 6.10536 12.7348 6 13 6ZM5 8C5.26522 8 5.51957 8.10536 5.70711 8.29289C5.89464 8.48043 6 8.73478 6 9V13C6 13.2652 5.89464 13.5196 5.70711 13.7071C5.51957 13.8946 5.26522 14 5 14C4.73478 14 4.48043 13.8946 4.29289 13.7071C4.10536 13.5196 4 13.2652 4 13V9C4 8.73478 4.10536 8.48043 4.29289 8.29289C4.48043 8.10536 4.73478 8 5 8Z"
                      fill="#219CAE"
                    />
                  </svg>

                  <h2 className="text-xl font-bold text-[#219CAE] mb-6">
                    TOTAL STUDENTS PERFORMERS
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#F9FAFB] text-[#219CAE] border-b">
                        <th className="px-2 py-1 text-left font-semibold">
                          No.
                        </th>
                        <th className="px-2 py-1 text-left font-semibold">
                          Name
                        </th>
                        <th className="px-2 py-1 text-left font-semibold">
                          Score (%)
                        </th>
                        <th className="px-2 py-1 text-left font-semibold">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageCandidates.map((candidate) => {
                        const overallIndex =
                          sortedCandidates.indexOf(candidate); // Get global index for medal logic
                        const percentage = (
                          (candidate.numericScore / assessment.totalMarks) *
                          100
                        ).toFixed(1);
                        const isShortlisted = shortlistedCandidates.some(
                          (sc) => sc.studentId === candidate.studentId
                        );
                        // Determine medal color
                        let medalColor = "";
                        if (overallIndex === 0) {
                          medalColor = "text-yellow-500";
                        } else if (overallIndex === 1) {
                          medalColor = "text-gray-400";
                        } else if (overallIndex === 2) {
                          medalColor = "text-amber-700";
                        }
                        return (
                          <tr
                            key={candidate.studentId}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className={`px-2 py-1 font-semibold`}>
                              {overallIndex === 0 ? (
                                <span className="text-black inline-flex items-center gap-1">
                                  {overallIndex + 1}
                                </span>
                              ) : overallIndex === 1 ? (
                                <span className="text-black inline-flex items-center gap-1">
                                  {overallIndex + 1}
                                </span>
                              ) : overallIndex === 2 ? (
                                <span className="text-black inline-flex items-center gap-1">
                                  {overallIndex + 1}
                                </span>
                              ) : (
                                overallIndex + 1
                              )}
                            </td>
                            <td
                              className={`px-2 py-1 ${
                                overallIndex === 0
                                  ? "text-black"
                                  : overallIndex === 1
                                  ? "text-black"
                                  : overallIndex === 2
                                  ? "text-black"
                                  : ""
                              }`}
                            >
                              {candidate.name}
                            </td>
                            <td
                              className={`px-2 py-1 ${
                                overallIndex === 0
                                  ? "text-black"
                                  : overallIndex === 1
                                  ? "text-black"
                                  : overallIndex === 2
                                  ? "text-black"
                                  : ""
                              }`}
                            >
                              <span className="font-medium">
                                {candidate.numericScore}/{assessment.totalMarks}
                              </span>
                              <div className="text-[10px] text-gray-500">
                                ({percentage}%)
                              </div>
                            </td>
                            <td className="px-2 py-1">
                              <span
                                className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                                  isShortlisted
                                    ? "bg-green-100 text-black"
                                    : "bg-red-100 text-black"
                                }`}
                              >
                                {isShortlisted ? "SHORTLISTED" : "REJECTED"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-8 pt-4 border-t px-4">
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>2025 Qalio. All rights reserved.</span>
                  <span>Confidential Assessment Report</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
