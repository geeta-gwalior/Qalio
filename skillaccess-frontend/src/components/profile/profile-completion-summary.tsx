"use client";

import { useState } from "react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ProfileCompletionSummaryProps {
  profileData: {
    basicInfo: any | null;
    education: any | null;
    skills: any | null;
    portfolio: any | null;
    workExperience: any | null;
    documents: any | null;
  };
  onSubmit: () => void;
  isLoading: boolean;
  isEditMode?: boolean;
}

export default function ProfileCompletionSummary({
  profileData,
  onSubmit,
  isLoading,
  isEditMode = false,
}: ProfileCompletionSummaryProps) {
  const [openSections, setOpenSections] = useState({
    basicInfo: false,
    education: false,
    skills: false,
    portfolio: false,
    workExperience: false,
    documents: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections({
      ...openSections,
      [section]: !openSections[section as keyof typeof openSections],
    });
  };

  const completedSteps = Object.entries(profileData).filter(
    ([key, value]) => key !== "workExperience" && value !== null
  ).length;
  const totalSteps = Object.keys(profileData).length - 1; // Exclude workExperience
  const completionPercentage = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Profile Completion Summary</h2>
        <p className="text-sm text-gray-500">
          Review your profile information before finalizing. You can go back to
          any section to make changes.
        </p>
      </div>

      <Card className="border-none bg-green-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Profile Completion</h3>
              <p className="text-sm text-gray-600">
                {completedSteps} of {totalSteps} sections completed
              </p>
            </div>
            <div className="text-2xl font-bold text-green-600">
              {completionPercentage}%
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {/* Basic Info */}
        <Collapsible open={openSections.basicInfo}>
          <Card
            className={`border ${
              profileData.basicInfo ? "border-green-200" : "border-amber-200"
            }`}
          >
            <CardHeader
              className={`flex flex-row items-center justify-between p-4 ${
                profileData.basicInfo ? "bg-green-50" : "bg-amber-50"
              }`}
            >
              <div className="flex items-center">
                {profileData.basicInfo ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                )}
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </div>
              <CollapsibleTrigger asChild>
                <button
                  onClick={() => toggleSection("basicInfo")}
                  className="rounded-full p-1 hover:bg-black/5"
                >
                  {openSections.basicInfo ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </CollapsibleTrigger>
            </CardHeader>

            <CollapsibleContent>
              <CardContent className="p-4">
                {profileData.basicInfo ? (
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Date of Birth</p>
                      <p>
                        {profileData.basicInfo.dob
                          ? new Date(
                              profileData.basicInfo.dob
                            ).toLocaleDateString()
                          : "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Gender</p>
                      <p className="capitalize">
                        {profileData.basicInfo.gender || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Alternate Contact</p>
                      <p>
                        {profileData.basicInfo.altContactNumber ||
                          "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Aadhar Number</p>
                      <p>
                        {profileData.basicInfo.aadharNumber
                          ? "●●●●●●●●" +
                            profileData.basicInfo.aadharNumber.slice(-4)
                          : "Not provided"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-amber-600">Please complete this section</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Education */}
        <Card
          className={`border ${
            profileData.education ? "border-green-200" : "border-amber-200"
          }`}
        >
          <Collapsible open={openSections.education}>
            <CardHeader
              className={`flex flex-row items-center justify-between p-4 ${
                profileData.education ? "bg-green-50" : "bg-amber-50"
              }`}
            >
              <div className="flex items-center">
                {profileData.education ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                )}
                <CardTitle className="text-lg">Education</CardTitle>
              </div>
              <CollapsibleTrigger
                onClick={() => toggleSection("education")}
                className="rounded-full p-1 hover:bg-black/5"
              >
                {openSections.education ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-4">
                {profileData.education ? (
                  <div className="space-y-4">
                    {profileData.education.map((edu: any, index: number) => (
                      <div
                        key={index}
                        className="border-b pb-3 last:border-b-0 last:pb-0"
                      >
                        <p className="font-medium">{edu.instituteName}</p>
                        <p className="text-sm">
                          {edu.degree} in {edu.field}
                        </p>
                        <p className="text-xs text-gray-500">
                          {edu.startDate
                            ? new Date(edu.startDate).toLocaleDateString(
                                undefined,
                                { year: "numeric", month: "short" }
                              )
                            : ""}{" "}
                          -
                          {edu.isCurrentlyStudying
                            ? " Present"
                            : edu.endDate
                            ? " " +
                              new Date(edu.endDate).toLocaleDateString(
                                undefined,
                                { year: "numeric", month: "short" }
                              )
                            : " Not specified"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-amber-600">Please complete this section</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Skills */}
        {/* Skills */}
        <Card
          className={`border ${
            profileData.skills ? "border-green-200" : "border-amber-200"
          }`}
        >
          <Collapsible open={openSections.skills}>
            <CardHeader
              className={`flex flex-row items-center justify-between p-4 ${
                profileData.skills ? "bg-green-50" : "bg-amber-50"
              }`}
            >
              <div className="flex items-center">
                {profileData.skills ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                )}
                <CardTitle className="text-lg">Skills</CardTitle>
              </div>
              <CollapsibleTrigger
                onClick={() => toggleSection("skills")}
                className="rounded-full p-1 hover:bg-black/5"
              >
                {openSections.skills ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-4">
                {profileData.skills ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">Technical Skills</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profileData.skills.technicalSkills?.map(
                          (skill: string, index: number) => (
                            <span
                              key={index}
                              className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                            >
                              {skill}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">Preferred Job Roles</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {profileData.skills.preferredJobRoles?.map(
                          (role: string, index: number) => (
                            <span
                              key={index}
                              className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded"
                            >
                              {role}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-amber-600">Please complete this section</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Portfolio */}
        <Card
          className={`border ${
            profileData.portfolio ? "border-green-200" : "border-amber-200"
          }`}
        >
          <Collapsible open={openSections.portfolio}>
            <CardHeader
              className={`flex flex-row items-center justify-between p-4 ${
                profileData.portfolio ? "bg-green-50" : "bg-amber-50"
              }`}
            >
              <div className="flex items-center">
                {profileData.portfolio ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                )}
                <CardTitle className="text-lg">Portfolio</CardTitle>
              </div>
              <CollapsibleTrigger
                onClick={() => toggleSection("portfolio")}
                className="rounded-full p-1 hover:bg-black/5"
              >
                {openSections.portfolio ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="p-4">
                {profileData.portfolio ? (
                  <div className="space-y-3">
                    {profileData.portfolio.map((item: any, index: number) => (
                      <div
                        key={index}
                        className="border-b pb-2 last:border-b-0 last:pb-0"
                      >
                        <p className="font-medium">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.type}</p>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {item.url}
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-amber-600">Please complete this section</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Work Experience */}
        <Card
          className={`border ${
            profileData.workExperience ? "border-green-200" : "border-amber-200"
          }`}
        >
          <Collapsible open={openSections.workExperience}>
            <CardHeader
              className={`flex flex-row items-center justify-between p-4 ${
                profileData.workExperience ? "bg-green-50" : "bg-amber-50"
              }`}
            >
              <div className="flex items-center">
                {profileData.workExperience ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                )}
                <CardTitle className="text-lg">
                  Work Experience{" "}
                  <span className="text-sm font-normal text-gray-500">
                    (Optional)
                  </span>
                </CardTitle>
              </div>
              <CollapsibleTrigger
                onClick={() => toggleSection("workExperience")}
                className="rounded-full p-1 hover:bg-black/5"
              >
                {openSections.workExperience ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </CollapsibleTrigger>
            </CardHeader>

            <CollapsibleContent>
              <CardContent className="p-4">
                {profileData.workExperience ? (
                  <div className="space-y-4">
                    {profileData.workExperience.internships?.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Internships</p>
                        {profileData.workExperience.internships.map(
                          (exp: any, index: number) => (
                            <div
                              key={index}
                              className="border-b pb-2 last:border-b-0 last:pb-0 mb-2"
                            >
                              <p className="font-medium">
                                {exp.position} at {exp.companyName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {exp.startDate
                                  ? new Date(exp.startDate).toLocaleDateString(
                                      undefined,
                                      {
                                        year: "numeric",
                                        month: "short",
                                      }
                                    )
                                  : ""}{" "}
                                -
                                {exp.isCurrentlyWorking
                                  ? " Present"
                                  : exp.endDate
                                  ? " " +
                                    new Date(exp.endDate).toLocaleDateString(
                                      undefined,
                                      {
                                        year: "numeric",
                                        month: "short",
                                      }
                                    )
                                  : ""}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {profileData.workExperience.jobs?.length > 0 && (
                      <div>
                        <p className="font-medium mb-2">Jobs</p>
                        {profileData.workExperience.jobs.map(
                          (job: any, index: number) => (
                            <div
                              key={index}
                              className="border-b pb-2 last:border-b-0 last:pb-0 mb-2"
                            >
                              <p className="font-medium">
                                {job.position} at {job.companyName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {job.startDate
                                  ? new Date(job.startDate).toLocaleDateString(
                                      undefined,
                                      {
                                        year: "numeric",
                                        month: "short",
                                      }
                                    )
                                  : ""}{" "}
                                -
                                {job.isCurrentlyWorking
                                  ? " Present"
                                  : job.endDate
                                  ? " " +
                                    new Date(job.endDate).toLocaleDateString(
                                      undefined,
                                      {
                                        year: "numeric",
                                        month: "short",
                                      }
                                    )
                                  : ""}
                              </p>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    {!profileData.workExperience.internships?.length &&
                      !profileData.workExperience.jobs?.length && (
                        <p className="text-gray-500">
                          No work experience added
                        </p>
                      )}
                  </div>
                ) : (
                  <p className="text-amber-600">Please complete this section</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {/* Documents */}
        <Card
          className={`border ${
            profileData.documents ? "border-green-200" : "border-amber-200"
          }`}
        >
          <Collapsible open={openSections.documents}>
            <CardHeader
              className={`flex flex-row items-center justify-between p-4 ${
                profileData.documents ? "bg-green-50" : "bg-amber-50"
              }`}
            >
              <div className="flex items-center">
                {profileData.documents ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                )}
                <CardTitle className="text-lg">Documents</CardTitle>
              </div>
              <CollapsibleTrigger
                onClick={() => toggleSection("documents")}
                className="rounded-full p-1 hover:bg-black/5"
              >
                {openSections.documents ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </CollapsibleTrigger>
            </CardHeader>

            <CollapsibleContent>
              <CardContent className="p-4">
                {profileData.documents ? (
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium">Resume</p>
                      {profileData.documents.resume ? (
                        <a
                          href={profileData.documents.resume}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Resume
                        </a>
                      ) : (
                        <p className="text-sm text-gray-500">Not provided</p>
                      )}
                    </div>

                    <div>
                      <p className="font-medium">Mark Sheets</p>
                      {profileData.documents.markSheets?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileData.documents.markSheets.map(
                            (url: string, index: number) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Mark Sheet {index + 1}
                              </a>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Not provided</p>
                      )}
                    </div>

                    <div>
                      <p className="font-medium">Certificates</p>
                      {profileData.documents.certificates?.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profileData.documents.certificates.map(
                            (url: string, index: number) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline"
                              >
                                Certificate {index + 1}
                              </a>
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Not provided</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-amber-600">Please complete this section</p>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>

      <div className="pt-4">
        <Button
          onClick={() => onSubmit()}
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={isLoading || completedSteps < totalSteps}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditMode ? "Updating Profile..." : "Completing Profile..."}
            </>
          ) : completedSteps < totalSteps ? (
            "Please Complete All Required Sections"
          ) : isEditMode ? (
            "Save Profile Changes"
          ) : (
            "Complete Profile"
          )}
        </Button>

        {completedSteps < totalSteps && (
          <p className="text-center text-amber-600 text-sm mt-2">
            You need to complete all required sections before finalizing your
            profile. Work experience is optional.
          </p>
        )}
      </div>
    </div>
  );
}
