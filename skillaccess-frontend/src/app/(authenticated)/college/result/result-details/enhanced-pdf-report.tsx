"use client";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import SimplePDFReport from "@/components/common/pdf-report";
import { useRef } from "react";

interface AssessmentData {
  _id?: string;
  id?: string;
  name: string;
  level: string;
  startDate: string;
  endDate: string;
  totalMarks: number;
  totalTime?: number;
  totalQuestionsCount?: number;
  additionalDescription?: string;
  topics?: Array<{
    heading: string;
    description: string;
    selectedQuestions?: Array<{
      questionId: string;
      title: string;
      questionType: string;
      totalMarks: number;
    }>;
  }>;
  invitedStudents: any[];
  appearedStudents: any[];
  selectedStudents?: any[];
  rejectedStudents?: any[];
}

interface CandidateData {
  studentId?: string;
  name: string;
  email: string;
  phone?: string;
  totalMarksScored: number | string;
  percentage?: number;
  submittedAt: string;
  status?: "appeared" | "shortlisted";
  evaluatedStatus?: string;
}

interface PDFReportProps {
  assessment: AssessmentData;
  appearedCandidates: CandidateData[];
  shortlistedCandidates: CandidateData[];
}

export default function EnhancedPDFReport({
  assessment,
  appearedCandidates = [],
  shortlistedCandidates = [],
}: PDFReportProps) {
  // Safe number conversion
  const safeNumber = (value: number | string): number => {
    if (typeof value === "number" && !isNaN(value)) return value;
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Safe string conversion
  const safeString = (value: any): string => {
    if (typeof value === "string") return value;
    if (value === null || value === undefined) return "";
    return String(value);
  };

  // Transform data with comprehensive safety checks
  const transformedData = {
    assessment: {
      name: safeString(assessment?.name) || "Assessment Report",
      additionalDescription: safeString(assessment?.additionalDescription),
      totalTime: safeNumber(assessment?.totalTime ?? 0),
      totalMarks: safeNumber(assessment?.totalMarks) || 100,
      totalQuestionsCount: safeNumber(assessment?.totalQuestionsCount ?? 0),
      level: safeString(assessment?.level) || "N/A",
      startDate: safeString(assessment?.startDate),
      endDate: safeString(assessment?.endDate),
      assessmentId: safeString(assessment?._id || assessment?.id) || "N/A",
      topics: Array.isArray(assessment?.topics)
        ? assessment.topics.map((topic) => ({
            heading: safeString(topic?.heading) || "Untitled Topic",
            description: safeString(topic?.description) || "No description",
            weightage: topic?.selectedQuestions
              ? Math.round(
                  (topic.selectedQuestions.reduce(
                    (sum, q) => sum + safeNumber(q?.totalMarks),
                    0
                  ) /
                    safeNumber(assessment?.totalMarks || 100)) *
                    100
                )
              : 0,
          }))
        : [],
    },
    candidates: Array.isArray(appearedCandidates)
      ? appearedCandidates.map((candidate, index) => {
          const score = safeNumber(candidate?.totalMarksScored);
          const totalMarks = safeNumber(assessment?.totalMarks) || 100;
          const percentage = Math.round((score / totalMarks) * 100);
          const isSelected = Array.isArray(shortlistedCandidates)
            ? shortlistedCandidates.some(
                (sc) => sc?.studentId === candidate?.studentId
              )
            : false;

          return {
            id: safeString(candidate?.studentId) || `candidate-${index + 1}`,
            name: safeString(candidate?.name) || "Unknown",
            email: safeString(candidate?.email) || "unknown@example.com",
            score,
            percentage,
            status: isSelected ? "selected" : "not-selected",
            submittedAt: safeString(candidate?.submittedAt),
          };
        })
      : [],
    statistics: {
      totalCandidates: Array.isArray(appearedCandidates)
        ? appearedCandidates.length
        : 0,
      averageScore:
        Array.isArray(appearedCandidates) && appearedCandidates.length > 0
          ? appearedCandidates.reduce(
              (sum, candidate) => sum + safeNumber(candidate?.totalMarksScored),
              0
            ) / appearedCandidates.length
          : 0,
      highestScore:
        Array.isArray(appearedCandidates) && appearedCandidates.length > 0
          ? Math.max(
              ...appearedCandidates.map((c) => safeNumber(c?.totalMarksScored))
            )
          : 0,
      lowestScore:
        Array.isArray(appearedCandidates) && appearedCandidates.length > 0
          ? Math.min(
              ...appearedCandidates.map((c) => safeNumber(c?.totalMarksScored))
            )
          : 0,
      selectedCount: Array.isArray(shortlistedCandidates)
        ? shortlistedCandidates.length
        : 0,
      rejectedCount:
        (Array.isArray(appearedCandidates) ? appearedCandidates.length : 0) -
        (Array.isArray(shortlistedCandidates)
          ? shortlistedCandidates.length
          : 0),
      passRate:
        Array.isArray(appearedCandidates) && appearedCandidates.length > 0
          ? Math.round(
              ((Array.isArray(shortlistedCandidates)
                ? shortlistedCandidates.length
                : 0) /
                appearedCandidates.length) *
                100
            )
          : 0,
    },
  };

  const linkRef = useRef<HTMLAnchorElement>(null);

  const fileName = `Qalio_${(assessment?.name || "Assessment").replace(
    /[^a-z0-9]/gi,
    "_"
  )}_Report.pdf`;

  const handleDownload = async () => {
    const blob = await pdf(
      <SimplePDFReport transformedData={transformedData} />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    if (linkRef.current) {
      linkRef.current.href = url;
      linkRef.current.download = fileName;
      linkRef.current.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex justify-center">
      <Button
        onClick={handleDownload}
        className="bg-[#219CAE] hover:bg-[#1a7a8a] text-white px-6 py-2 flex items-center gap-2"
      >
        <Download className="h-4 w-4" />
        Download PDF Report
      </Button>
      <a ref={linkRef} />
    </div>
  );
}
