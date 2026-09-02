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
    if (!status) return "bg-gray-500";
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500";
      case "inactive":
        return "bg-red-500";
      case "completed":
        return "bg-blue-500";
      case "upcoming":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
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
      <BookOpen key="bookOpen" className="h-6 w-6 text-white" />,
      <Award key="award" className="h-6 w-6 text-white" />,
      <CheckCircle key="checkCircle" className="h-6 w-6 text-white" />,
      <FileText key="fileText" className="h-6 w-6 text-white" />,
    ];
    const iconIndex = assessment._id ? assessment._id.length % icons.length : 0;
    return icons[iconIndex];
  };

  return (
    <Card className="overflow-hidden mt-[0px] gap-0 p-4 pb-0">
      <CardContent className="px-0">
        <div className="">
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="h-12 w-12 bg-black rounded-md flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {getAssessmentIcon()}
                </span>
              </div>
              <div>
                <h3 className="font-medium">{assessment.name}</h3>
                <div className="flex items-center text-[#4C4C4C] text-sm">
                  <MapPin className="h-3.5 w-3.5 mr-1" />
                  <span>{assessment.level || "General"}</span>
                </div>
                {assessment.createdBy?.name && (
                  <div className="flex items-center text-[#6B7280] text-xs mt-1">
                    <span>Created by: {assessment.createdBy.name}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <span
                className={`h-2 w-2 rounded-full mr-1.5 ${getStatusColor(
                  getDynamicStatus()
                )}`}
              ></span>
              <span className="text-sm text-gray-600">
                {getStartDateStatusText()}
              </span>
            </div>
          </div>

          <div className="border-t-1 mt-3 border-dashed border-[#219CAE] pt-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <p className="text-md text-gray-600">
                  <span className="font-bold">Start on: </span>
                  {formatDate(assessment.startDate)}
                  {assessment.startDate &&
                    ` | ${formatTime(assessment.startDate)}`}
                </p>
              </div>
              <div>
                <p className="text-md text-gray-600">
                  <span className="font-bold">Due on: </span>
                  {formatDate(assessment.endDate)}
                  {assessment.endDate && ` | ${formatTime(assessment.endDate)}`}
                </p>
              </div>
              <div className="flex items-center">
                <span
                  className={`h-2 w-2 rounded-full mr-1.5 ${getStatusColor(
                    getDynamicStatus()
                  )}`}
                ></span>
                <span className="text-sm text-gray-600 capitalize">
                  {getDynamicStatus()}
                </span>
              </div>
            </div>

            {(assessment.totalTime ||
              assessment.totalQuestionsCount ||
              assessment.totalMarks) && (
              <div className="flex items-center gap-4 mb-3 text-sm">
                {assessment.totalTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-gray-500">
                      {assessment.totalTime} min
                    </span>
                  </div>
                )}
                {assessment.totalQuestionsCount && (
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-gray-500">
                      {assessment.totalQuestionsCount} questions
                    </span>
                  </div>
                )}
                {assessment.totalMarks && (
                  <div className="flex items-center gap-1">
                    <Award className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-gray-500">
                      {assessment.totalMarks} marks
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {(assessment.totalAttempts ||
            assessment.attemptCount !== undefined) && (
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600">
                <span className="font-bold">Attempts</span>{" "}
                {type === "fraction" ? ":" : ""}
              </p>

              {type === "progress" && assessment.totalAttempts && (
                <div className="flex gap-1 w-[159vh] max-w-[460px]">
                  {Array.from({ length: assessment.totalAttempts }).map(
                    (_, index) => (
                      <div
                        key={index}
                        className={`h-1 flex-1 rounded-full ${
                          index < (assessment.attemptCount || 0)
                            ? "bg-[#F68622]"
                            : "bg-gray-200"
                        }`}
                      />
                    )
                  )}
                </div>
              )}

              {type === "fraction" && (
                <p className="text-sm">
                  {assessment.attemptsUsed || 0}/{assessment.totalAttempts || 0}
                </p>
              )}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 p-0 w-full h-full py-4">
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
          variant="outline"
          className="flex-1 m-3 rounded-md h-12 border-t font-bold text-[#219CAE] border-[#219CAE] hover:bg-[#E6F5F9] hover:text-[#219CAE] hover:border-[#219CAE] focus:bg-[#E6F5F9] focus:text-[#219CAE] focus:border-[#219CAE]"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
