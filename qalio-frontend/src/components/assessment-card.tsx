"use client";

import {
  MapPin,
  Clock,
  BookOpen,
  Award,
  CheckCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { AssessmentData } from "@/types/assessment";
import { useAssessmentStore } from "@/stores/assessmentStore";

interface AssessmentCardProps {
  assessment: AssessmentData;
  type: "progress" | "fraction";
}

export default function AssessmentCard({
  assessment,
  type,
}: AssessmentCardProps) {
  const router = useRouter();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No due date";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-slate-400";
    switch (status.toLowerCase()) {
      case "active":
        return "bg-emerald-500";
      case "inactive":
        return "bg-rose-500";
      case "completed":
        return "bg-indigo-500";
      case "upcoming":
        return "bg-amber-500";
      default:
        return "bg-slate-400";
    }
  };

  const getStartDateStatusText = () => {
    if (!assessment.startDate) return "No start date";

    const start = new Date(assessment.startDate);
    const now = new Date();
    const diffInDays = Math.ceil(
      (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays > 0)
      return `Starts in ${diffInDays} day${diffInDays > 1 ? "s" : ""}`;
    if (diffInDays === 0) return "Starts today";
    return `Started ${Math.abs(diffInDays)} day${
      Math.abs(diffInDays) > 1 ? "s" : ""
    } ago`;
  };

  const getDynamicStatus = () => {
    const now = new Date();
    const start = assessment.startDate ? new Date(assessment.startDate) : null;
    const end = assessment.endDate ? new Date(assessment.endDate) : null;

    if (start && now < start) return "upcoming";
    if (start && end && now >= start && now <= end) return "active";
    if (end && now > end) return "completed";
    return assessment.status || "inactive";
  };

  const getAssessmentIcon = () => {
    const icons = [
      <BookOpen key="bookOpen" className="h-5 w-5 text-white" />,
      <Award key="award" className="h-5 w-5 text-white" />,
      <CheckCircle key="checkCircle" className="h-5 w-5 text-white" />,
      <FileText key="fileText" className="h-5 w-5 text-white" />,
    ];
    const iconIndex = assessment._id ? assessment._id.length % icons.length : 0;
    return icons[iconIndex];
  };

  return (
    <Card className="overflow-hidden gap-0 p-5 rounded-2xl border-slate-200/80 bg-white shadow-xs hover:shadow-md transition-all duration-300">
      <CardContent className="px-0 p-0">
        <div>
          <div className="flex justify-between items-start">
            <div className="flex gap-3.5">
              <div className="h-11 w-11 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-xs">
                {getAssessmentIcon()}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 text-base">{assessment.name}</h3>
                <div className="flex items-center text-slate-500 text-xs mt-0.5">
                  <MapPin className="h-3.5 w-3.5 mr-1 text-slate-400" />
                  <span>{assessment.level || "General"}</span>
                </div>
                {assessment.createdBy?.name && (
                  <div className="flex items-center text-slate-400 text-xs mt-1">
                    <span>Created by: {assessment.createdBy.name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200/60">
              <span
                className={`h-2 w-2 rounded-full ${getStatusColor(
                  getDynamicStatus()
                )}`}
              />
              <span className="text-xs font-medium text-slate-600">
                {getStartDateStatusText()}
              </span>
            </div>
          </div>

          <div className="border-t border-dashed border-slate-200 mt-4 pt-3.5">
            <div className="flex justify-between items-center mb-3 text-xs text-slate-600">
              <div>
                <span className="font-semibold text-slate-800">Starts: </span>
                {formatDate(assessment.startDate)}
                {assessment.startDate &&
                  ` | ${formatTime(assessment.startDate)}`}
              </div>
              <div>
                <span className="font-semibold text-slate-800">Due: </span>
                {formatDate(assessment.endDate)}
                {assessment.endDate && ` | ${formatTime(assessment.endDate)}`}
              </div>
              <div className="flex items-center gap-1">
                <span
                  className={`h-2 w-2 rounded-full ${getStatusColor(
                    getDynamicStatus()
                  )}`}
                />
                <span className="font-medium text-slate-700 capitalize">
                  {getDynamicStatus()}
                </span>
              </div>
            </div>

            {(assessment.totalTime ||
              assessment.totalQuestionsCount ||
              assessment.totalMarks) && (
              <div className="flex items-center gap-4 mb-3 text-xs">
                {assessment.totalTime && (
                  <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60">
                    <Clock className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{assessment.totalTime} min</span>
                  </div>
                )}
                {assessment.totalQuestionsCount && (
                  <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60">
                    <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{assessment.totalQuestionsCount} questions</span>
                  </div>
                )}
                {assessment.totalMarks && (
                  <div className="flex items-center gap-1 text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200/60">
                    <Award className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{assessment.totalMarks} marks</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {(assessment.totalAttempts ||
            assessment.attemptCount !== undefined) && (
            <div className="flex items-center gap-2 mt-2">
              <p className="text-xs font-semibold text-slate-700">
                Attempts {type === "fraction" ? ":" : ""}
              </p>

              {type === "progress" && assessment.totalAttempts && (
                <div className="flex gap-1 flex-1 max-w-[400px]">
                  {Array.from({ length: assessment.totalAttempts }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className={`h-1.5 flex-1 rounded-full ${
                          index < (assessment.attemptCount || 0)
                            ? "bg-indigo-600"
                            : "bg-slate-200"
                        }`}
                      />
                    )
                  )}
                </div>
              )}

              {type === "fraction" && (
                <p className="text-xs font-medium text-slate-600">
                  {assessment.attemptsUsed || 0}/{assessment.totalAttempts || 0}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 p-0 w-full pt-4 mt-2 border-t border-slate-100">
        <Button
          onClick={() => {
            useAssessmentStore
              .getState()
              .setAssessmentInfo(
                assessment._id,
                assessment.attemptsUsed || 0,
                assessment.totalAttempts || 0
              );
            router.push(
              `/student/tests/assessment-details?id=${assessment._id}`
            );
          }}
          className="w-full rounded-xl h-10 font-semibold bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white border border-indigo-100 transition-all duration-200 shadow-xs"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}

